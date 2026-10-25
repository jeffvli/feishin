import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { infiniteLoaderDataQueryKey } from '/@/renderer/components/item-list/helpers/item-list-infinite-loader';
import {
    applyDeletePlaylistOptimisticUpdates,
    PreviousQueryData,
    restorePlaylistQueryData,
} from '/@/renderer/features/playlists/mutations/playlist-optimistic-updates';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import {
    DeletePlaylistArgs,
    DeletePlaylistResponse,
    LibraryItem,
} from '/@/shared/types/domain-types';

export const useDeletePlaylist = (args: MutationHookArgs) => {
    const { options } = args || {};
    const queryClient = useQueryClient();

    return useMutation<DeletePlaylistResponse, AxiosError, DeletePlaylistArgs, PreviousQueryData[]>(
        {
            mutationFn: (args) => {
                return api.controller.deletePlaylist({
                    ...args,
                    apiClientProps: { serverId: args.apiClientProps.serverId },
                });
            },
            onError: (_error, _variables, context) => {
                if (context) {
                    restorePlaylistQueryData(queryClient, context);
                }
            },
            onMutate: (variables) => {
                queryClient.cancelQueries({
                    queryKey: queryKeys.playlists.list(variables.apiClientProps.serverId),
                });
                return applyDeletePlaylistOptimisticUpdates(queryClient, variables);
            },
            ...options,
            onSuccess: (data, variables, context) => {
                const { serverId } = variables.apiClientProps;
                queryClient.removeQueries({
                    queryKey: queryKeys.playlists.songListIds(serverId, variables.query.id),
                });
                queryClient.invalidateQueries({
                    exact: false,
                    queryKey: queryKeys.playlists.root(serverId),
                });

                queryClient.invalidateQueries({
                    exact: false,
                    queryKey: infiniteLoaderDataQueryKey(serverId, LibraryItem.PLAYLIST),
                });
                options?.onSuccess?.(data, variables, context);
            },
        },
    );
};
