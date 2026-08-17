import { queryOptions } from '@tanstack/react-query';

import {
    LbArtistMetadataEntry,
    LbArtistStat,
    LbFreshRelease,
    LbPlaylistSummary,
    LbPlaylistTrack,
    LbRecommendation,
    LbRecordingMetadata,
    LbRecordingStat,
    LbSimilarArtist,
    LbSimilarRecording,
    LbSimilarUser,
} from '/@/renderer/features/discover/api/listenbrainz-types';
import { hasExcludedGenre } from '/@/renderer/features/discover/utils/genre-filter';
import { logger } from '/@/renderer/utils/logger';

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
 * The genre each of these artists is best known for, keyed by MBID.
 *
 * What an artist card says underneath the name. The similarity endpoint carries only a
 * disambiguation comment, which is absent for most artists and, when present, says "American
 * rock band" on a row of American rock bands. A genre is the thing a reader scanning a row of
 * unfamiliar names actually needs.
 *
 * Highest tag count wins, and only curated genres are considered, so this reads "post-grunge"
 * rather than whatever an editor typed. Artists with no genre are simply absent.
 */
export async function fetchArtistGenres(
    artistMbids: string[],
    signal?: AbortSignal,
): Promise<Array<[string, string]>> {
    if (artistMbids.length === 0) {
        return [];
    }

    const batches: string[][] = [];
    for (let index = 0; index < artistMbids.length; index += METADATA_BATCH_SIZE) {
        batches.push(artistMbids.slice(index, index + METADATA_BATCH_SIZE));
    }

    const entries: LbArtistMetadataEntry[] = [];

    for (const batch of batches) {
        try {
            const result = await lbFetch<LbArtistMetadataEntry[]>(
                `/metadata/artist/?artist_mbids=${batch.join(',')}&inc=tag`,
                signal,
            );

            entries.push(...(result ?? []));
        } catch (error) {
            logger.warn(`Discover artist metadata batch failed: ${String(error)}`);
        }
    }

    const pairs: Array<[string, string]> = [];

    for (const entry of entries) {
        const genres = (entry.tag?.artist ?? []).filter((tag) => tag.genre_mbid);
        const best = genres.sort((a, b) => b.count - a.count)[0];

        if (best) {
            pairs.push([entry.artist_mbid, best.tag]);
        }
    }

    return pairs;
}

/**
 * Recording metadata in batches, keyed by MBID.
 *
 * `inc=artist` is what makes `url_rels` available, and those carry the Apple Music and Deezer
 * track links that let a preview be resolved exactly instead of by text search. `inc=tag` adds
 * the genres, which cost nothing here and are what `hasExcludedGenre` reads.
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

    // One batch at a time rather than all at once. Twenty-five ids is one request, and firing
    // eight of them together is most of a ten second allowance spent in a single burst while
    // the history walk is spending the same allowance.
    const merged: LbRecordingMetadata = {};

    for (const batch of batches) {
        try {
            const result = await lbFetch<LbRecordingMetadata>(
                `/metadata/recording/?recording_mbids=${batch.join(',')}&inc=artist+release+tag`,
                signal,
            );

            Object.assign(merged, result ?? {});
        } catch (error) {
            // Logged rather than swallowed. Callers treat a missing entry as "no genre", which
            // silently turns the children's-music filter into a filter that passes everything.
            logger.warn(`Discover recording metadata batch failed: ${String(error)}`);
        }
    }

    return merged;
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
async function lbFetch<T>(path: string, signal?: AbortSignal): Promise<T | undefined> {
    let response = await fetch(`${LB_API}${path}`, { signal });

    /*
     * The allowance is thirty requests per ten seconds, per address, shared by everything here.
     *
     * That is easy to exhaust: the history walk spends it continuously while it backfills, and
     * this page then asks for metadata in batches alongside it. The service says exactly how
     * long to wait, so waiting is both cheap and correct, where failing means a caller quietly
     * gets an empty answer and a filter it depends on stops filtering.
     */
    for (let attempt = 0; response.status === 429 && attempt < RATE_LIMIT_RETRIES; attempt += 1) {
        const resetIn = Number(response.headers.get('x-ratelimit-reset-in') ?? 1);

        await new Promise((resolve) => setTimeout(resolve, resetIn * 1000 + 250));

        response = await fetch(`${LB_API}${path}`, { signal });
    }

    if (!response.ok) {
        throw new Error(`ListenBrainz ${response.status} for ${path}`);
    }

    // "No data for this user and range" is answered with 204 and an empty body rather than an
    // empty payload, and `response.json()` throws on that. Observed on `range=year`, which is
    // a valid range that simply has no precomputed stats, and on peers who have not listened
    // recently. Treated as a real answer, because an exception here fails the whole row.
    if (response.status === 204) {
        return undefined;
    }

    return response.json() as Promise<T>;
}

