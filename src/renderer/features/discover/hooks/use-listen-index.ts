import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { listenIndexQueries, splitKeys } from '/@/renderer/features/discover/api/listen-index-api';
import { DiscoverItem } from '/@/renderer/features/discover/utils/lb-adapters';
import { artistVariants, normalizeName } from '/@/renderer/features/discover/utils/library-match';

/**
 * What the user has already played, in the forms a ListenBrainz item can be matched against.
 *
 * The library index answers "do I own this" and this answers "have I heard this". They disagree
 * exactly where it is most annoying: a track streamed for years but never added passes an
 * ownership filter and is presented as a discovery.
 */
export interface ListenIndex {
    /** Listens absorbed so far, so partial coverage can be stated as a fraction. */
    indexedCount: number;
    /**
     * True once the whole history has been walked.
     *
     * Until then the filter runs against a partial history, so it is right about what it has
     * read and blind to the rest. This is what the page says so out loud for.
     */
    isComplete: boolean;
    /** True once any index exists, complete or not. Below this nothing can be filtered at all. */
    isReady: boolean;
    /**
     * The history could not be read and retrying has stopped.
     *
     * Distinct from merely not ready, and the distinction decides whether the page waits or
     * gives up on this filter. ListenBrainz sheds load by closing the socket rather than
     * answering, so an outage looks like a network error with no status code behind it, and a
     * page that waits for both indexes unconditionally would sit behind a spinner for as long
     * as the service was unwell. Better a page filtered only by the library than no page.
     */
    isUnavailable: boolean;
    /** Listens ListenBrainz reports in total. */
    listenCount: number;
    /** Oldest listen reached so far, or null before the first pass. Epoch seconds. */
    oldestTs: null | number;
    /** MusicBrainz recording ids, the exact key when ListenBrainz mapped the listen. */
    recordingMbids: Set<string>;
    /**
     * How many keys the index holds.
     *
     * Reported on the page because it is the one number that shows the filter is real. It runs
     * well above the distinct-recording count, since a listen is indexed under every credit
     * variant so that a suggestion credited to the lead artist alone still matches.
     */
    trackKeyCount: number;
    /** `artist|track`, both normalized. Carries the ~12% of listens with no mapping. */
    trackKeys: Set<string>;
}

const EMPTY_INDEX: ListenIndex = {
    indexedCount: 0,
    isComplete: false,
    isReady: false,
    isUnavailable: false,
    listenCount: 0,
    oldestTs: null,
    recordingMbids: new Set(),
    trackKeyCount: 0,
    trackKeys: new Set(),
};

/**
 * Drop anything the user has played before.
 *
 * Only tracks are filtered. An artist or a release is not "heard" in any sense this index can
 * establish: having played one track by an artist is a reason to suggest more of them, not a
 * reason to hide them, and hiding a whole album because a single track from it was once played
 * would empty the page.
 *
 * Filters against whatever the index holds, including a history that is still being walked. A
 * partial index is right about every listen it has read and silent about the rest, so the page
 * it produces is correct but generous: some tracks on it will turn out to be familiar. Rows
 * re-filter as the walk checkpoints, so those drop out on their own, and the page says
 * plainly that this is happening rather than presenting a partial result as a finished one.
 * The alternative, waiting for a complete history, left the user watching a progress bar for
 * minutes on end with nothing to look at.
 */
export function filterHeardItems(items: DiscoverItem[], index: ListenIndex): DiscoverItem[] {
    // Nothing can be said about what was heard, so say nothing and let the library filter
    // stand on its own rather than hiding the whole page behind a service that is down. An
    // index that has not produced a first page yet is in the same position.
    if (index.isUnavailable || !index.isReady) {
        return items;
    }

    return items.filter((item) => {
        if (item.kind !== 'track') {
            return true;
        }

        if (item.recordingMbid && index.recordingMbids.has(item.recordingMbid)) {
            return false;
        }

        const title = normalizeName(item.title);

        return !artistVariants(item.artistName).some((artist) =>
            index.trackKeys.has(`${artist}|${title}`),
        );
    });
}

/**
 * The listen index, restored from IndexedDB whenever one has been built before.
 *
 * Restoring is what makes the wait bearable. The first run pays for the whole history once;
 * every run after it resumes from what was stored and only has to catch up.
 */
export function useListenIndex(username: string): ListenIndex {
    const client = useQueryClient();

    const query = useQuery(listenIndexQueries.index(username, client));

    return useMemo(() => {
        if (!query.data) {
            return query.isError ? { ...EMPTY_INDEX, isUnavailable: true } : EMPTY_INDEX;
        }

        const trackKeys = new Set(splitKeys(query.data.trackKeys));

        return {
            // Absent from indexes written by builds before the count existed, and those are
            // restored from IndexedDB rather than rebuilt, so it has to survive being missing.
            indexedCount: query.data.indexedCount ?? 0,
            isComplete: query.data.isComplete,
            isReady: true,
            isUnavailable: false,
            listenCount: query.data.listenCount,
            oldestTs: query.data.oldestTs,
            recordingMbids: new Set(splitKeys(query.data.recordingMbids)),
            trackKeyCount: trackKeys.size,
            trackKeys,
        };
    }, [query.data, query.isError]);
}
