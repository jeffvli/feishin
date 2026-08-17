import {
    LbFreshRelease,
    LbPlaylistTrack,
    LbRecordingMetadata,
    LbRecordingStat,
    LbSimilarArtist,
    LbSimilarRecording,
    LbUrlRel,
} from '/@/renderer/features/discover/api/listenbrainz-types';
import { normalizeName } from '/@/renderer/features/discover/utils/library-match';

/**
 * A ListenBrainz item flattened into the shape a card needs.
 *
 * Deliberately not one of the `domain-types` entities: those describe things that exist on
 * the user's own server and carry `_serverId` and roughly forty other required fields. A
 * Discover item has no server, no library id, and may not be ownable at all.
 */
export interface DiscoverItem {
    /**
     * The release this belongs to, for a track and a release alike.
     *
     * Distinct from `title`, which is the track name for a track and the release name for a
     * release. Library matching needs the release either way, so it cannot read `title`.
     */
    albumName: null | string;
    artistName: string;
    /**
     * Stable React key. Not a library id, so it cannot address anything on the user's server.
     *
     * For an artist it is the artist MBID, which `listenBrainzUrl` links out on. For a track it
     * is the recording MBID when ListenBrainz supplied one and a synthesised
     * `"${artist}-${title}"` string otherwise, so it is not safe to put in a URL unchecked.
     */
    id: string;
    imageUrl: null | string;
    kind: DiscoverItemKind;
    /** Present when the item is a track. Enables exact preview resolution. */
    recordingMbid: null | string;
    /**
     * The release group, which is the id both ListenBrainz and MusicBrainz treat as "the album".
     *
     * Separate from `releaseMbids` because that list is a bag of candidates for matching, where
     * an extra id costs nothing, while a URL needs the one id its route accepts.
     */
    releaseGroupMbid: null | string;
    /** Release and release-group ids, for matching against a library that records them. */
    releaseMbids: string[];
    /** Album name for tracks, or the release date for releases. Rendered as the second row. */
    subtitle: null | string;
    title: string;
    /** Direct Apple Music / Deezer track links, when ListenBrainz knows them. */
    urlRels: LbUrlRel[];
}

/** What a card stands for, which decides how it is matched against the library. */
export type DiscoverItemKind = 'artist' | 'release' | 'track';

/**
 * Cover art for a release, taken from the Cover Art Archive's copy on archive.org.
 *
 * ListenBrainz hands out `caa_id` and `caa_release_mbid` precisely so this URL can be built
 * without a lookup. Both this host and coverartarchive.org send `access-control-allow-origin: *`
 * through every redirect hop, so the image loads in the browser build too.
 */
export function coverArtUrl(
    caaReleaseMbid: null | string | undefined,
    caaId: null | number | undefined,
    size: 250 | 500 = 250,
): null | string {
    if (!caaReleaseMbid || !caaId) {
        return null;
    }

    return `https://archive.org/download/mbid-${caaReleaseMbid}/mbid-${caaReleaseMbid}-${caaId}_thumb${size}.jpg`;
}

/** The MBID is the last path segment of a `https://musicbrainz.org/recording/{mbid}` URL. */
export function recordingMbidFromIdentifier(
    identifier: string | string[] | undefined,
): null | string {
    const first = Array.isArray(identifier) ? identifier[0] : identifier;

    if (!first) {
        return null;
    }

    const segment = first.split('/').pop();

    return segment && UUID_PATTERN.test(segment) ? segment : null;
}

