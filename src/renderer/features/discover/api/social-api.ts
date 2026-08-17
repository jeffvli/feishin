import { queryOptions } from '@tanstack/react-query';

import { LbUrlRel } from '/@/renderer/features/discover/api/listenbrainz-types';

const LB_API = 'https://api.listenbrainz.org/1';

const HOUR = 1000 * 60 * 60;

/**
 * One retry, matching the rest of Discover. A social row that cannot load is a missing section,
 * not a broken page, so it is not worth hammering the service for.
 */
const RETRY = { retry: 1 } as const;

/**
 * Who a listener follows, and what those people have been playing.
 *
 * ListenBrainz models this as a follow graph rather than mutual friendship: `following` and
 * `followers` are separate and asymmetric, and both are public, so nothing here needs a token.
 * The authenticated `feed/events` endpoint would give a richer timeline including pins and
 * recommendations, and is the natural upgrade once Discover stores a user token.
 */

export interface FriendListen {
    artistName: string;
    caaId: null | number;
    caaReleaseMbid: null | string;
    /** Epoch seconds, as ListenBrainz reports it. */
    listenedAt: number;
    /** The person who played it. Not the track's artist. */
    listener: string;
    recordingMbid: null | string;
    releaseName: null | string;
    title: string;
    /**
     * Streaming links MusicBrainz holds for the recording, which let a preview resolve exactly
     * rather than by text search. Same field the carousels feed to `usePreviewActions().toggle`.
     */
    urlRels: LbUrlRel[];
}

interface LbListensResponse {
    payload?: {
        listens?: Array<{
            listened_at: number;
            track_metadata: {
                additional_info?: { recording_mbid?: null | string };
                artist_name: string;
                mbid_mapping?: {
                    caa_id?: null | number;
                    caa_release_mbid?: null | string;
                    recording_mbid?: null | string;
                    url_rels?: LbUrlRel[];
                };
                release_name?: null | string;
                track_name: string;
            };
        }>;
    };
}

async function fetchListensFor(listener: string, signal?: AbortSignal): Promise<FriendListen[]> {
    const response = await lbFetch<LbListensResponse>(
        `/user/${encodeURIComponent(listener)}/listens?count=${LISTENS_PER_PERSON}`,
        signal,
    );

    return (response?.payload?.listens ?? []).map((listen) => {
        const meta = listen.track_metadata;
        const mapping = meta.mbid_mapping;

        return {
            artistName: meta.artist_name,
            caaId: mapping?.caa_id ?? null,
            caaReleaseMbid: mapping?.caa_release_mbid ?? null,
            listenedAt: listen.listened_at,
            listener,
            // ListenBrainz's own mapping first. `additional_info` carries one only when the
            // submitting client supplied it, which is rare.
            recordingMbid: mapping?.recording_mbid ?? meta.additional_info?.recording_mbid ?? null,
            releaseName: meta.release_name ?? null,
            title: meta.track_name,
            urlRels: mapping?.url_rels ?? [],
        };
    });
}

async function lbFetch<T>(path: string, signal?: AbortSignal): Promise<T | undefined> {
    const response = await fetch(`${LB_API}${path}`, { signal });

    if (!response.ok) {
        throw new Error(`ListenBrainz ${response.status} for ${path}`);
    }

    // 204 with an empty body is a real answer here, not a failure: a listener with nothing
    // recent returns it, and `response.json()` throws on an empty body.
    if (response.status === 204) {
        return undefined;
    }

    return response.json() as Promise<T>;
}

export const socialKeys = {
    following: (username: string) => ['listenbrainz', username, 'following'] as const,
    friendListens: (listeners: string[]) => ['listenbrainz', 'friend-listens', listeners] as const,
};

export const socialQueries = {
    /**
     * Who this user follows. Public, so no token, and a flat array of usernames.
     *
     * Follows change when the user goes and makes them, which is rare and deliberate, so this
     * is cached hard. It is also the gate for the whole section: an empty list means the empty
     * state rather than a fetch of nobody's listens.
     */
    following: (username: string) =>
        queryOptions({
            ...RETRY,
            enabled: Boolean(username),
            gcTime: HOUR * 24 * 7,
            queryFn: ({ signal }) =>
                lbFetch<{ following?: string[] }>(
                    `/user/${encodeURIComponent(username)}/following`,
                    signal,
                ).then((response) => response?.following ?? []),
            queryKey: socialKeys.following(username),
            staleTime: HOUR * 6,
        }),

    /**
     * Recent listens for each person, fanned out one request apiece.
     *
     * There is no bulk endpoint: `/1/users/{list}/recent-listens` 404s. So this mirrors
     * `similarListeners`, including the per-person catch, because one deleted or private
     * account must not cost the whole section. The caller caps the list before it gets here.
     */
    friendListens: (listeners: string[]) =>
        queryOptions({
            ...RETRY,
            enabled: listeners.length > 0,
            gcTime: HOUR * 24,
            queryFn: ({ signal }) =>
                Promise.all(
                    listeners.map((listener) =>
                        fetchListensFor(listener, signal).catch(() => [] as FriendListen[]),
                    ),
                ).then((batches) => batches.flat()),
            queryKey: socialKeys.friendListens(listeners),
            // The one part of Discover that is genuinely live. Anything longer and a section
            // titled "recent" is showing yesterday.
            staleTime: HOUR / 4,
        }),
};

/**
 * How many listens to ask each person for.
 *
 * Enough that someone mid-album still contributes several distinct tracks after grouping, and
 * small enough that twenty of these is a modest response.
 */
const LISTENS_PER_PERSON = 25;
