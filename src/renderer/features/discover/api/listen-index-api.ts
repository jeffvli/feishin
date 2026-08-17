import { QueryClient, queryOptions } from '@tanstack/react-query';

import {
    clearSyncProgress,
    setSyncProgress,
} from '/@/renderer/features/discover/discover-sync-store';
import { artistVariants, normalizeName } from '/@/renderer/features/discover/utils/library-match';
import { logger } from '/@/renderer/utils/logger';

/**
 * Everything the user has ever played, reduced to the keys needed to recognise a track again.
 *
 * Owning a record and having heard one are different questions, and the second is the one a
 * Discover page is really asking. A track streamed fifty times but never added to the library
 * passes an ownership filter and is still not a discovery.
 *
 * ListenBrainz has no endpoint that answers "have I heard this". Passing `recording_mbid` to
 * the listens endpoint is accepted and silently ignored, returning an unfiltered page, so the
 * history has to be walked once and held locally.
 */
export interface ListenIndexData {
    /** True once the backward walk has reached the beginning of history. */
    isComplete: boolean;
    /** Newest listen indexed. The stop line for the next catch-up walk. */
    latestTs: number;
    /** What ListenBrainz reported the total to be, for progress reporting. */
    listenCount: number;
    /** Oldest listen indexed. Where an interrupted first walk resumes from. */
    oldestTs: null | number;
    /** Recording MBIDs, newline joined. See `joinKeys`. */
    recordingMbids: string;
    syncedAt: number;
    /** `artist|title`, both normalized, newline joined. */
    trackKeys: string;
}

/**
 * Listens accrue continuously, so unlike the library index this is worth revalidating often.
 * A catch-up walk after an hour is one or two requests.
 */
const STALE_MS = 1000 * 60 * 60;

/** How many listens a page asks for. 1000 is the documented maximum. */
const PAGE_SIZE = 1000;

/**
 * Written back to the cache every this many pages during the first walk.
 *
 * That walk takes minutes over a hundred-thousand-listen history, and without checkpointing a
 * user who closes the app halfway through would start again from nothing every time. Each
 * checkpoint records how far back it reached, so the next run resumes rather than restarts.
 */
const CHECKPOINT_PAGES = 10;

/**
 * Requests left in the window at which the walk waits for the window to roll over.
 *
 * ListenBrainz reports an allowance of 30 requests per 10 seconds on every response. Respecting
 * it is necessary and, on its own, not sufficient: see `MAX_PAGES_PER_PASS`.
 */
const RATE_FLOOR = 4;

/**
 * Pages fetched per sync before the walk stops and waits for the next one.
 *
 * The stated rate limit is not the real one. Measured against a live account, a walk that kept
 * `x-ratelimit-remaining` between 26 and 29 the whole way, well inside the published allowance,
 * still had its connection dropped after about 30 pages and 5.9 MB with `UND_ERR_SOCKET, other
 * side closed`. Nothing in the headers moved beforehand, so there is no signal to pace against
 * and no status code to retry on: the failure arrives as a socket error.
 *
 * So a hundred-thousand-listen history is deliberately not fetched in one sitting. Each pass
 * takes a bite under that ceiling, checkpoints what it got, and leaves the rest for next time.
 * Newest first, which is what makes this acceptable: one pass already covers the recent years
 * that ListenBrainz draws its suggestions from, and the older tail fills in over later visits.
 */
const MAX_PAGES_PER_PASS = 20;

/**
 * How long a single request is given before it is abandoned.
 *
 * Load is not always shed by refusing a connection. A throttled address can be left hanging,
 * with the request accepted and no response ever sent, and `fetch` has no timeout of its own,
 * so without this a walk waits for ever: the query never settles, nothing reaches the stored
 * index, and the page sits behind a progress line that has stopped moving. A hang has to be
 * turned into an error before any of the handling below can see it at all.
 */
const REQUEST_TIMEOUT_MS = 20000;

