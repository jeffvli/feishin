import { useQueries, useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { queryKeys } from '/@/renderer/api/query-keys';
import { playlistsQueries } from '/@/renderer/features/playlists/api/playlists-api';
import { queryClient } from '/@/renderer/lib/react-query';
import { useCurrentServerId } from '/@/renderer/store';
import { logger } from '/@/renderer/utils/logger';
import {
    Playlist,
    PlaylistListSort,
    SongIdListResponse,
    SortOrder,
} from '/@/shared/types/domain-types';

const CONCURRENCY = 5; // Number of playlists to fetch at once.
const NO_SONGS: string[] = [];

// songCount a playlist's cached ids were last fetched against. Lets playlists whose server-side
// count never matches the id count (e.g. hidden/missing tracks) skip refetching on every check.
const fetchedAtCount = new Map<string, null | number>();

const fetchedKey = (serverId: string, playlistId: string) => `${serverId}:${playlistId}`;

const needsFetch = (serverId: string, playlist: Playlist) => {
    const cached = queryClient.getQueryData<SongIdListResponse>(
        queryKeys.playlists.songListIds(serverId, playlist.id),
    );

    if (!cached) return true;
    if (playlist.songCount == null || cached.items.length === playlist.songCount) return false;

    return fetchedAtCount.get(fetchedKey(serverId, playlist.id)) !== playlist.songCount;
};

/**
 * Fills the `songListIds` cache for playlists that are missing or out of date, `CONCURRENCY` at a
 * time. Safe to call from several places at once: staleness is re-checked right before each fetch.
 */
export const warmPlaylistSongIds = async (
    serverId: string,
    playlists: Playlist[],
    signal?: AbortSignal,
) => {
    const queue = [...playlists];

    const worker = async () => {
        let playlist: Playlist | undefined;

        while (!signal?.aborted && (playlist = queue.shift())) {
            if (!needsFetch(serverId, playlist)) continue;

            try {
                await queryClient.fetchQuery({
                    ...playlistsQueries.playlistSongIds({ query: { id: playlist.id }, serverId }),
                    staleTime: 0,
                });
                fetchedAtCount.set(fetchedKey(serverId, playlist.id), playlist.songCount);
            } catch (error) {
                logger.warn('Failed to load playlist song ids', { error, playlistId: playlist.id });
            }
        }
    };

    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, worker));
};

/**
 * For each playlist, whether it already contains any of `songIds`. `isReady` is false until every
 * playlist's ids are loaded, so callers never show an unknown playlist as "not in playlist".
 */
export const usePlaylistsContainingSongs = ({
    playlists,
    serverId,
    songIds = NO_SONGS,
}: {
    playlists: Playlist[];
    serverId: string;
    songIds?: string[];
}) => {
    const enabled = songIds.length > 0;
    const [settledFor, setSettledFor] = useState<null | Playlist[]>(null);

    useEffect(() => {
        if (!enabled) return;

        const controller = new AbortController();

        warmPlaylistSongIds(serverId, playlists, controller.signal).then(() => {
            if (!controller.signal.aborted) setSettledFor(playlists);
        });

        return () => controller.abort();
    }, [enabled, playlists, serverId]);

    const inPlaylist = useQueries({
        combine: useCallback(
            (results: { data?: SongIdListResponse }[]) =>
                results.map((result) =>
                    result.data ? songIds.some((id) => result.data!.items.includes(id)) : undefined,
                ),
            [songIds],
        ),
        queries: playlists.map((playlist) => ({
            ...playlistsQueries.playlistSongIds({ query: { id: playlist.id }, serverId }),
            enabled: false,
        })),
    });

    // A load that finished (or failed) counts as settled even if counts never line up
    const isReady =
        !enabled ||
        settledFor === playlists ||
        playlists.every((playlist) => !needsFetch(serverId, playlist));

    return { inPlaylist, isReady };
};

/** Loads playlist song ids in the background so the add-to-playlist modal opens with answers ready. */
export const usePlaylistMembershipWarmup = () => {
    const serverId = useCurrentServerId();

    const { data } = useQuery(
        playlistsQueries.list({
            options: { enabled: !!serverId },
            query: {
                excludeSmartPlaylists: true,
                sortBy: PlaylistListSort.NAME,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            },
            serverId,
        }),
    );

    const playlists = data?.items;

    useEffect(() => {
        if (!serverId || !playlists) return;

        const controller = new AbortController();
        warmPlaylistSongIds(serverId, playlists, controller.signal);

        return () => controller.abort();
    }, [playlists, serverId]);
};
