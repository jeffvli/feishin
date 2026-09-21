import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { syncManagedOfflinePlaylist } from '/@/renderer/features/playlists/hooks/use-offline-playlist-sync';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { UpdatePlaylistArgs, UpdatePlaylistResponse } from '/@/shared/types/domain-types';

export const useUpdatePlaylist = (args: MutationHookArgs) => {
    const { options } = args || {};
    const queryClient = useQueryClient();

    return useMutation<UpdatePlaylistResponse, AxiosError, UpdatePlaylistArgs, null>({
        mutationFn: (args) => {
            return api.controller.updatePlaylist({
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
                queryClient.invalidateQueries({
                    queryKey: queryKeys.playlists.songList(serverId, query.id),
                });
                void syncManagedOfflinePlaylist(serverId, query.id);
            }
        },
        ...options,
    });
};
