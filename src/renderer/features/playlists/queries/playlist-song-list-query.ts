import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { PlaylistSongListQuery } from '/@/renderer/api/types';
import type { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';
import { api } from '/@/renderer/api';

export const usePlaylistSongList = (args: QueryHookArgs<PlaylistSongListQuery>) => {
    const { options, query, serverId } = args || {};
    const server = getServerById(serverId);

    return useQuery({
        enabled: !!server,
        queryFn: ({ signal }) => {
            if (!server) throw new Error('Server not found');
            return api.controller.getPlaylistSongList({
                apiClientProps: { server, signal },
                query,
            });
        },
        queryKey: queryKeys.playlists.songList(server?.id || '', query.id, query),
        ...options,
    });
};
