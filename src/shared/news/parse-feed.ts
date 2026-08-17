import { XMLParser } from 'fast-xml-parser';

import { NewsArticle } from '/@/shared/news/feeds';

/**
 * One RSS document to articles.
 *
 * Shared by both transports rather than written once per build. The main process and the web
 * build differ in how they get the bytes, which CORS forces, but nothing about reading them
 * differs, and two parsers would be two sets of edge cases to keep in step.
 *
 * Only RSS is handled. All fourteen feeds publish RSS today; an outlet that moved to Atom would
 * parse to zero articles and drop out silently, which is what `checkFeedHealth` is for.
 */

/** Collapse whitespace and drop any markup an outlet left inside a title or byline. */
function cleanText(value: unknown): string {
    if (typeof value !== 'string') {
        return '';
    }

    return value
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * The first value of an element that may legitimately repeat.
 *
 * Stereogum emits two `dc:creator` elements on some posts, the post author and the site editor,
 * which the parser hands back as an array where every other feed gives a string.
 */
function firstString(value: unknown): string {
    return cleanText(Array.isArray(value) ? value[0] : value);
}

/**
 * `parseTagValue: false` keeps every value a string, so a headline that is only a year does not
 * arrive as a number. Attributes are dropped because RSS carries all four fields we want as
 * text nodes, and ignoring them keeps a self-closing `<media:content/>` an empty string rather
 * than an object.
 */
const PARSER = new XMLParser({
    htmlEntities: true,
    ignoreAttributes: true,
    parseTagValue: false,
    processEntities: true,
    trimValues: true,
});

export function parseRssFeed(outlet: string, xml: string): NewsArticle[] {
    let document: unknown;

    try {
        document = PARSER.parse(xml);
    } catch {
        return [];
    }

    const channel = (document as { rss?: { channel?: { item?: unknown } } })?.rss?.channel;

    return toArray(channel?.item)
        .map((raw): NewsArticle => {
            const item = raw as Record<string, unknown>;
            const published = Date.parse(firstString(item.pubDate));

            return {
                author: firstString(item['dc:creator'] ?? item.author),
                categories: stringArray(item.category),
                link: firstString(item.link),
                outlet,
                publishedAt: Number.isNaN(published) ? 0 : published,
                title: firstString(item.title),
            };
        })
        .filter((article) => article.link && article.title);
}

function stringArray(value: unknown): string[] {
    return toArray(value)
        .map((entry) => cleanText(entry))
        .filter(Boolean);
}

/** A single child element parses to a value, several to an array, and an absent one to nothing. */
function toArray(value: unknown): unknown[] {
    if (Array.isArray(value)) {
        return value;
    }

    return value === undefined || value === null ? [] : [value];
}
