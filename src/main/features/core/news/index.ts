import axios from 'axios';
import { ipcMain } from 'electron';

import { NEWS_FEEDS, NewsArticle, NewsFeed } from '/@/shared/news/feeds';
import { parseRssFeed } from '/@/shared/news/parse-feed';

/**
 * Editorial RSS, fetched where CORS does not apply.
 *
 * Eleven of the fourteen feeds send no `Access-Control-Allow-Origin` at all, so a renderer
 * fetch is blocked outright for most of the list. Doing it here is what makes the full set
 * reachable; the web build has no main process and falls back to the three that do send it.
 *
 * No matching happens here. Deciding which articles are interesting needs the library index,
 * which lives in the renderer, so this returns everything it read and lets the renderer choose.
 */

const REQUEST_TIMEOUT_MS = 10000;

/**
 * Several outlets serve a 403 to a default client string. Electron's own user agent is not one
 * a CDN expects from a feed reader, so send a browser's.
 */
const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * One feed, never throwing.
 *
 * A dead outlet has to cost only its own articles. Three of the sixteen candidates were already
 * returning 500, 403 and 404 on the day the list was drawn up, so a batch that fails whole
 * because one host is down would be the common case rather than the rare one.
 */
async function fetchFeed(feed: NewsFeed): Promise<NewsArticle[]> {
    try {
        const response = await axios.get<string>(feed.url, {
            headers: { 'User-Agent': USER_AGENT },
            responseType: 'text',
            timeout: REQUEST_TIMEOUT_MS,
            // Identity, so axios does not try to JSON-parse an XML document on the way past.
            transformResponse: (data: string) => data,
        });

        return parseRssFeed(feed.name, response.data);
    } catch {
        return [];
    }
}

ipcMain.handle('news-fetch-feeds', async (): Promise<NewsArticle[]> => {
    const batches = await Promise.all(NEWS_FEEDS.map((feed) => fetchFeed(feed)));

    return batches.flat();
});
