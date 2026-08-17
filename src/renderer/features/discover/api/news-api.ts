import { queryOptions } from '@tanstack/react-query';
import isElectron from 'is-electron';

import { NEWS_FEEDS, NewsArticle } from '/@/shared/news/feeds';
import { parseRssFeed } from '/@/shared/news/parse-feed';

/**
 * Editorial RSS, by whichever route this build has.
 *
 * Electron reads all fourteen feeds through the main process, where CORS does not apply. The
 * web build has no main process, so it reads the three hosts that send
 * `access-control-allow-origin: *` and goes without the rest. Both return the same articles,
 * unmatched and unranked, because deciding which ones are interesting needs the library index.
 */

export const NEWS_KEY = 'discover-news';

const news = isElectron() ? window.api.news : null;

/**
 * An hour.
 *
 * Long enough not to hammer fourteen mastheads on every visit to the page, short enough that a
 * story breaking in the morning is there by lunchtime. The four-day window downstream means
 * nothing here expires in a way the reader would notice sooner than that.
 */
const CACHE = {
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
    staleTime: 1000 * 60 * 60,
};

/** The web build's whole supply: the three feeds a browser is allowed to read. */
async function fetchCorsOpenFeeds(signal?: AbortSignal): Promise<NewsArticle[]> {
    const batches = await Promise.all(
        NEWS_FEEDS.filter((feed) => feed.isCorsOpen).map(async (feed) => {
            try {
                const response = await fetch(feed.url, { signal });

                return response.ok ? parseRssFeed(feed.name, await response.text()) : [];
            } catch (error) {
                // A feed that is simply down costs only its own articles, but an aborted request
                // has to stay a failure. Swallowing it would cache an empty feed as a success.
                if (signal?.aborted) {
                    throw error;
                }

                return [];
            }
        }),
    );

    return batches.flat();
}

export const newsQueries = {
    articles: () =>
        queryOptions({
            ...CACHE,
            queryFn: ({ signal }) => news?.fetchFeeds() ?? fetchCorsOpenFeeds(signal),
            queryKey: [NEWS_KEY] as const,
        }),
};
