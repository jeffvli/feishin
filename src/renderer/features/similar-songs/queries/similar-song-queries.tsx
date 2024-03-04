import { useQuery } from '@tanstack/react-query';
import { SimilarSongsQuery } from '/@/renderer/api/types';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';
import { queryKeys } from '/@/renderer/api/query-keys';
import { api } from '/@/renderer/api';

export const useSimilarSongs = (args: QueryHookArgs<SimilarSongsQuery>) => {
    const { options, query, serverId } = args || {};
    const server = getServerById(serverId);

    return useQuery({
        enabled: !!server,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');

            return api.controller.getSimilarSongs({
                apiClientProps: { server, signal },
                query: { count: query.count ?? 50, songId: query.songId },
            });
        },
        queryKey: queryKeys.albumArtists.detail(server?.id || '', query),
        ...options,
    });
};
