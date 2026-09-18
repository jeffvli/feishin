import { queryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { controller } from '/@/renderer/api/controller';
import { queryKeys } from '/@/renderer/api/query-keys';
import { getOptimizedListCount } from '/@/renderer/api/utils-list-count';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { AlbumDetailQuery, AlbumListQuery, ListCountQuery } from '/@/shared/types/domain-types';

export const albumQueries = {
    detail: (args: QueryHookArgs<AlbumDetailQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.getAlbumDetail({
                    apiClientProps: { serverId: args.serverId, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.albums.detail(args.serverId, args.query),
            ...args.options,
        });
    },
    info: (args: QueryHookArgs<AlbumDetailQuery>) => {
        return queryOptions({
            enabled: Boolean(api.controller.getAlbumInfo),
            queryFn: ({ signal }) => {
                return api.controller.getAlbumInfo!({
                    apiClientProps: { serverId: args.serverId, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.albums.info(args.serverId, args.query),
            ...args.options,
        });
    },
    list: (args: QueryHookArgs<AlbumListQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.getAlbumList({
                    apiClientProps: { serverId: args.serverId, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.albums.list(
                args.serverId,
                args.query,
                args.query?.artistIds?.length === 1 ? args.query?.artistIds[0] : undefined,
            ),
            ...args.options,
        });
    },
    listCount: (args: QueryHookArgs<ListCountQuery<AlbumListQuery>>) => {
        return queryOptions({
            gcTime: 1000 * 60 * 60,
            queryFn: async ({ client, signal }) => {
                const optimizedCount = await getOptimizedListCount<
                    ListCountQuery<AlbumListQuery>,
                    AlbumListQuery,
                    { totalRecordCount: null | number }
                >({
                    client,
                    listQueryFn: controller.getAlbumList,
                    listQueryKeyFn: (serverId, query) => queryKeys.albums.list(serverId, query),
                    query: args.query,
                    serverId: args.serverId,
                    signal,
                });

                if (optimizedCount !== null) {
                    return optimizedCount;
                }

                return api.controller.getAlbumListCount({
                    apiClientProps: { serverId: args.serverId, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.albums.count(
                args.serverId,
                args.query,
                args.query?.artistIds?.length === 1 ? args.query?.artistIds[0] : undefined,
            ),
            staleTime: 1000 * 60 * 60,
            ...args.options,
        });
    },
};
