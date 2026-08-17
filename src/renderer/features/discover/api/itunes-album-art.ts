/**
 * Album art from the iTunes Search API, for the records the other two sources cannot hold.
 *
 * The fresh releases row is news by definition, and some of it is not out yet. MusicBrainz has
 * no cover for a release nobody has scanned, and TheAudioDB answers `{"album": null}` for a
 * record it has not catalogued, so the row with the largest cards is the one most likely to
 * come back blank. A commercial catalogue lists a record from announcement, which is exactly
 * the gap.
 *
 * Apple also sends `access-control-allow-origin: *` on the artwork host, where TheAudioDB's
 * `r2.theaudiodb.com` sends no CORS headers at all. That matters on those same hero cards,
 * because they read the cover's pixels through a canvas to derive the row's background
 * gradient, and a canvas cannot touch an image the host would not vouch for.
 */

const ITUNES_SEARCH = 'https://itunes.apple.com/search';

/**
 * The hero card is at least 280px tall and the same image is stretched behind the whole row as
 * the backdrop, so the 100px thumbnail the search returns is not usable as it stands.
 */
const ARTWORK_PIXELS = 600;

/**
 * A burst of requests, then a trickle.
 *
 * Apple allows roughly 20 search requests a minute per address, publishes no header to read the
 * remaining budget from, and answers 403 for several minutes once it is overrun. The preview
 * player spends from the same allowance, so this takes half of it: `BURST` at once, then one
 * every `REFILL_MS`. That leaves enough for someone previewing clips while the page fills in,
 * which is the cost of getting this wrong.
 *
 * The burst is sized to the fresh releases row, a handful of albums. Lookups reach here in
 * roughly the order the page asks for them, and the page asks for its hero row first, so the
 * cards that most need a cover tend to be the ones that get the immediate requests.
 */
const BURST = 6;

const REFILL_MS = 6000;

/** Five rows is enough for the record to outrank a compilation or soundtrack carrying its name. */
const SEARCH_LIMIT = 5;

interface ItunesAlbum {
    artistName?: string;
    artworkUrl100?: string;
    collectionName?: string;
}

/** Fractional, so the bucket refills continuously rather than a whole token at a time. */
let tokens = BURST;

let lastRefill = Date.now();

/** Serialises the waiting, so two callers cannot be handed the same token. */
let queue: Promise<void> = Promise.resolve();

export async function resolveItunesAlbumArt(
    artistName: string,
    albumName: string,
    signal?: AbortSignal,
): Promise<null | string> {
    const results = await itunesSearch(`${artistName} ${albumName}`, signal);

    const wantedArtist = normalize(artistName);
    const wantedAlbum = normalize(albumName);

    const scored = results
        .filter((result) => result.artworkUrl100)
        .map((result) => {
            const artist = normalize(result.artistName ?? '');
            const album = normalize(result.collectionName ?? '');
            const artistMatches = artist === wantedArtist || artist.includes(wantedArtist);
            // `includes` rather than equality carries the suffix a store puts on a short
            // release, so "Karaoke Bar" matches the "Karaoke Bar - Single" Apple lists it under.
            const albumMatches = album === wantedAlbum || album.includes(wantedAlbum);

            return { result, score: (artistMatches ? 2 : 0) + (albumMatches ? 1 : 0) };
        })
        .sort((a, b) => b.score - a.score);

    // Both names have to match, a stricter bar than the preview player asks of a clip. A clip
    // from the wrong record by the right artist is a moment's confusion; the cover is the whole
    // of what a card shows, so a confident wrong one is worse than the placeholder it replaced.
    const best = scored[0];
    const artwork = best && best.score >= 3 ? best.result.artworkUrl100 : undefined;

    return artwork ? atSize(artwork, ARTWORK_PIXELS) : null;
}

/** Shaped like the one `fetch` throws, so a caller can tell a cancellation from a failure. */
function abortError(): Error {
    return new DOMException('Aborted', 'AbortError');
}

/**
 * The size is part of the artwork path, so a larger one is had by rewriting it. Always asked for
 * as `jpg`: that trailing extension chooses the encoding rather than describing the source, and
 * Apple re-encodes the records whose master is a png.
 */
function atSize(artworkUrl: string, pixels: number): string {
    return artworkUrl.replace(/\/\d+x\d+bb\.(?:jpg|png)$/, `/${pixels}x${pixels}bb.jpg`);
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(resolve, ms);

        signal?.addEventListener(
            'abort',
            () => {
                clearTimeout(timer);
                reject(abortError());
            },
            { once: true },
        );
    });
}

async function itunesSearch(term: string, signal?: AbortSignal): Promise<ItunesAlbum[]> {
    await takeToken(signal);

    const url = `${ITUNES_SEARCH}?term=${encodeURIComponent(term)}&entity=album&limit=${SEARCH_LIMIT}`;
    const response = await fetch(url, { signal });

    if (!response.ok) {
        throw new Error(`iTunes ${response.status}`);
    }

    // The endpoint answers with `content-type: text/javascript`, but the body is plain JSON.
    const body = (await response.json()) as { results?: ItunesAlbum[] };

    return body.results ?? [];
}

/** Lowercase, strip punctuation and bracketed suffixes, so "Filters (Deluxe)" matches "Filters". */
function normalize(value: string): string {
    return value
        .toLowerCase()
        .replace(/\(.*?\)|\[.*?\]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

function takeToken(signal?: AbortSignal): Promise<void> {
    const turn = queue.then(async () => {
        // Checked at the head of the queue rather than on the way in: a lookup cancelled while
        // it waited should give its place up instead of spending a token on nobody.
        if (signal?.aborted) {
            throw abortError();
        }

        const now = Date.now();

        // Refilled from elapsed time rather than by a timer, so an idle page schedules nothing
        // and one left open in a background tab comes back with a full bucket.
        tokens = Math.min(BURST, tokens + (now - lastRefill) / REFILL_MS);
        lastRefill = now;

        if (tokens < 1) {
            await delay((1 - tokens) * REFILL_MS, signal);
            tokens = 1;
            lastRefill = Date.now();
        }

        tokens -= 1;
    });

    // The chain has to outlive a rejection, or one cancelled lookup would strand every lookup
    // queued behind it.
    queue = turn.then(
        () => undefined,
        () => undefined,
    );

    return turn;
}
