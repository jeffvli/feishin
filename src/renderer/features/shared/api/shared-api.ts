import { queryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';
import { MusicFolderListQuery, TagQuery, UserListQuery } from '/@/shared/types/domain-types';

export const sharedQueries = {
    musicFolders: (args: QueryHookArgs<MusicFolderListQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                const server = getServerById(args.serverId);
                if (!server) throw new Error('Server not found');
                return api.controller.getMusicFolderList({ apiClientProps: { server, signal } });
            },
            queryKey: queryKeys.musicFolders.list(args.serverId || ''),
            ...args.options,
        });
    },
    roles: (args: QueryHookArgs<object>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                const server = getServerById(args.serverId);
                if (!server) throw new Error('Server not found');
                return api.controller.getRoles({
                    apiClientProps: { server, signal },
                });
            },
            queryKey: queryKeys.roles.list(args.serverId || ''),
            ...args.options,
        });
    },
    tags: (args: QueryHookArgs<TagQuery>) => {
        return queryOptions({
            gcTime: 1000 * 60,
            queryFn: ({ signal }) => {
                const server = getServerById(args.serverId);
                if (!server) throw new Error('Server not found');
                return api.controller.getTags({
                    apiClientProps: { server, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.tags.list(args.serverId || '', args.query.type),
            ...args.options,
        });
    },
    users: (args: QueryHookArgs<UserListQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                const server = getServerById(args.serverId);
                if (!server) throw new Error('Server not found');
                return api.controller.getUserList({
                    apiClientProps: { server, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.users.list(args.serverId || '', args.query),
            ...args.options,
        });
    },
};
