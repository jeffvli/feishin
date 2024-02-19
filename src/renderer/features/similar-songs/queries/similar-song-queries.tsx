import { useQuery } from '@tanstack/react-query';
import { SimilarSongsQuery } from '/@/renderer/api/types';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';
import { queryKeys } from '/@/renderer/api/query-keys';
import { api } from '/@/renderer/api';

export const useSimilarSongs = (args: QueryHookArgs<Partial<SimilarSongsQuery>>) => {
    const { options, query } = args || {};
    const server = getServerById(query.song?.serverId);

    return useQuery({
        enabled: !!server?.id && !!query.song,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            if (!query.song) return undefined;

            return api.controller.getSimilarSongs({
                apiClientProps: { server, signal },
                query: { count: query.count ?? 50, song: query.song },
            });
        },
        queryKey: queryKeys.albumArtists.detail(server?.id || '', query),
        ...options,
    });
};
