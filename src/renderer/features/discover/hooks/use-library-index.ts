import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { libraryIndexQueries } from '/@/renderer/features/discover/api/library-index-api';
import { DiscoverItem } from '/@/renderer/features/discover/utils/lb-adapters';
import { artistVariants, normalizeName } from '/@/renderer/features/discover/utils/library-match';
import { useCurrentServerId } from '/@/renderer/store';

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
    /** True while a newer index is fetched behind an already-usable stored one. */
    isRefreshing: boolean;
    /** MusicBrainz recording ids, the exact key for a track when the server has tagged one. */
    recordingMbids: Set<string>;
    /** When the index in use was built, or null if it never has been. */
    syncedAt: null | number;
    /** `artist|track`, both normalized. The fallback when no recording id is available. */
    trackKeys: Set<string>;
}

const EMPTY_INDEX: LibraryIndex = {
    albumKeys: new Set(),
    albumMbids: new Set(),
    artistNames: new Set(),
    isReady: false,
    isRefreshing: false,
    recordingMbids: new Set(),
    syncedAt: null,
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
 * The library index, restored from IndexedDB whenever one has been built before.
 *
 * The underlying query is persisted and revalidated daily rather than refetched on a short
 * timer, so the full library scan happens once and every later visit renders immediately from
 * the stored copy while a fresh one is fetched behind it.
 */
export function useLibraryIndex(enabled: boolean): LibraryIndex {
    const serverId = useCurrentServerId();

    const query = useQuery({
        ...libraryIndexQueries.index(serverId),
        enabled: enabled && Boolean(serverId),
    });

    return useMemo(() => {
        if (!query.data) {
            return EMPTY_INDEX;
        }

        return {
            albumKeys: new Set(query.data.albumKeys),
            albumMbids: new Set(query.data.albumMbids),
            artistNames: new Set(query.data.artistNames),
            isReady: true,
            isRefreshing: query.isFetching,
            recordingMbids: new Set(query.data.recordingMbids),
            syncedAt: query.data.syncedAt,
            trackKeys: new Set(query.data.trackKeys),
        };
    }, [query.data, query.isFetching]);
}
