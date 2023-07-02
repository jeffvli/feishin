import { useQuery } from '@tanstack/react-query';
import { controller } from '/@/renderer/api/controller';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { SongListQuery } from '/@/renderer/api/types';
import { getServerById } from '/@/renderer/store';
import type { QueryHookArgs } from '/@/renderer/lib/react-query';

export const useSongList = (args: QueryHookArgs<SongListQuery>) => {
    const { query, options, serverId } = args || {};
    const server = getServerById(serverId);

    return useQuery({
        enabled: !!server?.id,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return controller.getSongList({ apiClientProps: { server, signal }, query });
        },
        queryKey: queryKeys.songs.list(server?.id || '', query),
        ...options,
    });
};
