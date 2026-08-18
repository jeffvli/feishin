import { useQuery } from '@tanstack/react-query';

import {
    LibraryIndexData,
    libraryIndexQueries,
    NeglectedArtist,
} from '/@/renderer/features/discover/api/library-index-api';
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
    /**
     * Total plays per normalized artist name, absent for artists with none.
     *
     * How much of the library an artist actually accounts for, which `artistNames` cannot say:
     * membership there is as flat for someone appearing once as a participant credit as it is
     * for the most played artist on the server.
     */
    artistPlays: Map<string, number>;
    isReady: boolean;
    /**
     * Artists the library holds in quantity and rarely plays, most neglected first.
     *
     * Discover seeds a similarity call from these to reach outside this month's rotation. They
     * are a direction only: everything they turn up is filtered against the library like any
     * other suggestion, so nothing already owned reaches a row.
     */
    neglectedArtists: NeglectedArtist[];
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
    artistPlays: new Map(),
    isReady: false,
    neglectedArtists: [],
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
 * The stored arrays inflated into the sets the matcher wants, once per stored index.
 *
 * Keyed on the query's own data object rather than memoized per hook call, because two callers
 * want this index: `useDiscoverData` for filtering and `useDiscoverNews` for artist matching.
 * Per-call memoization gave them a set each, so a library of tens of thousands of tracks was
 * inflated twice and held twice. Weak, so it goes when React Query drops the data.
 */
const inflated = new WeakMap<LibraryIndexData, LibraryIndex>();

/**
 * The library index, restored from IndexedDB whenever one has been built before.
 *
 * The underlying query is persisted and revalidated daily rather than refetched on a short
 * timer, so the full library scan happens once and every later visit renders immediately from
 * the stored copy while a fresh one is fetched behind it.
 *
 * Nothing here reflects whether a refresh is in flight. It used to, and the cost was out of all
 * proportion to a field no caller read: a background revalidation starting and finishing rebuilt
 * every set over the whole library twice and handed out a new object each time, which is the
 * dependency the whole Discover row computation hangs off.
 */
export function useLibraryIndex(enabled: boolean): LibraryIndex {
    const serverId = useCurrentServerId();

    const query = useQuery({
        ...libraryIndexQueries.index(serverId),
        enabled: enabled && Boolean(serverId),
    });

    return query.data ? inflate(query.data) : EMPTY_INDEX;
}

function inflate(data: LibraryIndexData): LibraryIndex {
    const existing = inflated.get(data);

    if (existing) {
        return existing;
    }

    const index: LibraryIndex = {
        albumKeys: new Set(data.albumKeys),
        albumMbids: new Set(data.albumMbids),
        artistNames: new Set(data.artistNames),
        artistPlays: new Map(data.artistPlays ?? []),
        isReady: true,
        neglectedArtists: data.neglectedArtists ?? [],
        recordingMbids: new Set(data.recordingMbids),
        syncedAt: data.syncedAt,
        trackKeys: new Set(data.trackKeys),
    };

    inflated.set(data, index);

    return index;
}
