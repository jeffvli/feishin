import { queryOptions } from '@tanstack/react-query';

import { controller } from '/@/renderer/api/controller';
import { artistVariants, normalizeName } from '/@/renderer/features/discover/utils/library-match';
import {
    AlbumArtistListSort,
    AlbumListSort,
    SongListSort,
    SortOrder,
} from '/@/shared/types/domain-types';

/**
 * The user's library reduced to the handful of strings needed to recognise what they own.
 *
 * Arrays rather than Sets, and built in the query function rather than in a `select`, because
 * this is what gets written to IndexedDB. A `select` result is never persisted, so the raw
 * response would be: several thousand complete Song objects carrying genres, participants,
 * tags and lyrics, which is two orders of magnitude larger than what is actually needed.
 */
export interface LibraryIndexData {
    albumKeys: string[];
    albumMbids: string[];
    artistNames: string[];
    recordingMbids: string[];
    /** Track count at build time, recorded so a rebuild can be spotted as worthwhile. */
    songCount: number;
    /** Epoch millis, for showing how old the index is. */
    syncedAt: number;
    trackKeys: string[];
}

/**
 * Held indefinitely and refreshed in the background.
 *
 * A music library changes a few times a week at most, and building this index is the single
 * most expensive thing the Discover page does, so it is the wrong thing to repeat on a timer.
 * Instead it persists across restarts and revalidates once a day: the page renders instantly
 * from the stored copy while a fresh one is fetched behind it.
 */
const STALE_MS = 1000 * 60 * 60 * 24;

/** Marks the query as one the IndexedDB persister should keep. See `main.tsx`. */
export const LIBRARY_INDEX_KEY = 'discover-library-index';

async function buildLibraryIndex(
    serverId: string,
    signal?: AbortSignal,
): Promise<LibraryIndexData> {
    const apiClientProps = { serverId, signal };

    // Requested together rather than in sequence: they are independent, and the song list is
    // slow enough that waiting on it before starting the others would roughly double the wait.
    const [songs, albums, artists] = await Promise.all([
        controller.getSongList({
            apiClientProps,
            query: {
                limit: -1,
                sortBy: SongListSort.NAME,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            },
        }),
        controller.getAlbumList({
            apiClientProps,
            query: {
                limit: -1,
                sortBy: AlbumListSort.NAME,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            },
        }),
        controller.getAlbumArtistList({
            apiClientProps,
            query: {
                limit: -1,
                sortBy: AlbumArtistListSort.NAME,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            },
        }),
    ]);

    const trackKeys = new Set<string>();
    const recordingMbids = new Set<string>();

    for (const song of songs.items) {
        const title = normalizeName(song.name);

        // Both credits are indexed because a track's own artist and its album artist differ on
        // compilations, and ListenBrainz may report either one.
        for (const credit of [song.artistName, song.albumArtistName]) {
            for (const artist of artistVariants(credit ?? '')) {
                if (artist) {
                    trackKeys.add(`${artist}|${title}`);
                }
            }
        }

        if (song.mbzRecordingId) {
            recordingMbids.add(song.mbzRecordingId);
        }
    }

    const albumKeys = new Set<string>();
    const albumMbids = new Set<string>();

    for (const album of albums.items) {
        const name = normalizeName(album.name);

        // `albumArtistName` is the only artist field every backend populates; `albumArtists` is
        // filled from participants on Navidrome and is absent when the server omits them.
        for (const credit of [
            album.albumArtistName,
            ...(album.albumArtists ?? []).map((a) => a.name),
        ]) {
            for (const artist of artistVariants(credit ?? '')) {
                if (artist) {
                    albumKeys.add(`${artist}|${name}`);
                }
            }
        }

        if (album.mbzId) {
            albumMbids.add(album.mbzId);
        }

        if (album.mbzReleaseGroupId) {
            albumMbids.add(album.mbzReleaseGroupId);
        }
    }

    const artistNames = new Set<string>();

    for (const artist of artists.items) {
        for (const variant of artistVariants(artist.name)) {
            if (variant) {
                artistNames.add(variant);
            }
        }
    }

    return {
        albumKeys: [...albumKeys],
        albumMbids: [...albumMbids],
        artistNames: [...artistNames],
        recordingMbids: [...recordingMbids],
        songCount: songs.items.length,
        syncedAt: Date.now(),
        trackKeys: [...trackKeys],
    };
}

export const libraryIndexQueries = {
    index: (serverId: string) =>
        queryOptions({
            gcTime: Infinity,
            queryFn: ({ signal }) => buildLibraryIndex(serverId, signal),
            queryKey: [LIBRARY_INDEX_KEY, serverId] as const,
            // A stale index still filters correctly for everything it already knows about, so
            // serving it while the refresh runs is strictly better than making the user wait.
            refetchOnWindowFocus: false,
            staleTime: STALE_MS,
        }),
};
