import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { DeletePlaylistArgs, DeletePlaylistResponse } from '/@/renderer/api/types';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { getServerById, useCurrentServer } from '/@/renderer/store';

export const useDeletePlaylist = (args: MutationHookArgs) => {
  const { options } = args || {};
  const queryClient = useQueryClient();
  const server = useCurrentServer();

  return useMutation<
    DeletePlaylistResponse,
    HTTPError,
    Omit<DeletePlaylistArgs, 'server' | 'apiClientProps'>,
    null
  >({
    mutationFn: (args) => {
      const server = getServerById(args.serverId);
      if (!server) throw new Error('Server not found');
      return api.controller.deletePlaylist({ ...args, apiClientProps: { server } });
    },
    onMutate: () => {
      queryClient.cancelQueries(queryKeys.playlists.list(server?.id || ''));
      return null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(queryKeys.playlists.list(server?.id || ''));
    },
    ...options,
  });
};
