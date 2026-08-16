import { queryOptions } from '@tanstack/react-query';

/**
 * Artist images from TheAudioDB.
 *
 * Neither MusicBrainz nor the Cover Art Archive has an artist image: CAA answers 400 for an
 * artist entity, and MusicBrainz exposes an `image` relation on only a minority of artists
 * behind a 1 request/second limit shared across the whole egress IP. Deezer has the best
 * imagery but sends no `Access-Control-Allow-Origin` at all, so the browser cannot read it.
 *
 * TheAudioDB is the only source found that is keyless, one call per artist, and sends
 * `access-control-allow-origin: *`, which is what lets this work unchanged in the static web
 * build as well as in Electron.
 */

const AUDIODB_API = 'https://www.theaudiodb.com/api/v1/json/2';

interface AudioDbArtist {
    strArtist?: string;
    strArtistThumb?: null | string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Images change far less often than anything else on the page, and this is a third-party
 * service being asked once per artist card, so hold the answer for a day.
 */
const CACHE = {
    gcTime: 1000 * 60 * 60 * 24,
    retry: 0,
    staleTime: 1000 * 60 * 60 * 24,
};

async function audioDbFetch(path: string, signal?: AbortSignal): Promise<AudioDbArtist[]> {
    const response = await fetch(`${AUDIODB_API}${path}`, { signal });

    if (!response.ok) {
        throw new Error(`TheAudioDB ${response.status}`);
    }

    const body = (await response.json()) as { artists?: AudioDbArtist[] | null };

    return body.artists ?? [];
}

/** Same normalisation the library index uses, so a name match here means the same thing. */
function normalize(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

async function resolveArtistImage(
    mbid: null | string,
    name: string,
    signal?: AbortSignal,
): Promise<null | string> {
    if (mbid) {
        const byMbid = await audioDbFetch(`/artist-mb.php?i=${mbid}`, signal);
        const thumb = byMbid[0]?.strArtistThumb;

        if (thumb) {
            return thumb;
        }
    }

    // Name search fuzzy matches, and badly: "MIKE" comes back as "Mike" and "Ichiko Aoba" as
    // the Japanese spelling. Accepting it unchecked would put the wrong face on a card.
    const byName = await audioDbFetch(`/search.php?s=${encodeURIComponent(name)}`, signal);
    const match = byName.find((artist) => normalize(artist.strArtist ?? '') === normalize(name));

    return match?.strArtistThumb ?? null;
}

export const artistImageQueries = {
    /**
     * `id` is the MusicBrainz artist MBID when ListenBrainz supplied one, and a synthetic
     * `artist-{name}` key when it did not, so it is tested rather than trusted.
     */
    byArtist: (id: string, name: string) =>
        queryOptions({
            ...CACHE,
            queryFn: ({ signal }) =>
                resolveArtistImage(UUID_PATTERN.test(id) ? id : null, name, signal).catch(
                    () => null,
                ),
            queryKey: ['audiodb', 'artist-image', id, name] as const,
        }),
};
