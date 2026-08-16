import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { DiscoverItem } from '/@/renderer/features/discover/utils/lb-adapters';
import { useCurrentServerId } from '/@/renderer/store';
import {
    Album,
    AlbumArtist,
    AlbumArtistListSort,
    AlbumListSort,
    SortOrder,
} from '/@/shared/types/domain-types';

/**
 * What the user already owns, in the two forms a ListenBrainz item can be matched against.
 *
 * `isReady` is the important field. An index that has not loaded is indistinguishable from a
 * library containing nothing, and filtering against an empty index would silently hide the
 * difference. Callers must not filter until this is true.
 */
export interface LibraryIndex {
    /** `artist|album`, both normalized. */
    albumKeys: Set<string>;
    /** MusicBrainz release and release-group ids. Empty on Subsonic, which reports neither. */
    albumMbids: Set<string>;
    artistNames: Set<string>;
    isReady: boolean;
}

const EMPTY_INDEX: LibraryIndex = {
    albumKeys: new Set(),
    albumMbids: new Set(),
    artistNames: new Set(),
    isReady: false,
};

/** The key an album is matched on when no MusicBrainz id is available on either side. */
export function albumKey(artistName: string, albumName: string): string {
    return `${normalizeName(artistName)}|${normalizeName(albumName)}`;
}

/**
 * Drop everything the user already owns, which is the whole point of a Discover page.
 *
 * Returns the list untouched until the index has loaded. Filtering against a half-built index
 * would hide nothing on the first render and then quietly drop rows on the second, which reads
 * as flicker rather than as loading.
 *
 * A track is matched on its release rather than on itself: owning the album implies owning the
 * track, and confirming a track directly would mean pulling the full song list, which is an
 * order of magnitude larger than the album list for no additional precision.
 */
export function filterOwnedItems(items: DiscoverItem[], index: LibraryIndex): DiscoverItem[] {
    if (!index.isReady) {
        return items;
    }

    return items.filter((item) => {
        if (item.kind === 'artist') {
            return !index.artistNames.has(normalizeName(item.artistName));
        }

        if (item.releaseMbids.some((mbid) => index.albumMbids.has(mbid))) {
            return false;
        }

        // Nothing to match on. Showing it is the safer error: a duplicate is a mild annoyance,
        // whereas hiding a genuine suggestion defeats the feature.
        if (!item.albumName) {
            return true;
        }

        return !index.albumKeys.has(albumKey(item.artistName, item.albumName));
    });
}

/**
 * Case, punctuation and bracketed suffixes all vary between what a server stores and what
 * MusicBrainz calls the same record, so "Antidotes (Deluxe Edition)" has to match "Antidotes".
 */
export function normalizeName(value: string): string {
    return value
        .toLowerCase()
        .replace(/\(.*?\)|\[.*?\]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

/**
 * The user's whole album and album-artist list, reduced to lookup sets.
 *
 * Fetched once per session rather than per item: a search-by-name per recommendation would be
 * one HTTP round trip each, and the Subsonic backend answers a search by paging `search3` until
 * exhausted, so the per-item cost is far worse than one full list.
 *
 * `limit: -1` is the codebase's existing "everything" sentinel. Jellyfin maps it to no limit and
 * Navidrome to `_end: -1`, both of which return the full list. Subsonic has no handling for it
 * and its `sortAndPaginate` ends up slicing to `-1`, dropping the final entry; one missing album
 * only means one extra suggestion is shown, so this does not special-case it.
 */
export function useLibraryIndex(enabled: boolean): LibraryIndex {
    const serverId = useCurrentServerId();
    const canFetch = enabled && Boolean(serverId);

    const [albums, artists] = useQueries({
        queries: [
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
                // Project inside `select` so the response's full Album objects, which carry
                // genres, participants, tags and release types, are collected rather than held
                // for the session. A large library is tens of megabytes in that form.
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
        if (!albums.data || !artists.data) {
            return EMPTY_INDEX;
        }

        return {
            albumKeys: albums.data.keys,
            albumMbids: albums.data.mbids,
            artistNames: artists.data,
            isReady: true,
        };
    }, [albums.data, artists.data]);
}

/** The library changes rarely and a full list is expensive, so hold it for the session. */
const CACHE_MS = 1000 * 60 * 60;

function selectAlbums(response: { items: Album[] }) {
    const keys = new Set<string>();
    const mbids = new Set<string>();

    for (const album of response.items) {
        // `albumArtistName` is the only artist field every backend populates; `albumArtists` is
        // filled from participants on Navidrome and is absent when the server omits them.
        keys.add(albumKey(album.albumArtistName ?? '', album.name));

        for (const artist of album.albumArtists ?? []) {
            keys.add(albumKey(artist.name, album.name));
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
    return new Set(response.items.map((artist) => normalizeName(artist.name)));
}
