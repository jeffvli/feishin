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
    /** True once the whole history has been walked. A partial index still filters correctly. */
    isComplete: boolean;
    /** False until enough of an index exists to filter against at all. */
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
    /** MusicBrainz recording ids, the exact key when ListenBrainz mapped the listen. */
    recordingMbids: Set<string>;
    /** `artist|track`, both normalized. Carries the ~12% of listens with no mapping. */
    trackKeys: Set<string>;
}

const EMPTY_INDEX: ListenIndex = {
    isComplete: false,
    isReady: false,
    isUnavailable: false,
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

    if (!index.isReady) {
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
 * Usable as soon as any of it exists rather than only when complete: a walk that has covered
 * the last two years already recognises almost everything ListenBrainz is likely to suggest,
 * and waiting for the remaining decade would hold the page hostage to old history.
 */
export function useListenIndex(username: string): ListenIndex {
    const client = useQueryClient();

    const query = useQuery(listenIndexQueries.index(username, client));

    return useMemo(() => {
        if (!query.data) {
            return query.isError ? { ...EMPTY_INDEX, isUnavailable: true } : EMPTY_INDEX;
        }

        return {
            isComplete: query.data.isComplete,
            isReady: true,
            isUnavailable: false,
            recordingMbids: new Set(splitKeys(query.data.recordingMbids)),
            trackKeys: new Set(splitKeys(query.data.trackKeys)),
        };
    }, [query.data, query.isError]);
}
