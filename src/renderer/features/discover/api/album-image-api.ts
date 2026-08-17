import { queryOptions } from '@tanstack/react-query';

import { resolveItunesAlbumArt } from '/@/renderer/features/discover/api/itunes-album-art';
import { CREDIT_SEPARATOR } from '/@/renderer/features/discover/utils/library-match';

/**
 * Album art from TheAudioDB and then iTunes, the two sources behind the Cover Art Archive.
 *
 * The CAA art a ListenBrainz item points at is served by archive.org, which answers slowly
 * enough to time the request out from some connections and has been returning 502 outright, and
 * coverartarchive.org is no help because it redirects to the same host.
 *
 * TheAudioDB goes first because it is keyless and publishes no rate limit, where Apple allows
 * roughly 20 searches a minute per address and the preview player already spends from that same
 * allowance. Asking the unmetered catalogue first means the metered one is only asked about the
 * albums TheAudioDB misses, which on a page of mostly back catalogue is a handful rather than
 * all of them. That ordering costs nothing where it matters: the records TheAudioDB does not
 * hold are the new ones, which is exactly the set iTunes exists here to answer.
 *
 * TheAudioDB's images are served from `r2.theaudiodb.com`, which sends no CORS headers. They
 * render in an `<img>`, but a canvas cannot read their pixels, so a hero card covered from
 * there gets no background gradient. Apple's artwork host sends `access-control-allow-origin:
 * *` and has no such problem.
 */

const AUDIODB_API = 'https://www.theaudiodb.com/api/v1/json/2';

interface AudioDbAlbum {
    strAlbum?: string;
    strAlbumThumb?: null | string;
    strArtist?: string;
}

/**
 * Images change far less often than anything else on the page, and this is up to three
 * third-party requests per album, one of them against a metered allowance, so hold the answer
 * for a day.
 */
const CACHE = {
    gcTime: 1000 * 60 * 60 * 24,
    retry: 0,
    staleTime: 1000 * 60 * 60 * 24,
};

async function audioDbFetch(path: string, signal?: AbortSignal): Promise<AudioDbAlbum[]> {
    const response = await fetch(`${AUDIODB_API}${path}`, { signal });

    if (!response.ok) {
        throw new Error(`TheAudioDB ${response.status}`);
    }

    const body = (await response.json()) as { album?: AudioDbAlbum[] | null };

    return body.album ?? [];
}

/**
 * A release title without the qualifiers MusicBrainz adds and the other catalogues do not
 * carry: a title bracketed end to end, such as ListenBrainz's "[Led Zeppelin IV]", and a
 * trailing "Title: Subtitle" qualifier, such as "In Between Dreams: Album Snippets". A trailing
 * parenthetical after the colon, such as "Vol. 3: (The Subliminal Verses)", is left alone
 * because that is part of the title a catalogue stores, not a qualifier MusicBrainz appended.
 */
function bareAlbumTitle(albumName: string): string {
    const bracketed = /^\[(.+)\]$/.exec(albumName);
    const unwrapped = bracketed ? bracketed[1] : albumName;

    const qualified = /^(.*?): (.+)$/.exec(unwrapped);

    if (qualified && !/^\(.*\)$/.test(qualified[2])) {
        return qualified[1];
    }

    return unwrapped;
}

/**
 * The lead name out of a multi-artist credit, so "Kendrick Lamar with SZA" reduces to
 * "Kendrick Lamar".
 *
 * Splits on the separator the library matcher uses, but keeps the raw text either side of it
 * rather than going through `normalizeName`. Normalising is right for comparing two names to
 * each other and wrong for sending one to a search endpoint that looks its stored spelling up:
 * it turns "Panic! at the Disco" into "panic at the disco" and "The Rolling Stones" into
 * "rolling stones", and TheAudioDB returns nothing for either.
 */
function leadArtist(artistName: string): string {
    return artistName.split(CREDIT_SEPARATOR)[0]?.trim() || artistName;
}

async function lookupAlbumThumb(
    artistName: string,
    albumName: string,
    signal?: AbortSignal,
): Promise<null | string> {
    const albums = await audioDbFetch(
        `/searchalbum.php?s=${encodeURIComponent(artistName)}&a=${encodeURIComponent(albumName)}`,
        signal,
    );

    // Unlike the artist search this one matches both names exactly, apart from case, so a row
    // that comes back is already the right record and needs no second check. What it does do is
    // return a title more than once when the catalogue holds several editions of it, and an
    // edition can carry no art, so take the first row that actually has a thumbnail.
    return albums.find((album) => album.strAlbumThumb)?.strAlbumThumb ?? null;
}

async function resolveAlbumImage(
    artistName: string,
    albumName: string,
    signal?: AbortSignal,
): Promise<null | string> {
    const thumb = await lookupAlbumThumb(artistName, albumName, signal);

    if (thumb) {
        return thumb;
    }

    const cleanedArtist = leadArtist(artistName);
    const cleanedAlbum = bareAlbumTitle(albumName);

    // TheAudioDB has no fuzzy fallback, so a miss on the literal ListenBrainz credit and title
    // gets exactly one retry with the lead artist and the bare title. Skip it when neither name
    // actually changes: that pair already ran as the first request, and TheAudioDB gets a hard
    // cap of two calls per album, not a place to retry the same query.
    if (cleanedArtist !== artistName || cleanedAlbum !== albumName) {
        const cleanedThumb = await lookupAlbumThumb(cleanedArtist, cleanedAlbum, signal);

        if (cleanedThumb) {
            return cleanedThumb;
        }
    }

    // One iTunes request per album, never two. Apple does its own fuzzy matching on a single
    // search term, so the cleaned names are sent because a store lists the lead artist and the
    // bare title, not because a second spelling is worth another slice of the rate limit.
    return resolveItunesAlbumArt(cleanedArtist, cleanedAlbum, signal);
}

export const albumImageQueries = {
    /**
     * Keyed on the two names because that is all either endpoint takes: neither has an album
     * lookup by MBID, so a release MBID from ListenBrainz cannot be used here. The key names no
     * source, since one entry stands for whichever of them answered, and it does not need to
     * reflect the cleanup and fallback inside resolveAlbumImage because those are deterministic
     * from the same pair.
     */
    byAlbum: (artistName: string, albumName: string) =>
        queryOptions({
            ...CACHE,
            queryFn: ({ signal }) =>
                resolveAlbumImage(artistName, albumName, signal).catch(() => null),
            queryKey: ['discover', 'album-image', artistName, albumName] as const,
        }),
};
