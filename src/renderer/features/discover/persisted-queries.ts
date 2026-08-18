import {
    INDEX_VERSION,
    LIBRARY_INDEX_KEY,
} from '/@/renderer/features/discover/api/library-index-api';
import { LISTEN_INDEX_KEY } from '/@/renderer/features/discover/api/listen-index-api';
import { NEWS_KEY } from '/@/renderer/features/discover/api/news-api';

/**
 * Which of Discover's queries survive a restart, and why each one has to.
 *
 * Everything this page reads comes from a third party over the network, and every one of those
 * has a freshness policy measured in hours or days: a generated playlist is rebuilt weekly, a
 * similarity model changes between releases, an artist photograph does not change at all. None
 * of that had any effect across a restart, because none of it was stored. A cold launch
 * therefore spent the whole ListenBrainz allowance re-fetching answers that were still valid,
 * and then spent the free keyless image services on artwork it had already resolved.
 *
 * Storing them makes the policies mean what they say. The second launch of a day renders from
 * the stored copies and asks for nothing, and what it does ask for is what has genuinely
 * expired.
 */

/**
 * The first element of every query key this feature owns that is worth keeping.
 *
 * Matched on the root rather than listed key by key, because the keys carry seed lists and
 * batch contents that change with the library. `discover` is the album-art lookup;
 * `listenbrainz` covers both the main API and the labs similarity endpoints.
 */
const CACHEABLE_ROOTS = new Set(['audiodb', 'discover', 'listenbrainz', 'musicbrainz']);

/**
 * How long a stored third-party answer is worth carrying.
 *
 * Retention rather than freshness: the query's own `staleTime` decides when it is refetched,
 * and this only decides when a copy nobody has asked for in a fortnight stops being written
 * back. It has to exist because most of these keys carry a seed list, so a library that grows
 * produces new keys rather than replacing old ones, and the persisted client is hydrated with
 * `gcTime: Infinity`: without a bound, every seed set the page has ever used would be kept for
 * ever. Matched to the longest `gcTime` in the feature, which is the similarity model's.
 */
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 14;

/**
 * Whether a query should be written to IndexedDB.
 *
 * The two indexes are kept whenever they hold anything; everything else waits for a clean
 * success. They are built by a walk that runs for minutes over a six-figure history and is
 * expected to be interrupted. A pass that ends in an error still leaves a correct, smaller
 * index with a record of where to resume, so requiring success throws away real work: the walk
 * resumes from whatever was stored, and storing nothing means the next launch starts at zero
 * however far the last one got.
 */
export function shouldPersistDiscoverQuery(
    queryKey: readonly unknown[],
    hasData: boolean,
    isSuccess: boolean,
    updatedAt: number,
): boolean {
    /*
     * Only the current version of the library index.
     *
     * The version is part of the key, so a bump simply misses the stored copy and rebuilds. The
     * superseded copy, though, is hydrated back with `gcTime: Infinity` and written out again
     * on every save, so IndexedDB was carrying one whole library per version this feature has
     * had. Failing the test here is what drops them: nothing rewrites what it does not dehydrate.
     */
    if (queryKey.includes(LIBRARY_INDEX_KEY)) {
        return hasData && queryKey.includes(INDEX_VERSION);
    }

    if (queryKey.includes(LISTEN_INDEX_KEY)) {
        return hasData;
    }

    if (!isSuccess || Date.now() - updatedAt > MAX_AGE_MS) {
        return false;
    }

    return queryKey[0] === NEWS_KEY || CACHEABLE_ROOTS.has(queryKey[0] as string);
}
