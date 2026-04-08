import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { DeleteArtistImageArgs, DeleteArtistImageResponse } from '/@/shared/types/domain-types';

export const useDeleteArtistImage = (args: MutationHookArgs) => {
    const { options } = args || {};
    const queryClient = useQueryClient();

    return useMutation<DeleteArtistImageResponse, AxiosError, DeleteArtistImageArgs, null>({
        mutationFn: (args) => {
            return api.controller.deleteArtistImage({
                ...args,
                apiClientProps: { serverId: args.apiClientProps.serverId },
            });
        },
        onSuccess: (_data, variables) => {
            const { apiClientProps, query } = variables;
            const serverId = apiClientProps.serverId;

            if (!serverId) return;

            queryClient.invalidateQueries({
                queryKey: queryKeys.albumArtists.list(serverId),
            });

            if (query?.id) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.albumArtists.detail(serverId, { id: query.id }),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.albumArtists.info(serverId, { id: query.id }),
                });
            }
        },
        ...options,
    });
};
