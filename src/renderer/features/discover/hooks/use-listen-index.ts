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
    /** True once the whole history has been walked. Until then nothing is filtered. */
    isComplete: boolean;
    /** True once any index exists, complete or not. Drives the progress line, not the filter. */
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
    trackKeys: new Set(),
};

/**
 * Drop anything the user has played before.
 *
 * Only tracks are filtered. An artist or a release is not "heard" in any sense this index can
 * establish: having played one track by an artist is a reason to suggest more of them, not a
 * reason to hide them, and hiding a whole album because a single track from it was once played
 * would empty the page.
 */
export function filterHeardItems(items: DiscoverItem[], index: ListenIndex): DiscoverItem[] {
    // Nothing can be said about what was heard, so say nothing and let the library filter
    // stand on its own rather than hiding the whole page behind a service that is down.
    if (index.isUnavailable) {
        return items;
    }

    // Deliberately a complete history, not merely a usable one. A partial index filters
    // correctly for every listen it holds and says nothing about the rest, so filtering
    // against one produces a page that looks finished while quietly offering back music the
    // user played before the walk reached that far.
    if (!index.isComplete) {
        return [];
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
            trackKeys: new Set(splitKeys(query.data.trackKeys)),
        };
    }, [query.data, query.isError]);
}
