import { useQuery } from '@tanstack/react-query';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { AlbumListQuery, AlbumListSort, SortOrder } from '/@/renderer/api/types';
import { getServerById } from '/@/renderer/store';
import { QueryHookArgs } from '/@/renderer/lib/react-query';

export const useRecentlyPlayed = (args: QueryHookArgs<Partial<AlbumListQuery>>) => {
    const { options, query, serverId } = args;
    const server = getServerById(serverId);

    const requestQuery: AlbumListQuery = {
        limit: 5,
        sortBy: AlbumListSort.RECENTLY_PLAYED,
        sortOrder: SortOrder.ASC,
        startIndex: 0,
        ...query,
    };

    return useQuery({
        enabled: !!server?.id,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return api.controller.getAlbumList({
                apiClientProps: {
                    server,
                    signal,
                },
                query: requestQuery,
            });
        },

        queryKey: queryKeys.albums.list(server?.id || '', requestQuery),
        ...options,
    });
};
