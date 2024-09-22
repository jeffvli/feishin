import { useQuery } from '@tanstack/react-query';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { AlbumListQuery } from '/@/renderer/api/types';
import type { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';

export const useAlbumListCount = (args: QueryHookArgs<AlbumListQuery>) => {
    const { options, query, serverId } = args;
    const server = getServerById(serverId);

    return useQuery({
        enabled: !!serverId,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return api.controller.getAlbumListCount({
                apiClientProps: {
                    server,
                    signal,
                },
                query,
            });
        },
        queryKey: queryKeys.albums.count(
            serverId || '',
            Object.keys(query).length === 0 ? undefined : query,
        ),
        ...options,
    });
};
