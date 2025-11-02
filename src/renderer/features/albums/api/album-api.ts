import { queryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';
import { AlbumDetailQuery, AlbumListQuery, ListCountQuery } from '/@/shared/types/domain-types';

export const albumQueries = {
    detail: (args: QueryHookArgs<AlbumDetailQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.getAlbumDetail({
                    apiClientProps: { server: getServerById(args.serverId), signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.albums.detail(args.serverId, args.query),
            ...args.options,
        });
    },
    list: (args: QueryHookArgs<AlbumListQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.getAlbumList({
                    apiClientProps: { server: getServerById(args.serverId), signal },
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
            queryFn: ({ signal }) => {
                return api.controller.getAlbumListCount({
                    apiClientProps: { server: getServerById(args.serverId), signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.albums.count(
                args.serverId,
                args.query,
                args.query?.artistIds?.length === 1 ? args.query?.artistIds[0] : undefined,
            ),
            ...args.options,
        });
    },
};
