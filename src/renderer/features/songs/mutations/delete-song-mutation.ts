import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { DeleteSongArgs, DeleteSongResponse, SongListSort, SortOrder } from '/@/renderer/api/types';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';

export const useDeleteSong = (args: MutationHookArgs) => {
    const { options } = args || {};
    const queryClient = useQueryClient();

    return useMutation<
        DeleteSongResponse,
        AxiosError,
        Omit<DeleteSongArgs, 'server' | 'apiClientProps'>,
        null
    >({
        mutationFn: (args) => {
            const server = getServerById(args.serverId);
            if (!server) throw new Error('Server not found');
            return api.controller.deleteSong({ ...args, apiClientProps: { server } });
        },
        onSuccess: (_data, variables) => {
            const { serverId } = variables;

            if (!serverId) return;

            queryClient.invalidateQueries({
                exact: false,
                queryKey: queryKeys.songs.list(serverId, {
                    limit: 15,
                    sortBy: SongListSort.ID,
                    sortOrder: SortOrder.ASC,
                    startIndex: 0,
                }),
            });
            queryClient.invalidateQueries(queryKeys.playlists.list(serverId), { exact: false });
            queryClient.invalidateQueries(queryKeys.songs.list(serverId));
        },
        ...options,
    });
};
