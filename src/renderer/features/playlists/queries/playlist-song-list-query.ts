import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { PlaylistSongListQuery, PlaylistSongListResponse } from '/@/renderer/api/types';
import type { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';
import { api } from '/@/renderer/api';

export const usePlaylistSongList = (args: QueryHookArgs<PlaylistSongListQuery>) => {
    const { options, query, serverId } = args || {};
    const server = getServerById(serverId);

    return useQuery({
        enabled: !!server,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return api.controller.getPlaylistSongList({
                apiClientProps: { server, signal },
                query,
            });
        },
        queryKey: queryKeys.playlists.songList(server?.id || '', query.id, query),
        ...options,
    });
};

export const usePlaylistSongListInfinite = (args: QueryHookArgs<PlaylistSongListQuery>) => {
    const { options, query, serverId } = args || {};
    const server = getServerById(serverId);

    return useInfiniteQuery({
        enabled: !!server,
        getNextPageParam: (lastPage: PlaylistSongListResponse | undefined, pages) => {
            if (!lastPage?.items) return undefined;
            if (lastPage?.items?.length >= (query?.limit || 50)) {
                return pages?.length;
            }

            return undefined;
        },
        queryFn: ({ pageParam = 0, signal }) => {
            return api.controller.getPlaylistSongList({
                apiClientProps: { server, signal },
                query: {
                    ...query,
                    limit: query.limit || 50,
                    startIndex: pageParam * (query.limit || 50),
                },
            });
        },
        queryKey: queryKeys.playlists.detailSongList(server?.id || '', query.id, query),
        ...options,
    });
};
