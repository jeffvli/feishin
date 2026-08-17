import { normalizeName } from '/@/renderer/features/discover/utils/library-match';
import { MatchedArticle } from '/@/renderer/features/discover/utils/news-match';

/**
 * The final feed: recent, de-duplicated across outlets, and spread over artists and mastheads.
 *
 * De-duplication is not a refinement here, it is what makes the section readable. In the sample
 * this was tuned against, one Slipknot story ran in three outlets and one Noah Kahan story in
 * three more, so ten slots showed about five stories before clustering.
 */

interface Candidate {
    article: MatchedArticle;
    tokens: Set<string>;
}

export function rankArticles(articles: MatchedArticle[], now: number): MatchedArticle[] {
    const recent = articles
        .filter((article) => article.publishedAt > 0 && now - article.publishedAt <= MAX_AGE_MS)
        .map((article) => ({ article, tokens: storyTokens(article) }))
        .sort((a, b) => b.article.publishedAt - a.article.publishedAt);

    const clusters: Candidate[][] = [];

    for (const candidate of recent) {
        // Compared against every member, not just the first. Matching only the first splits a
        // three-outlet story into two clusters whenever the outlier headline happens to be the
        // one that landed first.
        const existing = clusters.find((cluster) =>
            cluster.some((member) => isSameStory(member, candidate)),
        );

        if (existing) {
            existing.push(candidate);
        } else {
            clusters.push([candidate]);
        }
    }

    // The earliest of a cluster is the outlet that broke the story.
    const stories = clusters
        .map((cluster) =>
            cluster.reduce((earliest, member) =>
                member.article.publishedAt < earliest.article.publishedAt ? member : earliest,
            ),
        )
        .map((candidate) => candidate.article)
        .sort((a, b) => b.publishedAt - a.publishedAt);

    const picked: MatchedArticle[] = [];
    const perOutlet = new Map<string, number>();
    const perArtist = new Map<string, number>();

    for (const article of stories) {
        if (picked.length >= ARTICLE_LIMIT) {
            break;
        }

        if ((perOutlet.get(article.outlet) ?? 0) >= MAX_PER_OUTLET) {
            continue;
        }

        if (article.artistKeys.some((key) => (perArtist.get(key) ?? 0) >= MAX_PER_ARTIST)) {
            continue;
        }

        picked.push(article);
        perOutlet.set(article.outlet, (perOutlet.get(article.outlet) ?? 0) + 1);

        for (const key of article.artistKeys) {
            perArtist.set(key, (perArtist.get(key) ?? 0) + 1);
        }
    }

    return picked;
}

/**
 * Whether two articles are the same story told twice.
 *
 * Overlap coefficient rather than Jaccard, because outlets write headlines of very different
 * lengths about one event and Jaccard punishes the longer one for existing. The Noah Kahan pair
 * that prompted this scores 0.33 by Jaccard, which misses it, and 0.50 by overlap, which does
 * not. Dividing by the smaller set asks "is the shorter headline contained in the longer one",
 * which is the actual question.
 */
function isSameStory(a: Candidate, b: Candidate): boolean {
    if (!a.article.artistKeys.some((key) => b.article.artistKeys.includes(key))) {
        return false;
    }

    if (Math.abs(a.article.publishedAt - b.article.publishedAt) > MAX_AGE_MS) {
        return false;
    }

    if (a.tokens.size === 0 || b.tokens.size === 0) {
        return false;
    }

    let shared = 0;

    for (const token of a.tokens) {
        if (b.tokens.has(token)) {
            shared += 1;
        }
    }

    return shared / Math.min(a.tokens.size, b.tokens.size) >= SAME_STORY_OVERLAP;
}

/**
 * What a headline says beyond naming the artist.
 *
 * The artist's own words are removed because two articles in a cluster are guaranteed to share
 * them, so leaving them in would score every pair of stories about one artist as the same
 * story. The generic verbs go for the same reason at lower strength: every second music
 * headline contains "announces" or "shares".
 */
function storyTokens(article: MatchedArticle): Set<string> {
    const artistWords = new Set(article.artistKeys.flatMap((key) => key.split(' ')));

    return new Set(
        normalizeName(article.title)
            .split(' ')
            .filter(
                (word) => word.length > 2 && !GENERIC_WORDS.has(word) && !artistWords.has(word),
            ),
    );
}

const ARTICLE_LIMIT = 10;

/**
 * Also the clustering window, deliberately: two reports more than four days apart are a story
 * and its follow-up, not one story, and should not collapse into a single entry.
 */
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 4;

/** One story per artist, so ten slots are ten artists rather than one artist's bad week. */
const MAX_PER_ARTIST = 1;

const MAX_PER_OUTLET = 2;

const SAME_STORY_OVERLAP = 0.45;

const GENERIC_WORDS = new Set([
    'after',
    'album',
    'and',
    'announce',
    'announced',
    'announces',
    'are',
    'confirm',
    'confirms',
    'for',
    'from',
    'hear',
    'her',
    'his',
    'listen',
    'more',
    'new',
    'out',
    'over',
    'said',
    'say',
    'says',
    'share',
    'shares',
    'song',
    'the',
    'their',
    'they',
    'this',
    'tour',
    'track',
    'video',
    'was',
    'watch',
    'with',
    'you',
]);