/** Cover art when only a release group is known. Slower, because it redirects twice. */
export function releaseGroupArtUrl(releaseGroupMbid: null | string | undefined): null | string {
    if (!releaseGroupMbid) {
        return null;
    }

    return `https://coverartarchive.org/release-group/${releaseGroupMbid}/front-250`;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function fromFreshRelease(release: LbFreshRelease): DiscoverItem {
    return {
        albumName: release.release_name,
        artistName: release.artist_credit_name,
        id: release.release_mbid,
        imageUrl:
            coverArtUrl(release.caa_release_mbid, release.caa_id) ??
            releaseGroupArtUrl(release.release_group_mbid),
        kind: 'release',
        recordingMbid: null,
        releaseGroupMbid: release.release_group_mbid,
        releaseMbids: compact([release.release_mbid, release.release_group_mbid]),
        subtitle: release.release_date,
        title: release.release_name,
        urlRels: [],
    };
}

export function fromPlaylistTrack(track: LbPlaylistTrack): DiscoverItem {
    const extension = track.extension?.['https://musicbrainz.org/doc/jspf#track'];
    const metadata = extension?.additional_metadata;
    const recordingMbid = recordingMbidFromIdentifier(track.identifier);

    return {
        albumName: track.album ?? null,
        artistName: track.creator,
        id: recordingMbid ?? `${track.creator}-${track.title}`,
        imageUrl: coverArtUrl(metadata?.caa_release_mbid, metadata?.caa_id),
        kind: 'track',
        recordingMbid,
        releaseGroupMbid: null,
        releaseMbids: compact([metadata?.caa_release_mbid]),
        subtitle: track.album ?? null,
        title: track.title,
        urlRels: [],
    };
}

/** Recommendations arrive as bare MBIDs, so everything renderable comes from the metadata call. */
export function fromRecommendation(
    recordingMbid: string,
    metadata: LbRecordingMetadata,
): DiscoverItem | null {
    const entry = metadata[recordingMbid];

    if (!entry?.recording?.name) {
        return null;
    }

    return {
        albumName: entry.release?.name ?? null,
        artistName: entry.artist?.name ?? '',
        id: recordingMbid,
        imageUrl:
            coverArtUrl(entry.release?.caa_release_mbid, entry.release?.caa_id) ??
            releaseGroupArtUrl(entry.release?.release_group_mbid),
        kind: 'track',
        recordingMbid,
        releaseGroupMbid: entry.release?.release_group_mbid ?? null,
        releaseMbids: compact([entry.release?.caa_release_mbid, entry.release?.release_group_mbid]),
        subtitle: entry.release?.name ?? null,
        title: entry.recording.name,
        urlRels: entry.recording.url_rels ?? [],
    };
}

export function fromRecordingStat(stat: LbRecordingStat): DiscoverItem {
    return {
        albumName: stat.release_name,
        artistName: stat.artist_name,
        id: stat.recording_mbid ?? `${stat.artist_name}-${stat.track_name}`,
        imageUrl: coverArtUrl(stat.caa_release_mbid, stat.caa_id),
        kind: 'track',
        recordingMbid: stat.recording_mbid,
        releaseGroupMbid: null,
        releaseMbids: compact([stat.caa_release_mbid]),
        subtitle: stat.release_name,
        title: stat.track_name,
        urlRels: [],
    };
}

export function fromSimilarArtist(artist: LbSimilarArtist): DiscoverItem {
    return {
        albumName: null,
        artistName: artist.name,
        id: artist.artist_mbid,
        imageUrl: null,
        kind: 'artist',
        recordingMbid: null,
        releaseGroupMbid: null,
        releaseMbids: [],
        // The disambiguation comment, e.g. "American rock band", is the only extra thing the
        // endpoint knows about an artist and reads better than a raw similarity score.
        subtitle: artist.comment,
        title: artist.name,
        urlRels: [],
    };
}

export function fromSimilarRecording(recording: LbSimilarRecording): DiscoverItem {
    return {
        albumName: recording.release_name,
        artistName: recording.artist_credit_name,
        id: recording.recording_mbid,
        imageUrl: coverArtUrl(recording.caa_release_mbid, recording.caa_id),
        kind: 'track',
        recordingMbid: recording.recording_mbid,
        releaseGroupMbid: null,
        releaseMbids: compact([recording.release_mbid, recording.caa_release_mbid]),
        subtitle: recording.release_name,
        title: recording.recording_name,
        urlRels: [],
    };
}

/**
 * The item's page on listenbrainz.org, or null when nothing identifies it there.
 *
 * Each of the three routes accepts exactly one kind of MusicBrainz id and silently renders the
 * generic ListenBrainz shell for anything else, so a wrong id produces a page that looks like
 * the site working rather than an error. `/album/` in particular wants the release group:
 * served a release id it returns a response byte-identical to one for an invented uuid.
 *
 * Returning null is the ordinary case for a track ListenBrainz named without identifying, which
 * the adapters key on artist and title instead. That card stays unlinked rather than pointing
 * at a route no id of its own resolves.
 */
export function listenBrainzUrl(item: DiscoverItem): null | string {
    switch (item.kind) {
        case 'artist':
            return isMbid(item.id) ? `https://listenbrainz.org/artist/${item.id}/` : null;
        case 'release':
            return isMbid(item.releaseGroupMbid)
                ? `https://listenbrainz.org/album/${item.releaseGroupMbid}/`
                : null;
        case 'track':
            return isMbid(item.recordingMbid)
                ? `https://listenbrainz.org/track/${item.recordingMbid}/`
                : null;
    }
}

/**
 * Several suggestion sources reduced to one list, best first and without repeats.
 *
 * ListenBrainz answers "what should I hear next" five different ways, and each way arrives
 * under its own name: weekly jams, weekly exploration, collaborative filtering, similarity,
 * play counts. Those names describe how the suggestion was derived, which is a fact about
 * ListenBrainz rather than about the music, and splitting one page into five rows on that
 * basis asks the reader to classify recommendations instead of listening to them.
 *
 * Interleaved rather than concatenated because the sources differ in length by an order of
 * magnitude. A fifty track playlist appended in front of twenty collaborative filter picks
 * would bury the picks past the end of the visible strip.
 *
 * Deduplicated on artist and title rather than on the recording MBID. MusicBrainz gives a
 * single, an album cut and a remaster of one performance three separate recording ids, so
 * comparing ids reports twenty unique entries where a reader plainly sees the same song
 * repeated. The normalised name is the only key that matches what the eye matches.
 */
export function mergeDiscoverSources(sources: DiscoverItem[][]): DiscoverItem[] {
    const seen = new Set<string>();
    const merged: DiscoverItem[] = [];
    const longest = Math.max(0, ...sources.map((source) => source.length));

    for (let index = 0; index < longest; index += 1) {
        for (const source of sources) {
            const item = source[index];

            if (!item) {
                continue;
            }

            const key = `${normalizeName(item.artistName)}|${normalizeName(item.title)}`;

            if (seen.has(key)) {
                continue;
            }

            seen.add(key);
            merged.push(item);
        }
    }

    return merged;
}

/**
 * Highest scoring first, one entry per id, capped.
 *
 * A batched similarity call returns around 100 entries per seed in no particular order, and
 * seeds overlap: two seeds produced 200 entries of which 10 were the same artist twice. The raw
 * response is therefore neither ranked nor unique.
 */
export function rankSimilar<T extends { score: number }>(
    entries: T[],
    idOf: (entry: T) => string,
    limit = 20,
): T[] {
    const best = new Map<string, T>();

    for (const entry of entries) {
        const existing = best.get(idOf(entry));

        if (!existing || entry.score > existing.score) {
            best.set(idOf(entry), entry);
        }
    }

    return [...best.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * Order fresh releases newest first, but only among records that are actually out.
 *
 * `release_date` is a scheduled date, so it can be in the future, and a plain descending sort
 * therefore leads with records nobody can hear yet. On the global feed that was most of the
 * row: twelve of the twenty visible cards were unreleased, and the month's actual releases
 * sat below the cut. Released records lead, newest first; the upcoming ones follow, soonest
 * first, which is the order they become interesting in.
 */
export function sortByReleaseDate(releases: LbFreshRelease[], limit = 20): LbFreshRelease[] {
    const today = new Date().toISOString().slice(0, 10);
    const out: LbFreshRelease[] = [];
    const upcoming: LbFreshRelease[] = [];

    for (const release of releases) {
        (release.release_date > today ? upcoming : out).push(release);
    }

    out.sort((a, b) => b.release_date.localeCompare(a.release_date));
    upcoming.sort((a, b) => a.release_date.localeCompare(b.release_date));

    return [...out, ...upcoming].slice(0, limit);
}

/** Most ListenBrainz id fields are nullable, and an id list should carry only real ids. */
function compact(values: (null | string | undefined)[]): string[] {
    return values.filter((value): value is string => Boolean(value));
}

/** Tells a real MusicBrainz id from the synthesised keys the adapters fall back to. */
function isMbid(value: null | string | undefined): value is string {
    return typeof value === 'string' && UUID_PATTERN.test(value);
}
