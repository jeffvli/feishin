import { queryOptions } from '@tanstack/react-query';

import { CREDIT_SEPARATOR } from '/@/renderer/features/discover/utils/library-match';

/**
 * Album art from TheAudioDB, as a second source behind the Cover Art Archive.
 *
 * The CAA art a ListenBrainz item points at is served by archive.org, which answers slowly
 * enough to time the request out from some connections, and coverartarchive.org is no help
 * because it redirects to the same host. TheAudioDB is keyless, needs at most two calls per
 * album, and sends `access-control-allow-origin: *`, so it works in the static web build as
 * well as in Electron, the same reasons the artist images come from it.
 *
 * The images themselves are served from `r2.theaudiodb.com`, which sends no CORS headers.
 * They render in an `<img>`, but a canvas cannot read their pixels.
 */

const AUDIODB_API = 'https://www.theaudiodb.com/api/v1/json/2';

interface AudioDbAlbum {
    strAlbum?: string;
    strAlbumThumb?: null | string;
    strArtist?: string;
}

/**
 * Images change far less often than anything else on the page, and this is a third-party
 * service being asked once or twice per album, so hold the answer for a day.
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
 * A release title with the qualifiers MusicBrainz adds and TheAudioDB does not carry: a title
 * bracketed end to end, such as ListenBrainz's "[Led Zeppelin IV]", and a trailing
 * "Title: Subtitle" qualifier, such as "In Between Dreams: Album Snippets". A trailing
 * parenthetical after the colon, such as "Vol. 3: (The Subliminal Verses)", is left alone
 * because that is part of the title TheAudioDB stores, not a qualifier MusicBrainz appended.
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
 * each other and wrong for sending one to this endpoint, which matches its stored spelling
 * exactly apart from case: it turns "Panic! at the Disco" into "panic at the disco" and "The
 * Rolling Stones" into "rolling stones", and TheAudioDB returns nothing for either.
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

    // TheAudioDB has no fuzzy fallback, so a miss on the literal ListenBrainz credit and title
    // gets exactly one retry with the lead artist and the bare title. Skip it when neither name
    // actually changes: that pair already ran as the first request, and this is a hard cap of
    // two calls per album, not a place to retry the same query.
    const cleanedArtist = leadArtist(artistName);
    const cleanedAlbum = bareAlbumTitle(albumName);

    if (cleanedArtist === artistName && cleanedAlbum === albumName) {
        return null;
    }

    return lookupAlbumThumb(cleanedArtist, cleanedAlbum, signal);
}

export const albumImageQueries = {
    /**
     * Keyed on the two names because that is all the endpoint takes: TheAudioDB has no album
     * lookup by MBID, so a release MBID from ListenBrainz cannot be used here. The key does not
     * need to reflect the cleanup retry inside resolveAlbumImage, since that is deterministic
     * from the same pair.
     */
    byAlbum: (artistName: string, albumName: string) =>
        queryOptions({
            ...CACHE,
            queryFn: ({ signal }) =>
                resolveAlbumImage(artistName, albumName, signal).catch(() => null),
            queryKey: ['audiodb', 'album-image', artistName, albumName] as const,
        }),
};
