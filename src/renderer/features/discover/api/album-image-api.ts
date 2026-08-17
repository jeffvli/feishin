import { queryOptions } from '@tanstack/react-query';

/**
 * Album art from TheAudioDB, as a second source behind the Cover Art Archive.
 *
 * The CAA art a ListenBrainz item points at is served by archive.org, which answers slowly
 * enough to time the request out from some connections, and coverartarchive.org is no help
 * because it redirects to the same host. TheAudioDB is keyless, needs one call per album, and
 * sends `access-control-allow-origin: *`, so it works in the static web build as well as in
 * Electron, the same reasons the artist images come from it.
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
 * service being asked once per album, so hold the answer for a day.
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

async function resolveAlbumImage(
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

export const albumImageQueries = {
    /**
     * Keyed on the two names because that is all the endpoint takes: TheAudioDB has no album
     * lookup by MBID, so a release MBID from ListenBrainz cannot be used here.
     */
    byAlbum: (artistName: string, albumName: string) =>
        queryOptions({
            ...CACHE,
            queryFn: ({ signal }) =>
                resolveAlbumImage(artistName, albumName, signal).catch(() => null),
            queryKey: ['audiodb', 'album-image', artistName, albumName] as const,
        }),
};
