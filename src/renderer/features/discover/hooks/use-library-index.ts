import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { DiscoverItem } from '/@/renderer/features/discover/utils/lb-adapters';
import {
    artistVariants,
    normalizeName,
    pairKey,
} from '/@/renderer/features/discover/utils/library-match';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { useCurrentServerId } from '/@/renderer/store';
import {
    Album,
    AlbumArtist,
    AlbumArtistListSort,
    AlbumListSort,
    Song,
    SongListSort,
    SortOrder,
} from '/@/shared/types/domain-types';

/**
 * What the user already owns, in every form a ListenBrainz item can be matched against.
 *
 * `isReady` is the important field. An index that has not loaded is indistinguishable from a
 * library containing nothing, and the page must show nothing rather than show music the user
 * already owns, so callers wait on this rather than filtering against a partial index.
 */
export interface LibraryIndex {
    /** `artist|album`, both normalized. */
    albumKeys: Set<string>;
    /** MusicBrainz release and release-group ids. Empty on Subsonic, which reports neither. */
    albumMbids: Set<string>;
    artistNames: Set<string>;
    isReady: boolean;
    /** MusicBrainz recording ids, the exact key for a track when the server has tagged one. */
    recordingMbids: Set<string>;
    /** `artist|track`, both normalized. The fallback when no recording id is available. */
    trackKeys: Set<string>;
}

const EMPTY_INDEX: LibraryIndex = {
    albumKeys: new Set(),
    albumMbids: new Set(),
    artistNames: new Set(),
    isReady: false,
    recordingMbids: new Set(),
    trackKeys: new Set(),
};

/**
 * Drop everything the user already owns, which is the whole point of a Discover page.
 *
 * Tracks are matched as tracks, not through their release. ListenBrainz reports the canonical
 * MusicBrainz release, which is routinely not the one in the library: it files "Wasteland" by
 * 10 Years under "Killing All That Holds You" where the library has an album called
 * "Wasteland". Album matching therefore missed nearly everything it should have caught.
 */
export function filterOwnedItems(items: DiscoverItem[], index: LibraryIndex): DiscoverItem[] {
    if (!index.isReady) {
        return [];
    }

    return items.filter((item) => {
        const artists = artistVariants(item.artistName);

        if (item.kind === 'artist') {
            return !artists.some((artist) => index.artistNames.has(artist));
        }

        if (item.kind === 'track') {
            if (item.recordingMbid && index.recordingMbids.has(item.recordingMbid)) {
                return false;
            }

            const title = normalizeName(item.title);

            return !artists.some((artist) => index.trackKeys.has(`${artist}|${title}`));
        }

        if (item.releaseMbids.some((mbid) => index.albumMbids.has(mbid))) {
            return false;
        }

        if (!item.albumName) {
            return true;
        }

        const album = normalizeName(item.albumName);

        return !artists.some((artist) => index.albumKeys.has(`${artist}|${album}`));
    });
}

/**
 * The user's library reduced to lookup sets.
 *
 * The song list is the expensive part and the one that matters: album matching cannot identify
 * a track, because the release ListenBrainz names is usually not the release the user owns.
 *
 * `limit: -1` is the codebase's existing "everything" sentinel. Jellyfin maps it to no limit and
 * Navidrome to `_end: -1`, which is the same value the radio and playlist-song fetches already
 * use for this purpose. Subsonic has no handling for it and its `sortAndPaginate` ends up
 * slicing to `-1`, dropping the final entry; one missing track only means one extra suggestion.
 */
export function useLibraryIndex(enabled: boolean): LibraryIndex {
    const serverId = useCurrentServerId();
    const canFetch = enabled && Boolean(serverId);

    const [songs, albums, artists] = useQueries({
        queries: [
            {
                ...songsQueries.list({
                    query: {
                        limit: -1,
                        sortBy: SongListSort.NAME,
                        sortOrder: SortOrder.ASC,
                        startIndex: 0,
                    },
                    serverId,
                }),
                enabled: canFetch,
                gcTime: CACHE_MS,
                // Project inside `select` so the response's full Song objects, which carry
                // genres, participants, tags and lyrics, are collected rather than held for the
                // session. A library of several thousand tracks is large in that form.
                select: selectSongs,
                staleTime: CACHE_MS,
            },
            {
                ...albumQueries.list({
                    query: {
                        limit: -1,
                        sortBy: AlbumListSort.NAME,
                        sortOrder: SortOrder.ASC,
                        startIndex: 0,
                    },
                    serverId,
                }),
                enabled: canFetch,
                gcTime: CACHE_MS,
                select: selectAlbums,
                staleTime: CACHE_MS,
            },
            {
                ...artistsQueries.albumArtistList({
                    query: {
                        limit: -1,
                        sortBy: AlbumArtistListSort.NAME,
                        sortOrder: SortOrder.ASC,
                        startIndex: 0,
                    },
                    serverId,
                }),
                enabled: canFetch,
                gcTime: CACHE_MS,
                select: selectArtists,
                staleTime: CACHE_MS,
            },
        ],
    });

    return useMemo(() => {
        if (!songs.data || !albums.data || !artists.data) {
            return EMPTY_INDEX;
        }

        return {
            albumKeys: albums.data.keys,
            albumMbids: albums.data.mbids,
            artistNames: artists.data,
            isReady: true,
            recordingMbids: songs.data.mbids,
            trackKeys: songs.data.keys,
        };
    }, [songs.data, albums.data, artists.data]);
}

/** The library changes rarely and a full list is expensive, so hold it for the session. */
const CACHE_MS = 1000 * 60 * 60;

function selectAlbums(response: { items: Album[] }) {
    const keys = new Set<string>();
    const mbids = new Set<string>();

    for (const album of response.items) {
        // `albumArtistName` is the only artist field every backend populates; `albumArtists` is
        // filled from participants on Navidrome and is absent when the server omits them.
        for (const artist of artistVariants(album.albumArtistName ?? '')) {
            keys.add(`${artist}|${normalizeName(album.name)}`);
        }

        for (const artist of album.albumArtists ?? []) {
            keys.add(pairKey(artist.name, album.name));
        }

        if (album.mbzId) {
            mbids.add(album.mbzId);
        }

        if (album.mbzReleaseGroupId) {
            mbids.add(album.mbzReleaseGroupId);
        }
    }

    return { keys, mbids };
}

function selectArtists(response: { items: AlbumArtist[] }) {
    const names = new Set<string>();

    for (const artist of response.items) {
        for (const variant of artistVariants(artist.name)) {
            names.add(variant);
        }
    }

    return names;
}

function selectSongs(response: { items: Song[] }) {
    const keys = new Set<string>();
    const mbids = new Set<string>();

    for (const song of response.items) {
        const title = normalizeName(song.name);

        // Both credits are indexed because a track's own artist and its album artist differ on
        // compilations, and ListenBrainz may report either one.
        for (const credit of [song.artistName, song.albumArtistName]) {
            for (const artist of artistVariants(credit ?? '')) {
                if (artist) {
                    keys.add(`${artist}|${title}`);
                }
            }
        }

        if (song.mbzRecordingId) {
            mbids.add(song.mbzRecordingId);
        }
    }

    return { keys, mbids };
}
