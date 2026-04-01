import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { SetPlaylistSongsArgs } from '/@/shared/types/domain-types';

export const useUpdatePlaylistTracks = (args: MutationHookArgs) => {
    const { options } = args || {};
    const queryClient = useQueryClient();

    return useMutation<null, AxiosError, SetPlaylistSongsArgs, null>({
        mutationFn: (args) =>
            api.controller.setPlaylistSongs({
                ...args,
                apiClientProps: { serverId: args.apiClientProps.serverId },
            }),
        onSuccess: (_data, variables) => {
            const { apiClientProps, body } = variables;
            const serverId = apiClientProps.serverId;

            if (!serverId) return;

            queryClient.invalidateQueries({
                queryKey: queryKeys.playlists.list(serverId),
            });

            if (body?.id) {
                queryClient.invalidateQueries({
                    queryKey: queryKeys.playlists.detail(serverId, body.id),
                });
                queryClient.invalidateQueries({
                    queryKey: queryKeys.playlists.songList(serverId, body.id),
                });
            }
        },
        ...options,
    });
};
