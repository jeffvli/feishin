import { queryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { MusicFolderListQuery, TagListQuery, UserListQuery } from '/@/shared/types/domain-types';

export const sharedQueries = {
    musicFolders: (args: QueryHookArgs<MusicFolderListQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.getMusicFolderList({
                    apiClientProps: { serverId: args.serverId, signal },
                });
            },
            queryKey: queryKeys.musicFolders.list(args.serverId),
            ...args.options,
        });
    },
    roles: (args: QueryHookArgs<object>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.getRoles({
                    apiClientProps: { serverId: args.serverId, signal },
                });
            },
            queryKey: queryKeys.roles.list(args.serverId || ''),
            ...args.options,
        });
    },
    tagList: (args: QueryHookArgs<TagListQuery>) => {
        return queryOptions({
            gcTime: 1000 * 60,
            queryFn: ({ signal }) => {
                return api.controller.getTagList({
                    apiClientProps: { serverId: args.serverId, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.tags.list(args.serverId || '', args.query.type),
            staleTime: 1000 * 60,
            ...args.options,
        });
    },
    users: (args: QueryHookArgs<UserListQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.getUserList({
                    apiClientProps: { serverId: args.serverId, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.users.list(args.serverId || '', args.query),
            ...args.options,
        });
    },
};
