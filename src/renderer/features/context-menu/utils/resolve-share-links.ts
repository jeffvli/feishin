import {
    browseByArtist,
    fetchUrlRels,
    type MbBrowseableEntityType,
    type MbEntityType,
    searchArtist,
} from '/@/renderer/features/context-menu/api/musicbrainz-links';
import {
    type ExternalService,
    matchExternalLinks,
} from '/@/renderer/features/context-menu/utils/external-links';
import { logger } from '/@/renderer/utils/logger';
import {
    Album,
    AlbumArtist,
    Artist,
    Folder,
    LibraryItem,
    QueueSong,
    Song,
} from '/@/shared/types/domain-types';

export type ShareableItem = Album | AlbumArtist | Artist | Folder | QueueSong | Song;

type Matches = Partial<Record<ExternalService, string>>;

/**
 * How sure MusicBrainz has to be before an artist search hit is trusted. A wrong match here
 * means linking out to a different artist entirely (or browsing the wrong artist's catalog for
 * a song/album lookup) - worth holding out for MusicBrainz's own near-exact score rather than
 * taking whatever result sorts first.
 */
const SEARCH_CONFIDENCE_THRESHOLD = 95;

const hasMatches = (matches: Matches) => Object.keys(matches).length > 0;

const normalizeTitle = (title: string) => title.trim().toLowerCase();

/**
 * Finds direct streaming links for a single library item, trying the most trustworthy source
 * first and only reaching for the next when the previous one comes back with nothing:
 *
 * 1. The item's own embedded MusicBrainz id, when the file was Picard-tagged with one.
 * 2. For an album only, its release group id - MusicBrainz style guidelines put streaming
 *    rels on the Release, but editors often link the Release Group instead.
 * 3. For a song/album, resolving the artist by name and browsing their whole catalog, for
 *    libraries that were never Picard-tagged at all.
 *
 * Never fabricates a link: a service only appears in the result when one of these attempts
 * actually named it.
 */
export async function resolveShareLinks(
    itemType: LibraryItem,
    item: ShareableItem,
    signal?: AbortSignal,
): Promise<Matches> {
    try {
        return await resolveShareLinksUnsafe(itemType, item, signal);
    } catch (error) {
        // An aborted lookup (menu closed mid-fetch) isn't a failure - React Query already
        // discards its result, so surfacing it as a warning would just be noise on every
        // hover-then-leave. Anything else is a real failure that would otherwise render
        // identically to "MusicBrainz genuinely has nothing", which is worth telling apart.
        if (error instanceof DOMException && error.name === 'AbortError') {
            throw error;
        }

        logger.warn(
            `Share links lookup failed for ${itemType} "${(item as { name?: string }).name}": ${String(error)}`,
        );
        return {};
    }
}

/**
 * Resolves an artist by name, then tries every candidate at or above the confidence threshold
 * in turn - a same-named-artist collision is rare but not impossible, and MusicBrainz's own
 * score doesn't say which of several equally-confident hits is the right one.
 */
async function lookupArtistByName(name: string, signal?: AbortSignal): Promise<Matches> {
    const candidates = await searchArtist(name, signal);
    const confident = candidates.filter(
        (candidate) => candidate.score >= SEARCH_CONFIDENCE_THRESHOLD,
    );

    for (const candidate of confident) {
        const matches = await lookupEntity('artist', candidate.mbid, signal);
        if (hasMatches(matches)) return matches;
    }

    return {};
}

async function lookupEntity(
    entityType: MbEntityType,
    mbid: null | string,
    signal?: AbortSignal,
): Promise<Matches> {
    if (!mbid) return {};
    return matchExternalLinks(await fetchUrlRels(entityType, mbid, signal));
}

/**
 * A song or album title commonly repeats dozens of times across one artist's own catalog - the
 * album cut, a radio edit, a remaster, a deluxe-reissue bonus track - and MusicBrainz's
 * free-text search has no reliable way to surface which of those duplicates carries
 * community-added streaming links: the same query can come back with a different arbitrary
 * sample of the ties on every call. Resolving the artist once and browsing their full catalog
 * (which, unlike search, can include url-rels directly) sidesteps that: every title-matching
 * duplicate gets checked, and their rels are merged, so a lookup finding Spotify on one
 * duplicate and Deezer on another still returns both.
 */
async function lookupViaArtistCatalog(
    entityType: MbBrowseableEntityType,
    title: string,
    artistName: string,
    signal?: AbortSignal,
): Promise<Matches> {
    const artistCandidates = await searchArtist(artistName, signal);
    const artist = artistCandidates.find(
        (candidate) => candidate.score >= SEARCH_CONFIDENCE_THRESHOLD,
    );
    if (!artist) return {};

    const hits = await browseByArtist(entityType, artist.mbid, signal);
    const wanted = normalizeTitle(title);
    const rels = hits
        .filter((hit) => normalizeTitle(hit.title) === wanted)
        .flatMap((hit) => hit.urlRels);

    return matchExternalLinks(rels);
}

async function resolveShareLinksUnsafe(
    itemType: LibraryItem,
    item: ShareableItem,
    signal?: AbortSignal,
): Promise<Matches> {
    switch (itemType) {
        case LibraryItem.ALBUM: {
            const album = item as Album;

            const direct = await lookupEntity('release', album.mbzId, signal);
            if (hasMatches(direct)) return direct;

            const viaReleaseGroup = await lookupEntity(
                'release-group',
                album.mbzReleaseGroupId,
                signal,
            );
            if (hasMatches(viaReleaseGroup)) return viaReleaseGroup;

            if (!album.albumArtistName) return {};
            return lookupViaArtistCatalog('release', album.name, album.albumArtistName, signal);
        }
        case LibraryItem.ALBUM_ARTIST:
        case LibraryItem.ARTIST: {
            const artist = item as AlbumArtist;

            const direct = await lookupEntity('artist', artist.mbz, signal);
            if (hasMatches(direct)) return direct;

            return lookupArtistByName(artist.name, signal);
        }
        case LibraryItem.PLAYLIST_SONG:
        case LibraryItem.SONG: {
            const song = item as Song;

            const direct = await lookupEntity('recording', song.mbzRecordingId, signal);
            if (hasMatches(direct)) return direct;

            if (!song.artistName) return {};
            return lookupViaArtistCatalog('recording', song.name, song.artistName, signal);
        }
        default:
            return {};
    }
}

/** Item types `resolveShareLinks` knows how to look up - everything else has no MusicBrainz shape. */
export const SHARE_LOOKUP_ELIGIBLE = new Set([
    LibraryItem.ALBUM,
    LibraryItem.ALBUM_ARTIST,
    LibraryItem.ARTIST,
    LibraryItem.PLAYLIST_SONG,
    LibraryItem.SONG,
]);
