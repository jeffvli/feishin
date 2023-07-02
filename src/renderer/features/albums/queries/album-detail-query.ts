import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '../../../store/auth.store';
import type { AlbumDetailQuery } from '/@/renderer/api/types';
import { controller } from '/@/renderer/api/controller';

export const useAlbumDetail = (args: QueryHookArgs<AlbumDetailQuery>) => {
    const { options, query, serverId } = args;
    const server = getServerById(serverId);

    return useQuery({
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return controller.getAlbumDetail({ apiClientProps: { server, signal }, query });
        },
        queryKey: queryKeys.albums.detail(server?.id || '', query),
        ...options,
    });
};
