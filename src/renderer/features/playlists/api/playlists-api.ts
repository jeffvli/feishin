import { queryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import {
    ListCountQuery,
    PlaylistDetailQuery,
    PlaylistListQuery,
    PlaylistSongListQuery,
} from '/@/shared/types/domain-types';

export const playlistsQueries = {
    detail: (args: QueryHookArgs<PlaylistDetailQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.getPlaylistDetail({
                    apiClientProps: { serverId: args.serverId, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.playlists.detail(args.serverId, args.query.id, args.query),
            ...args.options,
        });
    },
    list: (args: QueryHookArgs<PlaylistListQuery>) => {
        return queryOptions({
            gcTime: 1000 * 60 * 60,
            queryFn: ({ signal }) => {
                return api.controller.getPlaylistList({
                    apiClientProps: { serverId: args.serverId, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.playlists.list(args.serverId || '', args.query),
            ...args.options,
        });
    },
    listCount: (args: QueryHookArgs<ListCountQuery<PlaylistListQuery>>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.getPlaylistListCount({
                    apiClientProps: { serverId: args.serverId, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.playlists.count(
                args.serverId || '',
                Object.keys(args.query).length === 0 ? undefined : args.query,
            ),
            ...args.options,
        });
    },
    songList: (args: QueryHookArgs<PlaylistSongListQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.getPlaylistSongList({
                    apiClientProps: { serverId: args.serverId, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.playlists.songList(args.serverId || '', args.query.id),
            ...args.options,
        });
    },
};