/** Marks the query as one the IndexedDB persister should keep. See `main.tsx`. */
export const LISTEN_INDEX_KEY = 'discover-listen-index';

interface LbListen {
    listened_at: number;
    track_metadata: {
        additional_info?: { recording_mbid?: null | string };
        artist_name: string;
        /**
         * ListenBrainz's own mapping of the listen onto MusicBrainz, and the only field that is
         * usefully populated: over a thousand listens this carried a recording id 885 times
         * where `additional_info.recording_mbid`, which the submitting client would have had to
         * supply, carried one twice.
         */
        mbid_mapping?: { recording_mbid?: null | string };
        track_name: string;
    };
}

/** Splits an index field back into the set the matcher uses. */
export function splitKeys(joined: string): string[] {
    return joined ? joined.split('\n') : [];
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            signal?.removeEventListener('abort', onAbort);
            resolve();
        }, ms);

        const onAbort = () => {
            clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
        };

        signal?.addEventListener('abort', onAbort, { once: true });
    });
}

/**
 * How much of the history a stored index already covers.
 *
 * Listens are not evenly spread over time, so this is a fraction of the timespan rather than a
 * count, and it is only ever used to place a progress bar. A complete index short-circuits to
 * the real total.
 */
function estimateIndexed(previous: ListenIndexData, listenCount: number): number {
    if (previous.isComplete || previous.oldestTs === null) {
        return previous.isComplete ? listenCount : 0;
    }

    const covered = previous.latestTs - previous.oldestTs;
    const whole = previous.latestTs - FIRST_PLAUSIBLE_LISTEN_TS;

    return whole > 0 ? Math.round(listenCount * Math.min(1, covered / whole)) : 0;
}

async function fetchListenCount(username: string, signal?: AbortSignal): Promise<number> {
    const response = await fetch(
        `https://api.listenbrainz.org/1/user/${encodeURIComponent(username)}/listen-count`,
        { signal: withTimeout(signal) },
    );

    if (!response.ok) {
        throw new Error(`ListenBrainz ${response.status}`);
    }

    const body = (await response.json()) as { payload?: { count?: number } };

    return body.payload?.count ?? 0;
}

/**
 * One page of listens, newest first, older than `maxTs`.
 *
 * Paces itself against the allowance the response reports rather than a fixed delay, so a walk
 * that starts with a full window runs at full speed and only slows when it has to.
 */
async function fetchListenPage(
    username: string,
    maxTs: null | number,
    signal?: AbortSignal,
): Promise<LbListen[]> {
    const query = new URLSearchParams({ count: String(PAGE_SIZE) });

    if (maxTs !== null) {
        query.set('max_ts', String(maxTs));
    }

    const response = await fetch(
        `https://api.listenbrainz.org/1/user/${encodeURIComponent(username)}/listens?${query}`,
        { signal: withTimeout(signal) },
    );

    if (!response.ok) {
        throw new Error(`ListenBrainz ${response.status}`);
    }

    const remaining = Number(response.headers.get('x-ratelimit-remaining') ?? RATE_FLOOR + 1);
    const resetIn = Number(response.headers.get('x-ratelimit-reset-in') ?? 1);
    const body = (await response.json()) as { payload?: { listens?: LbListen[] } };

    if (remaining <= RATE_FLOOR) {
        await delay(resetIn * 1000 + 250, signal);
    }

    return body.payload?.listens ?? [];
}

/** Joins index entries for storage. See `ListenIndexData.recordingMbids` for why. */
function joinKeys(values: Iterable<string>): string {
    return [...values].join('\n');
}

