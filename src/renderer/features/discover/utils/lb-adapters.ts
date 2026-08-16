import {
    LbArtistStat,
    LbFreshRelease,
    LbPlaylistTrack,
    LbRecordingMetadata,
    LbRecordingStat,
    LbReleaseStat,
    LbUrlRel,
} from '/@/renderer/features/discover/api/listenbrainz-types';

/**
 * A ListenBrainz item flattened into the shape a card needs.
 *
 * Deliberately not one of the `domain-types` entities: those describe things that exist on
 * the user's own server and carry `_serverId` and roughly forty other required fields. A
 * Discover item has no server, no library id, and may not be ownable at all.
 */
export interface DiscoverItem {
    artistName: string;
    /** Stable React key. Not a library id and never navigable. */
    id: string;
    imageUrl: null | string;
    /** Present when the item is a track. Enables exact preview resolution. */
    recordingMbid: null | string;
    /** Album name for tracks, or the release date for releases. Rendered as the second row. */
    subtitle: null | string;
    title: string;
    /** Direct Apple Music / Deezer track links, when ListenBrainz knows them. */
    urlRels: LbUrlRel[];
}

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

/**
 * Narrow the global fresh-release feed to artists the user actually listens to.
 *
 * The `username` parameter on `/explore/fresh-releases` is documented as personalising the
 * response but was observed returning `listen_count: 0` on all ~8,000 entries, so the
 * filtering has to happen here. Top artists are already fetched for their own carousel.
 */
export function filterFreshReleasesByArtists(
    releases: LbFreshRelease[],
    topArtists: LbArtistStat[],
    limit = 20,
): LbFreshRelease[] {
    const wanted = new Set(
        topArtists.map((artist) => artist.artist_mbid).filter((mbid): mbid is string => !!mbid),
    );

    if (wanted.size === 0) {
        return [];
    }

    return releases
        .filter((release) => release.artist_mbids.some((mbid) => wanted.has(mbid)))
        .sort((a, b) => b.release_date.localeCompare(a.release_date))
        .slice(0, limit);
}

export function fromArtistStat(stat: LbArtistStat): DiscoverItem {
    return {
        artistName: stat.artist_name,
        id: stat.artist_mbid ?? `artist-${stat.artist_name}`,
        // MusicBrainz has no canonical artist image, so artist cards fall back to a placeholder.
        imageUrl: null,
        recordingMbid: null,
        subtitle: null,
        title: stat.artist_name,
        urlRels: [],
    };
}

export function fromFreshRelease(release: LbFreshRelease): DiscoverItem {
    return {
        artistName: release.artist_credit_name,
        id: release.release_mbid,
        imageUrl:
            coverArtUrl(release.caa_release_mbid, release.caa_id) ??
            releaseGroupArtUrl(release.release_group_mbid),
        recordingMbid: null,
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
        artistName: track.creator,
        id: recordingMbid ?? `${track.creator}-${track.title}`,
        imageUrl: coverArtUrl(metadata?.caa_release_mbid, metadata?.caa_id),
        recordingMbid,
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
        artistName: entry.artist?.name ?? '',
        id: recordingMbid,
        imageUrl:
            coverArtUrl(entry.release?.caa_release_mbid, entry.release?.caa_id) ??
            releaseGroupArtUrl(entry.release?.release_group_mbid),
        recordingMbid,
        subtitle: entry.release?.name ?? null,
        title: entry.recording.name,
        urlRels: entry.recording.url_rels ?? [],
    };
}

export function fromRecordingStat(stat: LbRecordingStat): DiscoverItem {
    return {
        artistName: stat.artist_name,
        id: stat.recording_mbid ?? `${stat.artist_name}-${stat.track_name}`,
        imageUrl: coverArtUrl(stat.caa_release_mbid, stat.caa_id),
        recordingMbid: stat.recording_mbid,
        subtitle: stat.release_name,
        title: stat.track_name,
        urlRels: [],
    };
}

export function fromReleaseStat(stat: LbReleaseStat): DiscoverItem {
    return {
        artistName: stat.artist_name,
        id: stat.release_mbid ?? `${stat.artist_name}-${stat.release_name}`,
        imageUrl: coverArtUrl(stat.caa_release_mbid, stat.caa_id),
        recordingMbid: null,
        subtitle: stat.release_name,
        title: stat.release_name,
        urlRels: [],
    };
}