const METADATA_BATCH_SIZE = 25;

/**
 * How many times to wait out a rate limit before giving up on a request.
 *
 * The allowance refills every ten seconds, so two waits covers any burst this page creates.
 */
const RATE_LIMIT_RETRIES = 2;

/**
 * How many collaborative-filter recommendations to ask for.
 *
 * The endpoint holds 1,000 and defaulted to 20 here, which was set before anything filtered
 * the results. Owned and already-heard tracks are now both removed, and they remove most of a
 * small sample, so the request has to be large enough that the survivors still fill a row.
 * Each one costs a slot in the batched metadata lookup rather than a request of its own.
 */
const RECOMMENDATION_COUNT = 200;

/**
 * How deep to read into each similar listener.
 *
 * Eight peers at a hundred tracks yielded 336 tracks by artists absent from the user's
 * all-time top thousand, against 45 unowned suggestions from every other source combined.
 * How many peers is the caller's decision; each one is a request.
 */
const PEER_RANGE = 'month';

const PEER_TRACK_COUNT = 100;

/**
 * Retry policy, shared by every source. The freshness policies are separate, below.
 *
 * The retries are for the server rather than for the network. ListenBrainz sheds load by
 * answering 502 or closing the connection outright, and it recovers within seconds, so giving
 * up after one attempt turns a brief wobble into an empty page for the whole cache window.
 */
const RETRY = {
    retry: 3,
    retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 8000),
};

const HOUR = 1000 * 60 * 60;

/**
 * How long each kind of source stays fresh.
 *
 * Matched to how often the data upstream actually changes, rather than shared. A single
 * one-hour policy was wrong in both directions at once: it refetched playlists that are
 * regenerated once a week, and it refetched a similarity model that does not move between
 * releases, while a page the user opens twice in an evening should not be re-fetching
 * anything at all.
 *
 * The user-visible consequence is that Discover changes on a schedule rather than on every
 * visit. A page that reshuffles each time it opens cannot be returned to: an album noticed in
 * the morning is gone by the afternoon, and nothing can be deliberately come back to.
 */
const CACHE = {
    /**
     * A generated playlist, fresh until ListenBrainz next regenerates it.
     *
     * Jams and Exploration are rebuilt weekly, so this expires at the coming Monday rather
     * than after a fixed span: a fixed week from first fetch would drift off the boundary and
     * spend most of its life holding the previous week's playlist.
     */
    get playlist() {
        return { ...RETRY, gcTime: HOUR * 24 * 14, staleTime: msUntilNextMonday() };
    },
    /** New records appear daily, and this is the row most worth being current. */
    releases: { ...RETRY, gcTime: HOUR * 24 * 7, staleTime: HOUR * 12 },
    /**
     * A trained similarity model. It changes between ListenBrainz releases, not between days,
     * so refetching it daily buys an identical answer.
     */
    similarity: { ...RETRY, gcTime: HOUR * 24 * 14, staleTime: HOUR * 24 * 7 },
    /** Rolling windows over listens, which move continuously but slowly. */
    stats: { ...RETRY, gcTime: HOUR * 24 * 3, staleTime: HOUR * 12 },
    /** Recomputed on the service's own schedule, which is days rather than hours. */
    suggestions: { ...RETRY, gcTime: HOUR * 24 * 7, staleTime: HOUR * 24 },
};

/**
 * Milliseconds until the next Monday 00:00 local time, floored at an hour.
 *
 * Local rather than UTC because the point is that the user finds a new playlist waiting at the
 * start of their week, not at a moment that lands mid-Sunday-evening for half the world. The
 * floor keeps a fetch made just before the boundary from being stale on arrival.
 */
