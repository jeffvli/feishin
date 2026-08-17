import { queryOptions } from '@tanstack/react-query';

import {
    LbArtistStat,
    LbFreshRelease,
    LbPlaylistSummary,
    LbPlaylistTrack,
    LbRecommendation,
    LbRecordingMetadata,
    LbRecordingStat,
    LbSimilarArtist,
    LbSimilarRecording,
} from '/@/renderer/features/discover/api/listenbrainz-types';

const LB_API = 'https://api.listenbrainz.org/1';

/**
 * The similarity endpoints live on a separate host from the rest of the API.
 *
 * Its CORS preflight allows only `CONTENT-TYPE` as a request header, where the main API also
 * allows `Authorization`. Nothing here may send one, which is fine because none is needed.
 */
const LB_LABS_API = 'https://labs.api.listenbrainz.org';

/**
 * `algorithm` is required on both similarity endpoints and each validates against its own enum,
 * so these two strings are not interchangeable: the recordings value is a 400 on artists.
 */
const SIMILAR_ARTISTS_ALGORITHM =
    'session_based_days_9000_session_300_contribution_5_threshold_15_limit_50_skip_30';

const SIMILAR_RECORDINGS_ALGORITHM =
    'session_based_days_7500_session_300_contribution_5_threshold_15_limit_50_skip_30';

/**
 * Recording metadata in batches, keyed by MBID.
 *
 * `inc=artist+release` is what makes `url_rels` available, and those carry the Apple Music
 * and Deezer track links that let a preview be resolved exactly instead of by text search.
 */
export async function fetchRecordingMetadata(
    recordingMbids: string[],
    signal?: AbortSignal,
): Promise<LbRecordingMetadata> {
    if (recordingMbids.length === 0) {
        return {};
    }

    // The endpoint rejects oversized query strings, so batch rather than sending 50 MBIDs.
    const batches: string[][] = [];
    for (let index = 0; index < recordingMbids.length; index += METADATA_BATCH_SIZE) {
        batches.push(recordingMbids.slice(index, index + METADATA_BATCH_SIZE));
    }

    const results = await Promise.all(
        batches.map((batch) =>
            lbFetch<LbRecordingMetadata>(
                `/metadata/recording/?recording_mbids=${batch.join(',')}&inc=artist+release`,
                signal,
            ).catch(() => ({}) as LbRecordingMetadata),
        ),
    );

    return Object.assign({}, ...results) as LbRecordingMetadata;
}

/**
 * Seeds are sent as a repeated query parameter rather than a comma-separated list, which the
 * endpoint rejects as an invalid UUID. One batched call covers every seed.
 */
async function labsFetch<T>(
    path: string,
    parameter: string,
    mbids: string[],
    algorithm: string,
    signal?: AbortSignal,
): Promise<T[]> {
    const params = new URLSearchParams();

    for (const mbid of mbids) {
        params.append(parameter, mbid);
    }

    params.set('algorithm', algorithm);

    const response = await fetch(`${LB_LABS_API}${path}?${params.toString()}`, { signal });

    if (!response.ok) {
        throw new Error(`ListenBrainz labs ${response.status} for ${path}`);
    }

    return response.json() as Promise<T[]>;
}

/**
 * ListenBrainz sends `access-control-allow-origin: *`, so this runs in the renderer on both
 * the Electron and the web build. Nothing here may move to the main process: the Docker
 * image is static nginx and has no main process to move it to.
 */
async function lbFetch<T>(path: string, signal?: AbortSignal): Promise<T> {
    const response = await fetch(`${LB_API}${path}`, { signal });

    if (!response.ok) {
        throw new Error(`ListenBrainz ${response.status} for ${path}`);
    }

    return response.json() as Promise<T>;
}

const METADATA_BATCH_SIZE = 25;

/**
 * Shared cache and retry policy. ListenBrainz recomputes these daily at best, so cache hard.
 *
 * The retries are for the server rather than for the network. ListenBrainz sheds load by
 * answering 502 or closing the connection outright, and it recovers within seconds, so giving
 * up after one attempt turns a brief wobble into an empty page for the whole cache window.
 */
const CACHE = {
    gcTime: 1000 * 60 * 60 * 24,
    retry: 3,
    retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 8000),
    staleTime: 1000 * 60 * 60,
};

export const discoverKeys = {
    all: (username: string) => ['listenbrainz', username] as const,
    freshReleases: (username: string) => ['listenbrainz', username, 'fresh-releases'] as const,
    playlist: (mbid: string) => ['listenbrainz', 'playlist', mbid] as const,
    playlistsCreatedFor: (username: string) => ['listenbrainz', username, 'created-for'] as const,
    recommendations: (username: string) => ['listenbrainz', username, 'recommendations'] as const,
    similarArtists: (seedMbids: string[]) =>
        ['listenbrainz', 'similar-artists', seedMbids] as const,
    similarRecordings: (seedMbids: string[]) =>
        ['listenbrainz', 'similar-recordings', seedMbids] as const,
    // Range and count belong in the key, because a shared key would let two callers asking
    // for different slices of the same stat clobber each other.
    topArtists: (username: string, range: string, count: number) =>
        ['listenbrainz', username, 'top-artists', range, count] as const,
    topRecordings: (username: string, range: string, count: number) =>
        ['listenbrainz', username, 'top-recordings', range, count] as const,
};

