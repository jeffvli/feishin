import { queryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { FolderListQuery } from '/@/shared/types/domain-types';

export const folderQueries = {
    list: (args: QueryHookArgs<FolderListQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.getFolderList({
                    apiClientProps: { serverId: args.serverId, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.folders.list(args.serverId, args.query),
            ...args.options,
        });
    },
    musicFolders: (args: { options?: any; serverId: string }) => {
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
};
