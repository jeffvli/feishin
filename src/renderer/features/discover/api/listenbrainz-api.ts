import { queryOptions } from '@tanstack/react-query';

import {
    LbArtistStat,
    LbFreshRelease,
    LbPlaylistSummary,
    LbPlaylistTrack,
    LbRecommendation,
    LbRecordingMetadata,
    LbRecordingStat,
    LbReleaseStat,
} from '/@/renderer/features/discover/api/listenbrainz-types';

const LB_API = 'https://api.listenbrainz.org/1';

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

/** Shared cache policy. ListenBrainz recomputes these daily at best, so cache hard. */
const CACHE = {
    gcTime: 1000 * 60 * 60 * 24,
    retry: 1,
    staleTime: 1000 * 60 * 60,
};

export const discoverKeys = {
    all: (username: string) => ['listenbrainz', username] as const,
    freshReleases: (username: string) => ['listenbrainz', username, 'fresh-releases'] as const,
    playlist: (mbid: string) => ['listenbrainz', 'playlist', mbid] as const,
    playlistsCreatedFor: (username: string) => ['listenbrainz', username, 'created-for'] as const,
    recommendations: (username: string) => ['listenbrainz', username, 'recommendations'] as const,
    // Range and count belong in the key: the fresh-release seed and the visible "top artists"
    // row ask for wildly different slices, and a shared key would let them clobber each other.
    topArtists: (username: string, range: string, count: number) =>
        ['listenbrainz', username, 'top-artists', range, count] as const,
    topRecordings: (username: string, range: string, count: number) =>
        ['listenbrainz', username, 'top-recordings', range, count] as const,
    topReleases: (username: string, range: string, count: number) =>
        ['listenbrainz', username, 'top-releases', range, count] as const,
};

export const listenbrainzQueries = {
    /**
     * The global fresh-release feed. Note this is ~8,000 releases and several megabytes;
     * `username` does not filter it server side, so callers must narrow it themselves.
     */
    freshReleases: (username: string, days = 30) =>
        queryOptions({
            ...CACHE,
            queryFn: ({ signal }) =>
                lbFetch<{ payload: { releases: LbFreshRelease[] } }>(
                    `/explore/fresh-releases/?username=${encodeURIComponent(username)}&days=${days}`,
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

    topReleases: (username: string, range = 'month', count = 20) =>
        queryOptions({
            ...CACHE,
            queryFn: ({ signal }) =>
                lbFetch<{ payload: { releases: LbReleaseStat[] } }>(
                    `/stats/user/${encodeURIComponent(username)}/releases?range=${range}&count=${count}`,
                    signal,
                ).then((response) => response.payload.releases),
            queryKey: discoverKeys.topReleases(username, range, count),
        }),
};
