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
    /**
     * Normalized artist name to total plays across their tracks, for artists with any.
     *
     * Pairs rather than an object because this is written to IndexedDB alongside the arrays
     * above, and optional because an index persisted before this field existed will not have
     * one. Artists with no plays are left out: they are the majority of the map and zero is
     * what their absence already means.
     */
    artistPlays?: Array<[string, number]>;
    /**
     * Artists the library holds a real amount of and hardly ever plays.
     *
     * Kept so Discover can point its similarity calls somewhere other than this month's
     * rotation. Every other source on that page is seeded from recent listening and therefore
     * returns more of it; these are the corners of a collection the owner chose deliberately
     * and then stopped visiting, which is a direction rather than a random one.
     *
     * Selected and capped here rather than in the renderer because the alternative is
     * persisting every artist in the library to say something about a hundred of them.
     */
    neglectedArtists?: NeglectedArtist[];
    recordingMbids: string[];
    /** Track count at build time, recorded so a rebuild can be spotted as worthwhile. */
    songCount: number;
    /** Epoch millis, for showing how old the index is. */
    syncedAt: number;
    trackKeys: string[];
}

/** An artist in the library that is owned in quantity and played rarely. */
export interface NeglectedArtist {
    /** Their first genre, which is what spreads the seeds across the library rather than one shelf. */
    genre: null | string;
    /**
     * MusicBrainz artist id, when the server has one.
     *
     * Null for most libraries. Navidrome reports what the files carry, and a collection ripped
     * or downloaded outside the MusicBrainz ecosystem carries no MusicBrainz tags at all. The
     * similarity endpoints take nothing but an id, so the renderer resolves the null ones by
     * name against the listener's own ListenBrainz statistics.
     */
    mbid: null | string;
    name: string;
    plays: number;
    tracks: number;
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

/**
 * How many tracks an artist has to be represented by before their neglect means anything.
 *
 * Four is roughly an EP. Below it the library is describing a guest credit or a compilation
 * appearance rather than a collection, and those are exactly the entries that look neglected
 * while saying nothing: a server that credits every participant lists a great many of them.
 */
const NEGLECTED_MIN_TRACKS = 4;

/** Above one play per owned track an artist is in rotation, not neglected. */
const NEGLECTED_MAX_PLAYS_PER_TRACK = 1;

/**
 * Enough to pick a spread of genres from without persisting the whole artist list.
 *
 * Held higher than the handful of seeds it feeds because most entries cannot be resolved to a
 * MusicBrainz id, and an unresolvable one is skipped rather than seeded from.
 */
const NEGLECTED_LIMIT = 300;

/** Marks the query as one the IndexedDB persister should keep. See `main.tsx`. */
export const LIBRARY_INDEX_KEY = 'discover-library-index';

/**
 * Bumped whenever `LibraryIndexData` gains a field the page reads.
 *
 * The index is persisted and revalidated once a day, so without this a stored copy built by an
 * older build satisfies the cache for another twenty-four hours and every new field reads as
 * empty. That is silent: a row seeded from a missing field renders as a row with nothing in it,
 * which is indistinguishable from one the filters emptied. Part of the query key, so a bump
 * simply misses the stored copy and rebuilds.
 */
export const INDEX_VERSION = 3;

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
    const artistPlays = new Map<string, number>();

    for (const song of songs.items) {
        const title = normalizeName(song.name);

        // Both credits are indexed because a track's own artist and its album artist differ on
        // compilations, and ListenBrainz may report either one. Collected as a set first so a
        // track whose two credits agree, which is most of them, counts its plays once.
        const credits = new Set<string>();

        for (const credit of [song.artistName, song.albumArtistName]) {
            for (const artist of artistVariants(credit ?? '')) {
                if (artist) {
                    credits.add(artist);
                }
            }
        }

        for (const artist of credits) {
            trackKeys.add(`${artist}|${title}`);
            artistPlays.set(artist, (artistPlays.get(artist) ?? 0) + (song.playCount ?? 0));
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

    /*
     * Owned in quantity and played rarely.
     *
     * The track floor is doing more work than it looks. It is what separates an artist the
     * owner went and collected from one the library knows about only because a server credits
     * every participant on a compilation, which is a real distinction here: a single guest
     * appearance would otherwise be indistinguishable from a neglected discography, and
     * seeding from it would say nothing about anyone's taste.
     *
     * Ranked by plays per owned track, so a record bought and never opened outranks one played
     * twice, and a large neglected discography outranks a single neglected album.
     */
    const neglectedArtists = artists.items
        .filter((artist) => (artist.songCount ?? 0) >= NEGLECTED_MIN_TRACKS)
        .map((artist) => ({
            genre: artist.genres[0]?.name ?? null,
            mbid: artist.mbz,
            name: artist.name,
            plays: artist.playCount ?? 0,
            tracks: artist.songCount as number,
        }))
        .filter((artist) => artist.plays / artist.tracks <= NEGLECTED_MAX_PLAYS_PER_TRACK)
        .sort((a, b) => a.plays / a.tracks - b.plays / b.tracks || b.tracks - a.tracks)
        .slice(0, NEGLECTED_LIMIT);

    return {
        albumKeys: [...albumKeys],
        albumMbids: [...albumMbids],
        artistNames: [...artistNames],
        artistPlays: [...artistPlays].filter(([, plays]) => plays > 0),
        neglectedArtists,
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
            queryKey: [LIBRARY_INDEX_KEY, serverId, INDEX_VERSION] as const,
            // A stale index still filters correctly for everything it already knows about, so
            // serving it while the refresh runs is strictly better than making the user wait.
            refetchOnWindowFocus: false,
            staleTime: STALE_MS,
        }),
};
