import { useQuery } from '@tanstack/react-query';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { SongListQuery } from '/@/renderer/api/types';
import type { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';

export const getSongListCountQuery = (query: SongListQuery) => {
    const filter: Record<string, unknown> = {};

    if (query.searchTerm) filter.searchTerm = query.searchTerm;
    if (query.genreId) filter.genreId = query.genreId;
    if (query.musicFolderId) filter.musicFolderId = query.musicFolderId;
    if (query.isFavorite) filter.isFavorite = query.isFavorite;
    if (query.genre) filter.genre = query.genre;

    if (Object.keys(filter).length === 0) return undefined;

    return filter;
};

export const useSongListCount = (args: QueryHookArgs<SongListQuery>) => {
    const { options, query, serverId } = args;
    const server = getServerById(serverId);

    return useQuery({
        enabled: !!serverId,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return api.controller.getSongListCount({
                apiClientProps: {
                    server,
                    signal,
                },
                query,
            });
        },
        queryKey: queryKeys.songs.count(serverId || '', getSongListCountQuery(query)),
        ...options,
    });
};