export const listenbrainzQueries = {
    /**
     * New records from artists the user listens to, scored and narrowed server side.
     *
     * Not `/explore/fresh-releases/`, which despite taking a `username` returns the same
     * ~7,400 releases to everyone. Narrowing that client side worked, but only against a
     * second request for the user's top 1,000 artists, and it could not see past that cutoff:
     * an artist ranked 1,001st had their new record silently dropped. This endpoint scores the
     * same question server side and answers in tens of releases rather than megabytes.
     *
     * `days` is capped at 90; anything larger is a 400. `confidence` is how strongly the
     * release ties to the user's listening, and is the only field the global feed lacks.
     */
    freshReleases: (username: string, days = 90) =>
        queryOptions({
            ...CACHE,
            queryFn: ({ signal }) =>
                lbFetch<{ payload: { releases: LbFreshRelease[] } }>(
                    `/user/${encodeURIComponent(username)}/fresh_releases?days=${days}`,
                    signal,
                ).then((response) => response.payload.releases),
            queryKey: discoverKeys.freshReleases(username),
        }),

    playlist: (playlistMbid: null | string) =>
        queryOptions({
            ...CACHE,
            enabled: Boolean(playlistMbid),
            queryFn: ({ signal }) =>
                lbFetch<{ playlist: { track: LbPlaylistTrack[] } }>(
                    `/playlist/${playlistMbid}`,
                    signal,
                ).then((response) => response.playlist.track),
            queryKey: discoverKeys.playlist(playlistMbid ?? 'none'),
        }),

    /** Weekly Jams and Weekly Exploration arrive here as generated playlists. */
    playlistsCreatedFor: (username: string) =>
        queryOptions({
            ...CACHE,
            queryFn: ({ signal }) =>
                lbFetch<{ playlists: LbPlaylistSummary[] }>(
                    `/user/${encodeURIComponent(username)}/playlists/createdfor`,
                    signal,
                ).then((response) => response.playlists),
            queryKey: discoverKeys.playlistsCreatedFor(username),
        }),

    /** Collaborative-filter picks. Returns bare MBIDs; hydrate with fetchRecordingMetadata. */
    recommendations: (username: string, count = 20) =>
        queryOptions({
            ...CACHE,
            queryFn: ({ signal }) =>
                lbFetch<{ payload: { mbids: LbRecommendation[] } }>(
                    `/cf/recommendation/user/${encodeURIComponent(username)}/recording?count=${count}`,
                    signal,
                ).then((response) => response.payload.mbids),
            queryKey: discoverKeys.recommendations(username),
        }),

    /**
     * Artists similar to the given seeds. Despite `limit_50` in the algorithm name, one seed
     * returns around 100 artists, and seeds overlap, so callers should dedupe and slice.
     */
    similarArtists: (seedMbids: string[]) =>
        queryOptions({
            ...CACHE,
            enabled: seedMbids.length > 0,
            queryFn: ({ signal }) =>
                labsFetch<LbSimilarArtist>(
                    '/similar-artists/json',
                    'artist_mbids',
                    seedMbids,
                    SIMILAR_ARTISTS_ALGORITHM,
                    signal,
                ),
            queryKey: discoverKeys.similarArtists(seedMbids),
        }),

    /** Recordings similar to the given seeds. Carries artist name and cover art already. */
    similarRecordings: (seedMbids: string[]) =>
        queryOptions({
            ...CACHE,
            enabled: seedMbids.length > 0,
            queryFn: ({ signal }) =>
                labsFetch<LbSimilarRecording>(
                    '/similar-recordings/json',
                    'recording_mbids',
                    seedMbids,
                    SIMILAR_RECORDINGS_ALGORITHM,
                    signal,
                ),
            queryKey: discoverKeys.similarRecordings(seedMbids),
        }),

    topArtists: (username: string, range = 'month', count = 20) =>
        queryOptions({
            ...CACHE,
            queryFn: ({ signal }) =>
                lbFetch<{ payload: { artists: LbArtistStat[] } }>(
                    `/stats/user/${encodeURIComponent(username)}/artists?range=${range}&count=${count}`,
                    signal,
                ).then((response) => response.payload.artists),
            queryKey: discoverKeys.topArtists(username, range, count),
        }),

    topRecordings: (username: string, range = 'month', count = 20) =>
        queryOptions({
            ...CACHE,
            queryFn: ({ signal }) =>
                lbFetch<{ payload: { recordings: LbRecordingStat[] } }>(
                    `/stats/user/${encodeURIComponent(username)}/recordings?range=${range}&count=${count}`,
                    signal,
                ).then((response) => response.payload.recordings),
            queryKey: discoverKeys.topRecordings(username, range, count),
        }),
};
