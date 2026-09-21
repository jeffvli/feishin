import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { syncManagedOfflinePlaylist } from '/@/renderer/features/playlists/hooks/use-offline-playlist-sync';
import { MutationOptions } from '/@/renderer/lib/react-query';
import { RemoveFromPlaylistArgs, RemoveFromPlaylistResponse } from '/@/shared/types/domain-types';

export const useRemoveFromPlaylist = (options?: MutationOptions) => {
    const queryClient = useQueryClient();

    return useMutation<RemoveFromPlaylistResponse, AxiosError, RemoveFromPlaylistArgs, null>({
        mutationFn: (args) => {
            return api.controller.removeFromPlaylist({
                ...args,
                apiClientProps: { serverId: args.apiClientProps.serverId },
            });
        },
        onSuccess: (_data, variables) => {
            const { apiClientProps } = variables;
            const serverId = apiClientProps.serverId;

            if (!serverId) return;

            queryClient.invalidateQueries({
                queryKey: queryKeys.playlists.list(serverId),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.playlists.detail(serverId, variables.query.id),
            });
            queryClient.invalidateQueries({
                queryKey: queryKeys.playlists.songList(serverId, variables.query.id),
            });
            void syncManagedOfflinePlaylist(serverId, variables.query.id);
        },
        ...options,
    });
};
