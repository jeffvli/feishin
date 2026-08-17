import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { listenbrainzQueries } from '/@/renderer/features/discover/api/listenbrainz-api';
import { socialQueries } from '/@/renderer/features/discover/api/social-api';
import { useLibraryIndex } from '/@/renderer/features/discover/hooks/use-library-index';
import { buildFeed, FeedEntry } from '/@/renderer/features/discover/utils/social-feed';

export interface DiscoverSocial {
    entries: FeedEntry[];
    /** True once the follow list is known to be empty. Drives the invitation, not an error. */
    isEmpty: boolean;
    isLoading: boolean;
    /**
     * Listeners with the closest taste, for the empty state.
     *
     * The same query the recommendation rows already seed from, so React Query serves it from
     * cache rather than fetching it twice.
     */
    peers: Array<{ similarity: number; username: string }>;
}

/**
 * Recent listens from the people this user follows, grouped by track.
 *
 * Separate from `useDiscoverData` on purpose, the same way the news section is: this is not a
 * `DiscoverRow`, it must not count toward the page's loading progress, and a follow list that
 * fails should not make the page report ListenBrainz as slow.
 */
export function useDiscoverSocial(username: string): DiscoverSocial {
    const libraryIndex = useLibraryIndex(Boolean(username));
    const following = useQuery(socialQueries.following(username));

    // Capped before the fan-out, because this is one request per person and the tail of a long
    // follow list contributes little: the section shows eight tracks.
    const listeners = useMemo(
        () => [...(following.data ?? [])].sort().slice(0, MAX_LISTENERS),
        [following.data],
    );

    const listens = useQuery(socialQueries.friendListens(listeners));

    const isEmpty = following.isSuccess && listeners.length === 0;

    const peers = useQuery({
        ...listenbrainzQueries.similarUsers(username),
        // Only wanted when there is an empty state to fill, and the recommendation rows will
        // have requested it anyway on a page that is set up.
        enabled: isEmpty,
    });

    const entries = useMemo(() => {
        if (!listens.data) {
            return [];
        }

        return buildFeed(listens.data, libraryIndex);
    }, [listens.data, libraryIndex]);

    return {
        entries,
        isEmpty,
        // The library index is not waited on. Without it every entry reads as unowned, which
        // costs the ordering rather than correctness, and it resolves in seconds.
        isLoading: following.isLoading || (listeners.length > 0 && listens.isLoading),
        peers: (peers.data ?? []).slice(0, PEER_COUNT).map((peer) => ({
            similarity: peer.similarity,
            username: peer.user_name,
        })),
    };
}

/**
 * How many followed listeners to read.
 *
 * One request each, so this is the section's whole cost. Twenty is generous next to the
 * follow lists ListenBrainz accounts actually have, and well inside the published allowance.
 */
const MAX_LISTENERS = 20;

/** Enough to make the invitation concrete without turning it into a directory. */
const PEER_COUNT = 6;
