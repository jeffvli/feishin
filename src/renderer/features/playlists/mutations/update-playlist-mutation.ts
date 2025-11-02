import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';
import { UpdatePlaylistArgs, UpdatePlaylistResponse } from '/@/shared/types/domain-types';

export const useUpdatePlaylist = (args: MutationHookArgs) => {
    const { options } = args || {};
    const queryClient = useQueryClient();

    return useMutation<
        UpdatePlaylistResponse,
        AxiosError,
        Omit<UpdatePlaylistArgs, 'apiClientProps' | 'server'>,
        null
    >({
        mutationFn: (args) => {
            const server = getServerById(args.serverId);
            if (!server) throw new Error('Server not found');
            return api.controller.updatePlaylist({ ...args, apiClientProps: { server } });
        },
        onSuccess: (_data, variables) => {
            const { query, serverId } = variables;

            if (!serverId) return;

            queryClient.invalidateQueries({
                queryKey: queryKeys.playlists.list(serverId),
            });

            if (query?.id) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.playlists.detail(serverId, query.id),
                });
            }
        },
        ...options,
    });
};
