import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from '/@/renderer/api';
import { controller } from '/@/renderer/api/controller';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { AlbumListQuery, AlbumListResponse } from '/@/renderer/api/types';
import type { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';

export const useAlbumList = (args: QueryHookArgs<AlbumListQuery>) => {
    const { options, query, serverId } = args;
    const server = getServerById(serverId);

    return useQuery({
        enabled: !!serverId,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return controller.getAlbumList({
                apiClientProps: {
                    server,
                    signal,
                },
                query,
            });
        },
        queryKey: queryKeys.albums.list(serverId || '', query),
        ...options,
    });
};

export const useAlbumListInfinite = (args: QueryHookArgs<AlbumListQuery>) => {
    const { options, query, serverId } = args;
    const server = getServerById(serverId);

    return useInfiniteQuery({
        enabled: !!serverId,
        getNextPageParam: (lastPage: AlbumListResponse | undefined, pages) => {
            if (!lastPage?.items) return undefined;
            if (lastPage?.items?.length >= (query?.limit || 50)) {
                return pages?.length;
            }

            return undefined;
        },
        queryFn: ({ pageParam = 0, signal }) => {
            if (!server) throw new Error('Server not found');
            return api.controller.getAlbumList({
                apiClientProps: {
                    server,
                    signal,
                },
                query: {
                    ...query,
                    limit: query.limit || 50,
                    startIndex: pageParam * (query.limit || 50),
                },
            });
        },
        queryKey: queryKeys.albums.list(server?.id || '', query),
        ...options,
    });
};
