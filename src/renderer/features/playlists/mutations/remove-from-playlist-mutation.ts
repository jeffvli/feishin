import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { MutationOptions } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';
import { RemoveFromPlaylistArgs, RemoveFromPlaylistResponse } from '/@/shared/types/domain-types';

export const useRemoveFromPlaylist = (options?: MutationOptions) => {
    const queryClient = useQueryClient();

    return useMutation<
        RemoveFromPlaylistResponse,
        AxiosError,
        Omit<RemoveFromPlaylistArgs, 'apiClientProps' | 'server'>,
        null
    >({
        mutationFn: (args) => {
            const server = getServerById(args.serverId);
            if (!server) throw new Error('Server not found');
            return api.controller.removeFromPlaylist({ ...args, apiClientProps: { server } });
        },
        onSuccess: (_data, variables) => {
            const { serverId } = variables;

            if (!serverId) return;

            queryClient.invalidateQueries(queryKeys.playlists.list(serverId), { exact: false });
            queryClient.invalidateQueries(queryKeys.playlists.detail(serverId, variables.query.id));
            queryClient.invalidateQueries(
                queryKeys.playlists.songList(serverId, variables.query.id),
            );
        },
        ...options,
    });
};