async function syncListenIndex(
    username: string,
    client: QueryClient,
    signal?: AbortSignal,
): Promise<ListenIndexData> {
    const queryKey = [LISTEN_INDEX_KEY, username];
    const previous = client.getQueryData<ListenIndexData>(queryKey);

    const recordingMbids = new Set(splitKeys(previous?.recordingMbids ?? ''));
    const trackKeys = new Set(splitKeys(previous?.trackKeys ?? ''));

    const listenCount = await fetchListenCount(username, signal);

    let latestTs = previous?.latestTs ?? 0;
    let oldestTs = previous?.oldestTs ?? null;
    let isComplete = previous?.isComplete ?? false;

    // Everything already held counts as done, so a resumed walk reports the fraction of the
    // whole history it has covered rather than restarting its progress bar at zero.
    let done = previous ? estimateIndexed(previous, listenCount) : 0;
    const startedAt = Date.now();
    let fetched = 0;

    const absorb = (listens: LbListen[]) => {
        for (const listen of listens) {
            const meta = listen.track_metadata;
            const mbid =
                meta.mbid_mapping?.recording_mbid ?? meta.additional_info?.recording_mbid ?? null;

            if (mbid) {
                recordingMbids.add(mbid);
            }

            // Indexed under every credit form the matcher will try, because a listen scrobbled
            // as "Santana featuring Rob Thomas" has to be recognised from a suggestion credited
            // to "Santana" alone.
            const title = normalizeName(meta.track_name);

            for (const artist of artistVariants(meta.artist_name)) {
                if (artist) {
                    trackKeys.add(`${artist}|${title}`);
                }
            }
        }

        fetched += listens.length;
        done += listens.length;
        latestTs = Math.max(latestTs, listens[0]?.listened_at ?? 0);

        const elapsed = Date.now() - startedAt;

        setSyncProgress({
            done: Math.min(done, listenCount),
            // Withheld until a page has actually timed, because an estimate from no data is a
            // number the user would reasonably believe.
            etaSeconds:
                fetched > 0
                    ? Math.round(((listenCount - done) * (elapsed / fetched)) / 1000)
                    : null,
            phase: isComplete ? 'catchup' : 'history',
            total: listenCount,
        });
    };

    const snapshot = (): ListenIndexData => ({
        isComplete,
        latestTs,
        listenCount,
        oldestTs,
        recordingMbids: joinKeys(recordingMbids),
        syncedAt: Date.now(),
        trackKeys: joinKeys(trackKeys),
    });

    try {
        // Anything new since the last run, however far back the first walk got. Done first so an
        // index that is still backfilling stays current at the top, where the suggestions are.
        // Not caught: with a stored index behind it this is a couple of requests, and if even
        // that fails there is nothing useful to say about how current the index is.
        if (previous && previous.latestTs > 0) {
            await walkBack(username, {
                fromTs: null,
                onPage: absorb,
                signal,
                stopAtTs: previous.latestTs,
            });
        }

        if (!isComplete) {
            let pages = 0;

            try {
                const result = await walkBack(username, {
                    fromTs: oldestTs,
                    maxPages: MAX_PAGES_PER_PASS,
                    onPage: (listens) => {
                        absorb(listens);
                        oldestTs = listens[listens.length - 1].listened_at;
                        pages += 1;

                        // Written straight into the cache so the persister picks it up. Losing
                        // a long walk to a closed window is the failure this exists to stop.
                        if (pages % CHECKPOINT_PAGES === 0) {
                            client.setQueryData(queryKey, snapshot());
                        }
                    },
                    signal,
                    // No stop line. This walk is heading away from the newest listen, so
                    // bounding it by the previous high-water mark would reject every page it
                    // fetched: each one is older than that mark by construction, and the pass
                    // would return having advanced nothing.
                    stopAtTs: null,
                });

                isComplete = result.reachedEnd;
            } catch (error) {
                // A backfill that stops early is a smaller index, not a broken one: every key
                // already collected is still correct, and `oldestTs` records exactly where to
                // pick up. The one exception is the user leaving the page, which should not be
                // mistaken for the service refusing us.
                if (signal?.aborted || (error as Error).name === 'AbortError') {
                    throw error;
                }

                if (pages === 0 && !previous) {
                    throw error;
                }

                logger.warn(
                    `Listen history backfill stopped after ${pages} pages: ${(error as Error).message}`,
                );
            }
        }
    } finally {
        clearSyncProgress();
    }

    return snapshot();
}

