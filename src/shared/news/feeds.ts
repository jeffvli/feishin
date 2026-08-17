/**
 * The editorial feeds behind the Discover news section, and the shape one article takes.
 *
 * Shared rather than living beside either consumer, because the two builds have to fetch these
 * differently and must not diverge on what they produce. Electron fetches every feed from the
 * main process, where CORS does not apply. The web build has no main process and can only reach
 * the three hosts that send `access-control-allow-origin: *`. Both paths emit this same
 * `NewsArticle`, so the matching and ranking downstream is written once.
 */

/**
 * Feeds that were verified live to return an RSS document with articles, an author and a date.
 *
 * Four more were tried and are absent on purpose rather than by oversight: Paste answers 500,
 * Under the Radar 403, Resident Advisor 404, and Bandcamp Daily returns a document with no
 * items. That failure rate is why `checkFeedHealth` exists.
 */
export const NEWS_FEEDS: NewsFeed[] = [
    { isCorsOpen: true, name: 'BrooklynVegan', url: 'https://www.brooklynvegan.com/feed/' },
    { isCorsOpen: false, name: 'Clash', url: 'https://www.clashmusic.com/feed/' },
    { isCorsOpen: true, name: 'Consequence', url: 'https://consequence.net/feed/' },
    { isCorsOpen: false, name: 'DIY', url: 'https://diymag.com/feed' },
    { isCorsOpen: false, name: 'HipHopDX', url: 'https://hiphopdx.com/rss/news.xml' },
    { isCorsOpen: false, name: 'JamBase', url: 'https://www.jambase.com/feed' },
    { isCorsOpen: false, name: 'Loudwire', url: 'https://loudwire.com/feed/' },
    { isCorsOpen: false, name: 'Metal Injection', url: 'https://metalinjection.net/feed' },
    { isCorsOpen: false, name: 'NME', url: 'https://www.nme.com/news/music/feed' },
    { isCorsOpen: true, name: 'Pitchfork', url: 'https://pitchfork.com/feed/feed-news/rss' },
    { isCorsOpen: false, name: 'Rolling Stone', url: 'https://www.rollingstone.com/music/feed/' },
    {
        isCorsOpen: false,
        name: 'Saving Country Music',
        url: 'https://www.savingcountrymusic.com/feed/',
    },
    { isCorsOpen: false, name: 'Stereogum', url: 'https://www.stereogum.com/feed/' },
    { isCorsOpen: false, name: 'The Quietus', url: 'https://thequietus.com/feed/' },
];

export interface NewsArticle {
    author: string;
    /**
     * The article's tags as published.
     *
     * Empty for the outlets that do not tag by artist, which is the reason the matcher has a
     * headline-only path at all rather than treating an untagged article as uninteresting.
     */
    categories: string[];
    link: string;
    outlet: string;
    /** Epoch milliseconds, or 0 when the feed published a date that would not parse. */
    publishedAt: number;
    title: string;
}

export interface NewsFeed {
    /**
     * Whether the host sends `access-control-allow-origin: *`, and so whether a browser can
     * fetch it at all.
     *
     * Measured per host rather than inferred: of the fourteen here only three send it, and
     * nothing about an outlet's size or platform predicts which. The web build reads this to
     * decide what it can ask for; the main process ignores it entirely.
     */
    isCorsOpen: boolean;
    name: string;
    url: string;
}
