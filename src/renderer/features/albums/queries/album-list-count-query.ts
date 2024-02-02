import { useQuery } from '@tanstack/react-query';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { AlbumListQuery } from '/@/renderer/api/types';
import type { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';

export const getAlbumListCountQuery = (query: AlbumListQuery) => {
    const filter: Record<string, unknown> = {};

    if (query.artistIds) filter.artistIds = query.artistIds;
    if (query.maxYear) filter.maxYear = query.maxYear;
    if (query.minYear) filter.minYear = query.minYear;
    if (query.searchTerm) filter.searchTerm = query.searchTerm;
    if (query.genre) filter.genre = query.genre;
    if (query.musicFolderId) filter.musicFolderId = query.musicFolderId;
    if (query.isCompilation) filter.isCompilation = query.isCompilation;
    if (query.isFavorite) filter.isCompilation = query.isFavorite;

    if (Object.keys(filter).length === 0) return undefined;

    return filter;
};

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
        queryKey: queryKeys.albums.count(serverId || '', getAlbumListCountQuery(query)),
        ...options,
    });
};
