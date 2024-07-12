import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '../../../store/auth.store';
import type { SongInfoQuery } from '/@/renderer/api/types';
import { controller } from '/@/renderer/api/controller';

export const useSongInfo = (args: QueryHookArgs<SongInfoQuery>) => {
    const { options, query, serverId } = args;
    const server = getServerById(serverId);

    return useQuery({
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return controller.getSongDetail({ apiClientProps: { server, signal }, query });
        },
        queryKey: queryKeys.songs.detail(server?.id || '', query),
        ...options,
    });
};
