import { normalizeName } from '/@/renderer/features/discover/utils/library-match';
import { NewsArticle } from '/@/shared/news/feeds';

/**
 * Which articles are about an artist the library holds.
 *
 * The premise that makes this precise rather than a substring guess: most music outlets tag
 * every article with artist names in `<category>`, so the question is a set intersection
 * against the library rather than a search of free text. Eleven of the fourteen feeds do this.
 * The three that do not are matched on the headline alone, under a stricter rule.
 *
 * Every filter here exists because of an observed failure, and each is noted where it sits.
 * Measured over 326 articles against a 1,000 artist library: 64 raw tag matches, 28 surviving.
 */

export interface MatchedArticle extends NewsArticle {
    /**
     * The normalized library names this article is about.
     *
     * Normalized rather than as published, because these are identity for de-duplication and
     * for the one-story-per-artist cap, and never shown to anyone.
     */
    artistKeys: string[];
}

export function matchArticles(articles: NewsArticle[], artistNames: Set<string>): MatchedArticle[] {
    if (artistNames.size === 0) {
        return [];
    }

    const matched: MatchedArticle[] = [];

    for (const article of articles) {
        // An article tagged this heavily is a tag dump, not a piece about anyone. JamBase
        // averages 20 tags a post, and those posts matched more artists than any real story.
        if (article.categories.length > MAX_CATEGORIES) {
            continue;
        }

        if (ROUNDUP_TITLE.test(article.title)) {
            continue;
        }

        const grams = headlineGrams(article.title);
        const tagged = article.categories
            .map((category) => normalizeName(category))
            .filter((key) => artistNames.has(key) && !SECTION_TAGS.has(key) && grams.has(key));

        // Falling back whenever the tagged pass found nothing, rather than only for the
        // untagged feeds, costs nothing: the headline rule is strictly the stronger of the two,
        // so anything it adds would have passed the tagged rule as well had the tag been there.
        const keys = tagged.length > 0 ? tagged : headlineArtists(grams, artistNames);
        const unique = [...new Set(keys)];

        // A piece naming three of the library's artists is a roundup. It is about none of them,
        // and it would otherwise outrank real stories by matching more of the library.
        if (unique.length === 0 || unique.length >= ROUNDUP_ARTIST_COUNT) {
            continue;
        }

        matched.push({ ...article, artistKeys: unique });
    }

    return matched;
}

/**
 * Artists named in the headline, found by looking the headline's own phrases up rather than
 * searching the headline for each of several thousand names.
 *
 * The length floor is what makes this safe on feeds with no tags to corroborate. It excludes
 * 128 of a 1,000 artist library, and they are exactly the names that would otherwise match
 * ordinary prose: Tool, Queen, Drake, Bush, Ye, 311.
 */
function headlineArtists(grams: Set<string>, artistNames: Set<string>): string[] {
    const found: string[] = [];

    for (const gram of grams) {
        if (gram.length >= HEADLINE_MIN_LENGTH && artistNames.has(gram)) {
            found.push(gram);
        }
    }

    return found;
}

/**
 * Every run of up to six consecutive words in a headline, normalized the same way library names
 * are.
 *
 * Built once per article and used by both passes. Phrases rather than a substring test, so a
 * name only matches on whole words: "Air" cannot match "airport", and no separate word-boundary
 * check is needed anywhere downstream.
 */
function headlineGrams(title: string): Set<string> {
    const words = normalizeName(title).split(' ').filter(Boolean);
    const grams = new Set<string>();

    for (let start = 0; start < words.length; start += 1) {
        for (let size = 1; size <= MAX_NAME_WORDS && start + size <= words.length; size += 1) {
            grams.add(words.slice(start, start + size).join(' '));
        }
    }

    return grams;
}

/**
 * Below this an article is a tag dump rather than a story.
 *
 * @see matchArticles
 */
const MAX_CATEGORIES = 12;

/** Long enough for "queens of the stone age", which is the longest name seen in the library. */
const MAX_NAME_WORDS = 6;

/**
 * The name has to appear in the headline, not merely in the tags.
 *
 * The single highest-value rule here: it cut 64 tag matches to 28, and everything it removed
 * was tangential rather than wrong. A Stereogum piece really is tagged "Ed Sheeran" while its
 * headline is about KATSEYE covering Charli XCX, and nobody wants that filed under Ed Sheeran.
 */
const HEADLINE_MIN_LENGTH = 6;

const ROUNDUP_ARTIST_COUNT = 3;

const ROUNDUP_TITLE =
    /new music friday|&\s*more\b|\band more\b|best .* of the (week|month|year)|\d+ (best|greatest)/i;

/**
 * Editorial vocabulary that is never an artist tag, however much a band shares the name.
 *
 * This exists because of one real collision: the band Live matched Consequence's
 * `<category>Live</category>` on an article about Noah Kahan. Any band named after a section
 * heading or a genre would do the same, so the list is by section name rather than by band.
 */
const SECTION_TAGS = new Set([
    'album',
    'alternative',
    'and more',
    'anniversary',
    'best of',
    'blues',
    'classical',
    'concert review',
    'country',
    'drama',
    'electronic',
    'featured',
    'features',
    'festival announcements',
    'festivals',
    'film',
    'folk',
    'from the magazine',
    'galleries',
    'hip hop',
    'indie',
    'interviews',
    'jazz',
    'link in bio',
    'lists',
    'live',
    'metal',
    'music',
    'music news',
    'new music',
    'news',
    'news bites',
    'obituary',
    'opinion',
    'photos',
    'pop',
    'premiere',
    'punk',
    'rap',
    'r b',
    'reviews',
    'rock',
    'singles',
    'song',
    'soul',
    'streaming',
    'tour dates',
    'tv',
    'tv movie news',
    'tv movies',
    'video',
]);