/**
 * Walks backward through the history, newest first, collecting keys as it goes.
 *
 * Backward in both modes, including the catch-up, which is not the obvious choice. The obvious
 * choice is `min_ts` set to the last sync, but that parameter returns the *newest* listens
 * above the bound rather than the oldest, so once more than one page has accrued it silently
 * skips everything in between. Walking down from the top and stopping at the old high-water
 * mark has no such hole and needs only one implementation.
 */
async function walkBack(
    username: string,
    options: {
        fromTs: null | number;
        maxPages?: number;
        onPage: (listens: LbListen[]) => void;
        signal?: AbortSignal;
        stopAtTs: null | number;
    },
): Promise<{ oldestTs: null | number; reachedEnd: boolean }> {
    let cursor = options.fromTs;
    let oldestTs: null | number = null;
    let pages = 0;

    for (;;) {
        if (options.maxPages !== undefined && pages >= options.maxPages) {
            return { oldestTs, reachedEnd: false };
        }

        pages += 1;

        options.signal?.throwIfAborted();

        const page = await fetchListenPage(username, cursor, options.signal);

        if (page.length === 0) {
            return { oldestTs, reachedEnd: true };
        }

        const stop = options.stopAtTs;
        const kept = stop === null ? page : page.filter((listen) => listen.listened_at > stop);

        if (kept.length > 0) {
            options.onPage(kept);
            oldestTs = kept[kept.length - 1].listened_at;
        }

        // The stop line fell inside this page, so everything wanted has been seen.
        if (kept.length < page.length) {
            return { oldestTs, reachedEnd: false };
        }

        // `max_ts` is exclusive, verified against the API: a page requested at the newest
        // listen's own timestamp comes back starting one listen below it. Subtracting a second
        // here would therefore skip any second that happens to hold two listens.
        cursor = page[page.length - 1].listened_at;
    }
}

/**
 * The caller's signal, plus a deadline.
 *
 * Combined rather than replaced so the two reasons for giving up stay distinguishable: the
 * caller aborting means the user left and the whole walk should stop, where the deadline
 * firing should only end the pass and leave what it collected.
 */
function withTimeout(signal?: AbortSignal): AbortSignal {
    const deadline = AbortSignal.timeout(REQUEST_TIMEOUT_MS);

    return signal ? AbortSignal.any([signal, deadline]) : deadline;
}

/** Last.fm opened in 2002, so nothing imported into ListenBrainz predates it by much. */
const FIRST_PLAUSIBLE_LISTEN_TS = 1030000000;

export const listenIndexQueries = {
    index: (username: string, client: QueryClient) =>
        queryOptions({
            enabled: Boolean(username),
            gcTime: Infinity,
            queryFn: ({ signal }) => syncListenIndex(username, client, signal),
            queryKey: [LISTEN_INDEX_KEY, username] as const,
            /**
             * While the history is still being backfilled, keep taking bites.
             *
             * One pass is twenty pages, so a six-figure history needs several. Waiting a whole
             * `STALE_MS` between them would take most of a day to finish; running them back to
             * back would reach the drop-the-socket ceiling again. A minute apart converges in
             * a few minutes of ordinary use and averages well under a request every two
             * seconds. Once complete this stops entirely and only the hourly catch-up remains.
             */
            refetchInterval: (query) =>
                query.state.data && !query.state.data.isComplete ? BACKFILL_INTERVAL_MS : false,
            refetchIntervalInBackground: true,
            refetchOnWindowFocus: false,
            // A partial index is still correct for everything it holds, so serving it while the
            // rest arrives is better than making the user wait for the whole history.
            retry: 1,
            staleTime: STALE_MS,
        }),
};

/** Gap between backfill passes. See `refetchInterval` above. */
const BACKFILL_INTERVAL_MS = 1000 * 60;
