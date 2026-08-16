import { ipcMain } from 'electron';

/**
 * Deezer preview lookup, as a desktop-only fallback for when iTunes has no match.
 *
 * This lives in the main process because Deezer's API sends `access-control-allow-credentials`
 * and friends but no `Access-Control-Allow-Origin`, so a browser blocks it outright. There is
 * no CORS in the main process. The web build has no main process and so simply goes without
 * this fallback, which is why iTunes is the primary provider rather than this.
 */

interface DeezerTrack {
    preview?: string;
}

const REQUEST_TIMEOUT_MS = 10000;

async function deezerFetch<T>(url: string): Promise<null | T> {
    try {
        const response = await fetch(url, {
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

        if (!response.ok) {
            return null;
        }

        return (await response.json()) as T;
    } catch {
        return null;
    }
}

/** The numeric track id in a `https://www.deezer.com/track/69018826` relationship URL. */
function parseDeezerTrackId(url: string): null | string {
    return /deezer\.com\/(?:[a-z]{2}\/)?track\/(\d+)/i.exec(url)?.[1] ?? null;
}

ipcMain.handle(
    'preview-resolve-deezer',
    async (
        _event,
        query: { artistName: string; title: string; urlRels?: Array<{ url: string }> },
    ): Promise<null | string> => {
        // Exact, when ListenBrainz already knows which Deezer track this is.
        for (const rel of query.urlRels ?? []) {
            const trackId = parseDeezerTrackId(rel.url);

            if (!trackId) {
                continue;
            }

            const track = await deezerFetch<DeezerTrack>(`https://api.deezer.com/track/${trackId}`);

            if (track?.preview) {
                return track.preview;
            }
        }

        // Field-scoped search, so the artist constrains the query rather than being one more
        // bag of words for the ranker to discount.
        const term = encodeURIComponent(`artist:"${query.artistName}" track:"${query.title}"`);
        const results = await deezerFetch<{ data?: DeezerTrack[] }>(
            `https://api.deezer.com/search/track?q=${term}`,
        );

        return results?.data?.find((hit) => hit.preview)?.preview ?? null;
    },
);
