import { useQuery } from '@tanstack/react-query';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { AlbumArtistListQuery } from '/@/renderer/api/types';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';

export const getAlbumArtistListCountQuery = (query: AlbumArtistListQuery) => {
    const filter: Record<string, unknown> = {};

    if (query.searchTerm) filter.searchTerm = query.searchTerm;
    if (query.musicFolderId) filter.musicFolderId = query.musicFolderId;

    if (Object.keys(filter).length === 0) return undefined;

    return filter;
};

export const useAlbumArtistListCount = (args: QueryHookArgs<AlbumArtistListQuery>) => {
    const { options, query, serverId } = args;
    const server = getServerById(serverId);

    return useQuery({
        enabled: !!serverId,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return api.controller.getAlbumArtistListCount({
                apiClientProps: {
                    server,
                    signal,
                },
                query,
            });
        },
        queryKey: queryKeys.albumArtists.count(serverId || '', getAlbumArtistListCountQuery(query)),
        ...options,
    });
};
