import { LbUrlRel } from '/@/renderer/features/discover/api/listenbrainz-types';

/**
 * Resolves a ~30 second preview clip from the iTunes Search API.
 *
 * Chosen over Deezer because Apple sends `access-control-allow-origin: *` on both the search
 * endpoint and the audio, so this runs unchanged in the renderer on the Electron build and
 * the static-nginx web build alike. Deezer's API sends CORS headers but omits
 * `Access-Control-Allow-Origin` entirely, so it needs a server to proxy it and the web build
 * has none.
 */

export interface PreviewQuery {
    artistName: string;
    title: string;
    /** ListenBrainz `url_rels`, which may contain an exact Apple Music track link. */
    urlRels?: LbUrlRel[];
}

interface ItunesResult {
    artistName?: string;
    previewUrl?: string;
    trackName?: string;
}

export async function resolveItunesPreview(
    query: PreviewQuery,
    signal?: AbortSignal,
): Promise<null | string> {
    // Exact path. ListenBrainz often knows the Apple Music track outright, which sidesteps
    // the wrong-track problem text search has: searching "chvrches lies" on Deezer returns
    // "Addicted to Love (From Tell Me Lies Season 3)".
    for (const rel of query.urlRels ?? []) {
        const parsed = parseAppleMusicUrl(rel.url);

        if (!parsed) {
            continue;
        }

        try {
            const results = await itunesFetch(
                `https://itunes.apple.com/lookup?id=${parsed.id}&country=${parsed.storefront}`,
                signal,
            );
            const previewUrl = results.find((result) => result.previewUrl)?.previewUrl;

            if (previewUrl) {
                return previewUrl;
            }
        } catch (error) {
            if ((error as Error).name === 'AbortError') {
                throw error;
            }
            // Fall through to the text search below.
        }
    }

    // Fuzzy path.
    const term = encodeURIComponent(`${query.artistName} ${query.title}`);
    const results = await itunesFetch(
        `https://itunes.apple.com/search?term=${term}&entity=song&limit=5`,
        signal,
    );

    const wantedArtist = normalize(query.artistName);
    const wantedTitle = normalize(query.title);

    const scored = results
        .filter((result) => result.previewUrl)
        .map((result) => {
            const artist = normalize(result.artistName ?? '');
            const title = normalize(result.trackName ?? '');
            const artistMatches = artist === wantedArtist || artist.includes(wantedArtist);
            const titleMatches = title === wantedTitle || title.includes(wantedTitle);

            return { result, score: (artistMatches ? 2 : 0) + (titleMatches ? 1 : 0) };
        })
        .sort((a, b) => b.score - a.score);

    // Requiring the artist to match is what keeps a same-titled cover or soundtrack version
    // from being served as the preview.
    const best = scored[0];

    return best && best.score >= 2 ? (best.result.previewUrl ?? null) : null;
}

async function itunesFetch(url: string, signal?: AbortSignal): Promise<ItunesResult[]> {
    const response = await fetch(url, { signal });

    if (!response.ok) {
        throw new Error(`iTunes ${response.status}`);
    }

    // The endpoint answers with `content-type: text/javascript`, but the body is plain JSON.
    const body = (await response.json()) as { results?: ItunesResult[] };

    return body.results ?? [];
}

/** Lowercase, strip punctuation and bracketed suffixes, so "Lies (Remastered)" matches "Lies". */
function normalize(value: string): string {
    return value
        .toLowerCase()
        .replace(/\(.*?\)|\[.*?\]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

/**
 * An Apple Music track link and its storefront, e.g.
 * `https://music.apple.com/gb/song/671942200` or `.../album/name/123?i=671942200`.
 *
 * The storefront matters: looking that id up without `country=gb` returns zero results,
 * because the default storefront is the US one and track ids are per-storefront.
 */
function parseAppleMusicUrl(url: string): null | { id: string; storefront: string } {
    const match = /music\.apple\.com\/([a-z]{2})\//i.exec(url);

    if (!match) {
        return null;
    }

    const storefront = match[1];
    const albumTrackId = /[?&]i=(\d+)/.exec(url)?.[1];
    const songId = /\/song\/(?:[^/?#]*\/)?(\d+)/.exec(url)?.[1];
    const id = albumTrackId ?? songId;

    return id ? { id, storefront } : null;
}