function msUntilNextMonday(): number {
    const now = new Date();
    const monday = new Date(now);

    monday.setHours(0, 0, 0, 0);
    monday.setDate(monday.getDate() + ((8 - monday.getDay()) % 7 || 7));

    return Math.max(HOUR, monday.getTime() - now.getTime());
}

export const discoverKeys = {
    all: (username: string) => ['listenbrainz', username] as const,
    artistGenres: (artistMbids: string[]) =>
        ['listenbrainz', 'artist-genres', artistMbids] as const,
    excludedRecordings: (recordingMbids: string[]) =>
        ['listenbrainz', 'excluded-recordings', recordingMbids] as const,
    freshReleases: (username: string) => ['listenbrainz', username, 'fresh-releases'] as const,
    playlist: (mbid: string) => ['listenbrainz', 'playlist', mbid] as const,
    playlistsCreatedFor: (username: string) => ['listenbrainz', username, 'created-for'] as const,
    recommendations: (username: string, count: number) =>
        ['listenbrainz', username, 'recommendations', count] as const,
    similarArtists: (seedMbids: string[]) =>
        ['listenbrainz', 'similar-artists', seedMbids] as const,
    similarListeners: (userNames: string[]) =>
        ['listenbrainz', 'similar-listeners', userNames] as const,
    similarRecordings: (seedMbids: string[]) =>
        ['listenbrainz', 'similar-recordings', seedMbids] as const,
    similarUsers: (username: string) => ['listenbrainz', username, 'similar-users'] as const,
    // Every parameter that changes the response belongs in the key. Omitting one does not
    // merely risk two callers clobbering each other: a cached result outlives a change to the
    // default, so raising a count silently kept serving the old, smaller response for a day.
    topArtists: (username: string, range: string, count: number) =>
        ['listenbrainz', username, 'top-artists', range, count] as const,
    topRecordings: (username: string, range: string, count: number) =>
        ['listenbrainz', username, 'top-recordings', range, count] as const,
};

