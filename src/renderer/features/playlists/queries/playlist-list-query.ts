import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { PlaylistListQuery } from '/@/renderer/api/types';
import type { QueryOptions } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';
import { api } from '/@/renderer/api';

export const usePlaylistList = (args: {
    options?: QueryOptions;
    query: PlaylistListQuery;
    serverId?: string;
}) => {
    const { options, query, serverId } = args;
    const server = getServerById(serverId);

    return useQuery({
        cacheTime: 1000 * 60 * 60,
        enabled: !!server?.id,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return api.controller.getPlaylistList({ apiClientProps: { server, signal }, query });
        },
        queryKey: queryKeys.playlists.list(server?.id || '', query),
        ...options,
    });
};
