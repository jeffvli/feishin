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
     * Listeners with the closest taste who are still listening, for the empty state.
     *
     * Seeded from the same similar-users query the recommendation rows use, so React Query
     * serves that from cache rather than fetching it twice, then filtered to accounts with a
     * listen in the last month. Empty until that check resolves.
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

    const similar = useQuery({
        ...listenbrainzQueries.similarUsers(username),
        // Only wanted when there is an empty state to fill, and the recommendation rows will
        // have requested it anyway on a page that is set up.
        enabled: isEmpty,
    });

    // More candidates than slots, because the activity check below removes some of them.
    const candidates = useMemo(
        () => (similar.data ?? []).slice(0, PEER_CANDIDATES).map((peer) => peer.user_name),
        [similar.data],
    );

    const activity = useQuery(socialQueries.peerActivity(candidates));

    /*
     * Only people who have listened to something this month.
     *
     * Similarity is computed over all time and never decays, so accounts that stopped scrobbling
     * years ago sit permanently near the top of the list. They are the worst possible suggestion
     * here: the whole promise of following someone is a feed, and a dormant account produces an
     * empty one.
     *
     * Measured against the query's own timestamp rather than the clock, so the memo stays pure
     * and the cutoff refers to the snapshot being displayed.
     */
    const suggestions = useMemo(() => {
        if (!similar.data || !activity.data) {
            return [];
        }

        const cutoff = activity.dataUpdatedAt - ACTIVE_WINDOW_MS;
        const active = new Set(
            activity.data
                .filter((peer) => peer.lastListenedAt !== null && peer.lastListenedAt >= cutoff)
                .map((peer) => peer.username),
        );

        return similar.data
            .filter((peer) => active.has(peer.user_name))
            .slice(0, PEER_COUNT)
            .map((peer) => ({ similarity: peer.similarity, username: peer.user_name }));
    }, [similar.data, activity.data, activity.dataUpdatedAt]);

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
        peers: suggestions,
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

/**
 * How many similar users to check for recent activity to fill those slots.
 *
 * One request each, so this is the cost of the check. Twice the slots leaves room for the
 * dormant accounts without asking about the whole list.
 */
const PEER_CANDIDATES = 12;

/** A month, past which an account is dormant rather than quiet. */
const ACTIVE_WINDOW_MS = 1000 * 60 * 60 * 24 * 30;