export const listenbrainzQueries = {
    /**
     * Artists similar to the given seeds. Despite `limit_50` in the algorithm name, one seed
     * returns around 100 artists, and seeds overlap, so callers should dedupe and slice.
     */
    /**
     * The genre to print under each artist card. Cached as long as the similarity model, since
     * an artist's genre is a property of the artist rather than of the listener.
     */
    artistGenres: (artistMbids: string[]) =>
        queryOptions({
            ...CACHE.similarity,
            enabled: artistMbids.length > 0,
            queryFn: ({ signal }) => fetchArtistGenres(artistMbids, signal),
            queryKey: discoverKeys.artistGenres(artistMbids),
        }),

    /**
     * Which of these recordings fall in a category that is never a recommendation.
     *
     * Separate from `recommendationMetadata` because that one is keyed on the collaborative
     * filtering mbids and these come from peer statistics, but it is the same endpoint and the
     * same batching, so the answer is cached on the same terms. Genres are a property of the
     * record rather than of the listener, so this is cached as long as the similarity model.
     */
    excludedRecordings: (recordingMbids: string[]) =>
        queryOptions({
            ...CACHE.similarity,
            enabled: recordingMbids.length > 0,
            queryFn: ({ signal }) =>
                fetchRecordingMetadata(recordingMbids, signal).then((metadata) =>
                    Object.entries(metadata)
                        .filter(([, entry]) => hasExcludedGenre(entry))
                        .map(([mbid]) => mbid),
                ),
            queryKey: discoverKeys.excludedRecordings(recordingMbids),
        }),

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
            ...CACHE.releases,
            queryFn: ({ signal }) =>
                lbFetch<{ payload: { releases: LbFreshRelease[] } }>(
                    `/user/${encodeURIComponent(username)}/fresh_releases?days=${days}`,
                    signal,
                ).then((response) => response?.payload.releases ?? []),
            queryKey: discoverKeys.freshReleases(username),
        }),

    playlist: (playlistMbid: null | string) =>
        queryOptions({
            ...CACHE.playlist,
            enabled: Boolean(playlistMbid),
            queryFn: ({ signal }) =>
                lbFetch<{ playlist: { track: LbPlaylistTrack[] } }>(
                    `/playlist/${playlistMbid}`,
                    signal,
                ).then((response) => response?.playlist.track ?? []),
            queryKey: discoverKeys.playlist(playlistMbid ?? 'none'),
        }),

    /** Weekly Jams and Weekly Exploration arrive here as generated playlists. */
    playlistsCreatedFor: (username: string) =>
        queryOptions({
            ...CACHE.playlist,
            queryFn: ({ signal }) =>
                lbFetch<{ playlists: LbPlaylistSummary[] }>(
                    `/user/${encodeURIComponent(username)}/playlists/createdfor`,
                    signal,
                ).then((response) => response?.playlists ?? []),
            queryKey: discoverKeys.playlistsCreatedFor(username),
        }),

    /** Collaborative-filter picks. Returns bare MBIDs; hydrate with fetchRecordingMetadata. */
    recommendations: (username: string, count = RECOMMENDATION_COUNT) =>
        queryOptions({
            ...CACHE.suggestions,
            queryFn: ({ signal }) =>
                lbFetch<{ payload: { mbids: LbRecommendation[] } }>(
                    `/cf/recommendation/user/${encodeURIComponent(username)}/recording?count=${count}`,
                    signal,
                ).then((response) => response?.payload.mbids ?? []),
            queryKey: discoverKeys.recommendations(username, count),
        }),

    similarArtists: (seedMbids: string[]) =>
        queryOptions({
            ...CACHE.similarity,
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

    /**
     * What listeners with comparable taste have been playing, one list per listener.
     *
     * The only source here that is not computed from the user's own history, and the reason
     * the page has anything genuinely unfamiliar on it. Everything else, recommendations
     * included, is derived from what the user already plays, so it converges on records they
     * own or have heard: measured on a real account, 86% of those suggestions were already in
     * the library. Peers share the taste without sharing the collection.
     *
     * Kept as one array per peer rather than pooled, because the round-robin merge downstream
     * then interleaves them. Pooling let a single peer's run of children's lullabies take the
     * whole row.
     */
    similarListeners: (userNames: string[]) =>
        queryOptions({
            ...CACHE.stats,
            enabled: userNames.length > 0,
            queryFn: ({ signal }) =>
                Promise.all(
                    userNames.map((name) =>
                        lbFetch<{ payload: { recordings: LbRecordingStat[] } }>(
                            `/stats/user/${encodeURIComponent(name)}/recordings?range=${PEER_RANGE}&count=${PEER_TRACK_COUNT}`,
                            signal,
                        )
                            .then((response) => response?.payload.recordings ?? [])
                            // One quiet peer must not cost the row. They answer 204 when they
                            // have no stats for the range, and 404 if the account has gone.
                            .catch(() => [] as LbRecordingStat[]),
                    ),
                ),
            queryKey: discoverKeys.similarListeners(userNames),
        }),

    /** Recordings similar to the given seeds. Carries artist name and cover art already. */
    similarRecordings: (seedMbids: string[]) =>
        queryOptions({
            ...CACHE.similarity,
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

    /** Listeners ranked by how close their taste is. Ordering is not guaranteed, so sort. */
    similarUsers: (username: string) =>
        queryOptions({
            ...CACHE.similarity,
            queryFn: ({ signal }) =>
                lbFetch<{ payload: LbSimilarUser[] }>(
                    `/user/${encodeURIComponent(username)}/similar-users`,
                    signal,
                ).then((response) =>
                    [...(response?.payload ?? [])].sort((a, b) => b.similarity - a.similarity),
                ),
            queryKey: discoverKeys.similarUsers(username),
        }),

    topArtists: (username: string, range = 'month', count = 20) =>
        queryOptions({
            ...CACHE.stats,
            queryFn: ({ signal }) =>
                lbFetch<{ payload: { artists: LbArtistStat[] } }>(
                    `/stats/user/${encodeURIComponent(username)}/artists?range=${range}&count=${count}`,
                    signal,
                ).then((response) => response?.payload.artists ?? []),
            queryKey: discoverKeys.topArtists(username, range, count),
        }),

    topRecordings: (username: string, range = 'month', count = 20) =>
        queryOptions({
            ...CACHE.stats,
            queryFn: ({ signal }) =>
                lbFetch<{ payload: { recordings: LbRecordingStat[] } }>(
                    `/stats/user/${encodeURIComponent(username)}/recordings?range=${range}&count=${count}`,
                    signal,
                ).then((response) => response?.payload.recordings ?? []),
            queryKey: discoverKeys.topRecordings(username, range, count),
        }),
};
