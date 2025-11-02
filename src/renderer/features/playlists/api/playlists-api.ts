import { queryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';
import {
    PlaylistDetailQuery,
    PlaylistListQuery,
    PlaylistSongListQuery,
} from '/@/shared/types/domain-types';

export const playlistsQueries = {
    detail: (args: QueryHookArgs<PlaylistDetailQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                const server = getServerById(args.serverId);
                if (!server) throw new Error('Server not found');
                return api.controller.getPlaylistDetail({
                    apiClientProps: { server, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.playlists.detail(args.serverId || '', args.query.id, args.query),
            ...args.options,
        });
    },
    list: (args: QueryHookArgs<PlaylistListQuery>) => {
        return queryOptions({
            gcTime: 1000 * 60 * 60,
            queryFn: ({ signal }) => {
                const server = getServerById(args.serverId);
                if (!server) throw new Error('Server not found');
                return api.controller.getPlaylistList({
                    apiClientProps: { server, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.playlists.list(args.serverId || '', args.query),
            ...args.options,
        });
    },
    songList: (args: QueryHookArgs<PlaylistSongListQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                const server = getServerById(args.serverId);
                if (!server) throw new Error('Server not found');
                return api.controller.getPlaylistSongList({
                    apiClientProps: { server, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.playlists.songList(args.serverId || '', args.query.id),
            ...args.options,
        });
    },
};
