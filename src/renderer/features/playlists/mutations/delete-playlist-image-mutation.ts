import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { DeletePlaylistImageArgs, DeletePlaylistImageResponse } from '/@/shared/types/domain-types';

export const useDeletePlaylistImage = (args: MutationHookArgs) => {
    const { options } = args || {};
    const queryClient = useQueryClient();

    return useMutation<DeletePlaylistImageResponse, AxiosError, DeletePlaylistImageArgs, null>({
        mutationFn: (args) => {
            return api.controller.deletePlaylistImage({
                ...args,
                apiClientProps: { serverId: args.apiClientProps.serverId },
            });
        },
        onSuccess: (_data, variables) => {
            const { apiClientProps, query } = variables;
            const serverId = apiClientProps.serverId;

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
