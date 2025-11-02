import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';
import { CreatePlaylistArgs, CreatePlaylistResponse } from '/@/shared/types/domain-types';

export const useCreatePlaylist = (args: MutationHookArgs) => {
    const { options } = args || {};
    const queryClient = useQueryClient();

    return useMutation<
        CreatePlaylistResponse,
        AxiosError,
        Omit<CreatePlaylistArgs, 'apiClientProps' | 'server'>,
        null
    >({
        mutationFn: (args) => {
            const server = getServerById(args.serverId);
            if (!server) throw new Error('Server not found');
            return api.controller.createPlaylist({ ...args, apiClientProps: { server } });
        },
        onSuccess: (_args, variables) => {
            const server = getServerById(variables.serverId);
            if (server) {
                queryClient.invalidateQueries({
                    exact: false,
                    queryKey: queryKeys.playlists.list(server.id),
                });
            }
        },
        ...options,
    });
};
