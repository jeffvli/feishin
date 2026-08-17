import { ipcRenderer } from 'electron';

import { NewsArticle } from '/@/shared/news/feeds';

/** Read every editorial feed in the main process, where CORS does not block eleven of them. */
const fetchFeeds = (): Promise<NewsArticle[]> => {
    return ipcRenderer.invoke('news-fetch-feeds');
};

export const news = {
    fetchFeeds,
};

export type News = typeof news;
