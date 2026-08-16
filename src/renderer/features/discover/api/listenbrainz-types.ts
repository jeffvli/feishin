/**
 * Payload shapes for the ListenBrainz JSON API (https://listenbrainz.readthedocs.io).
 *
 * Only the fields Discover actually reads are declared. ListenBrainz returns a good deal
 * more, and adding fields here is cheap, but every field below was observed on a live
 * response rather than taken from the documentation.
 */

/** An entry in `payload.artists` of `/1/stats/user/{user}/artists`. */
export interface LbArtistStat {
    /** Null for artists MusicBrainz cannot resolve, which is common for local files. */
    artist_mbid: null | string;
    artist_name: string;
    listen_count: number;
}

/** The `artists` sub-array carried by release, recording and playlist payloads. */
export interface LbCreditedArtist {
    artist_credit_name: string;
    artist_mbid: string;
    join_phrase: string;
}

/** An entry in `payload.releases` of `/1/explore/fresh-releases`. */
export interface LbFreshRelease {
    artist_credit_name: string;
    artist_mbids: string[];
    caa_id: null | number;
    caa_release_mbid: null | string;
    /**
     * Documented as the caller's own listen count, but observed to be 0 on every entry
     * even when `username` is supplied. Do not rely on it for personalisation.
     */
    listen_count: number;
    release_date: string;
    release_group_mbid: string;
    release_group_primary_type: null | string;
    release_mbid: string;
    release_name: string;
}

/** A playlist summary from `/1/user/{user}/playlists/createdfor`. */
export interface LbPlaylistSummary {
    playlist: {
        /** A `https://listenbrainz.org/playlist/{mbid}` URL. */
        identifier: string;
        title: string;
    };
}

/** A JSPF track from `/1/playlist/{mbid}`. */
export interface LbPlaylistTrack {
    album?: string;
    /** The artist credit. JSPF calls this `creator`. */
    creator: string;
    duration?: number;
    extension?: {
        'https://musicbrainz.org/doc/jspf#track'?: {
            additional_metadata?: {
                artists?: LbCreditedArtist[];
                caa_id?: null | number;
                caa_release_mbid?: null | string;
            };
            artist_identifiers?: string[];
        };
    };
    /** MusicBrainz recording URLs. The MBID is the last path segment. */
    identifier: string | string[];
    title: string;
}

/** An entry in `payload.mbids` of `/1/cf/recommendation/user/{user}/recording`. */
export interface LbRecommendation {
    latest_listened_at: null | string;
    recording_mbid: string;
    score: number;
}

/** Response of `/1/metadata/recording`, keyed by recording MBID. */
export type LbRecordingMetadata = Record<string, LbRecordingMetadataEntry>;

export interface LbRecordingMetadataEntry {
    artist?: {
        artists?: Array<{ artist_mbid: string; name: string }>;
        name: string;
    };
    recording?: {
        length?: number;
        name: string;
        /** Present only when `inc=artist` was requested. Carries the Apple/Deezer links. */
        url_rels?: LbUrlRel[];
    };
    release?: {
        caa_id?: null | number;
        caa_release_mbid?: null | string;
        mbid?: string;
        name?: string;
        release_group_mbid?: string;
    };
}

/** An entry in `payload.recordings` of `/1/stats/user/{user}/recordings`. */
export interface LbRecordingStat {
    artist_mbids?: string[];
    artist_name: string;
    caa_id: null | number;
    caa_release_mbid: null | string;
    listen_count: number;
    recording_mbid: null | string;
    release_mbid: null | string;
    release_name: null | string;
    track_name: string;
}

/** An entry in `payload.releases` of `/1/stats/user/{user}/releases`. */
export interface LbReleaseStat {
    artist_mbids?: string[];
    artist_name: string;
    artists?: LbCreditedArtist[];
    caa_id: null | number;
    caa_release_mbid: null | string;
    listen_count: number;
    release_mbid: null | string;
    release_name: string;
}

/** A relationship URL attached to a recording, e.g. an Apple Music or Deezer track page. */
export interface LbUrlRel {
    type: string;
    url: string;
}
