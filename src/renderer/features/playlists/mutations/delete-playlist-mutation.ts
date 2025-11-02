import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { getServerById, useCurrentServer } from '/@/renderer/store';
import { DeletePlaylistArgs, DeletePlaylistResponse } from '/@/shared/types/domain-types';

export const useDeletePlaylist = (args: MutationHookArgs) => {
    const { options } = args || {};
    const queryClient = useQueryClient();
    const server = useCurrentServer();

    return useMutation<
        DeletePlaylistResponse,
        AxiosError,
        Omit<DeletePlaylistArgs, 'apiClientProps' | 'server'>,
        null
    >({
        mutationFn: (args) => {
            const server = getServerById(args.serverId);
            if (!server) throw new Error('Server not found');
            return api.controller.deletePlaylist({ ...args, apiClientProps: { server } });
        },
        onMutate: () => {
            queryClient.cancelQueries({ queryKey: queryKeys.playlists.list(server?.id || '') });
            return null;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({
                exact: false,
                queryKey: queryKeys.playlists.list(server?.id || ''),
            });
        },
        ...options,
    });
};
