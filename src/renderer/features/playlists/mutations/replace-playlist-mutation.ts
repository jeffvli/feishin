import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { useRecentPlaylists } from '/@/renderer/features/playlists/hooks/use-recent-playlists';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { useCurrentServerId } from '/@/renderer/store';
import { ReplacePlaylistArgs, ReplacePlaylistResponse } from '/@/shared/types/domain-types';

export const useReplacePlaylist = (args: MutationHookArgs) => {
    const { options } = args || {};
    const queryClient = useQueryClient();
    const serverId = useCurrentServerId();

    const { addRecentPlaylist } = useRecentPlaylists(serverId);

    return useMutation<ReplacePlaylistResponse, AxiosError, ReplacePlaylistArgs, null>({
        mutationFn: (args) => {
            return api.controller.replacePlaylist({
                ...args,
                apiClientProps: { serverId: args.apiClientProps.serverId },
            });
        },
        onSuccess: (_data, variables, context) => {
            const { apiClientProps } = variables;
            const serverId = apiClientProps.serverId;

            if (!serverId) return;

            queryClient.invalidateQueries({
                exact: false,
                queryKey: queryKeys.playlists.list(serverId),
            });

            queryClient.invalidateQueries({
                queryKey: queryKeys.playlists.detail(serverId, variables.query.id),
            });

            queryClient.invalidateQueries({
                queryKey: queryKeys.playlists.songList(serverId, variables.query.id),
            });

            addRecentPlaylist(variables.query.id);

            options?.onSuccess?.(_data, variables, context);
        },
        ...options,
    });
};
