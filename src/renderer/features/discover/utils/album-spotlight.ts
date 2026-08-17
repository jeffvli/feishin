import { DiscoverItem } from '/@/renderer/features/discover/utils/lb-adapters';
import { normalizeName } from '/@/renderer/features/discover/utils/library-match';

/**
 * A record several suggestions independently landed on.
 *
 * Worth separating from the carousels because it answers a different question. Every other row
 * says "here is a track you might like"; this says "these came from different places and all
 * point at the same album", which is the case for listening to the whole thing.
 */
export interface AlbumSpotlight {
    albumName: string;
    artistName: string;
    imageUrl: null | string;
    releaseGroupMbid: null | string;
    tracks: DiscoverItem[];
}

/**
 * The album with the most surviving recommendations, or null when nothing stands out.
 *
 * Fed the list the merged row already filtered, so every track counted here is one the user
 * neither owns nor has played. That is what makes the count mean something: five tracks from
 * one record reaching this point is five separate suggestions agreeing, not one playlist that
 * happened to be sequenced by album.
 */
export function pickAlbumSpotlight(items: DiscoverItem[]): AlbumSpotlight | null {
    const groups = new Map<string, DiscoverItem[]>();

    for (const item of items) {
        if (item.kind !== 'track' || !item.albumName) {
            continue;
        }

        // Singles carry the track name as the release name, so a one-track "album" here is
        // usually a single rather than a record with more to offer.
        if (normalizeName(item.albumName) === normalizeName(item.title)) {
            continue;
        }

        const key = `${normalizeName(item.artistName)}|${normalizeName(item.albumName)}`;
        const group = groups.get(key);

        if (group) {
            group.push(item);
        } else {
            groups.set(key, [item]);
        }
    }

    let best: DiscoverItem[] | null = null;

    for (const group of groups.values()) {
        if (group.length >= MIN_TRACKS && (!best || group.length > best.length)) {
            best = group;
        }
    }

    if (!best) {
        return null;
    }

    return {
        albumName: best[0].albumName ?? '',
        artistName: best[0].artistName,
        // Tracks from one release share a cover, but only the ones ListenBrainz mapped carry
        // it, so take the first that has one rather than assuming the first track does.
        imageUrl: best.find((track) => track.imageUrl)?.imageUrl ?? null,
        releaseGroupMbid: best.find((track) => track.releaseGroupMbid)?.releaseGroupMbid ?? null,
        tracks: best.slice(0, MAX_TRACKS),
    };
}

/**
 * Below this the agreement is not meaningful.
 *
 * Two tracks from one record happens by chance whenever a source returns anything album-shaped;
 * three separate suggestions converging is the point at which the album itself is the finding.
 */
const MIN_TRACKS = 3;

/** Enough to fill the panel beside the cover without scrolling it. */
const MAX_TRACKS = 6;
