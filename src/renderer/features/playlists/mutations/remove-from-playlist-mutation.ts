import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { RemoveFromPlaylistResponse, RemoveFromPlaylistArgs } from '/@/renderer/api/types';
import { MutationOptions } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';

export const useRemoveFromPlaylist = (options?: MutationOptions) => {
  const queryClient = useQueryClient();

  return useMutation<
    RemoveFromPlaylistResponse,
    HTTPError,
    Omit<RemoveFromPlaylistArgs, 'server' | 'apiClientProps'>,
    null
  >({
    mutationFn: (args) => {
      const server = getServerById(args.serverId);
      if (!server) throw new Error('Server not found');
      return api.controller.removeFromPlaylist({ ...args, apiClientProps: { server } });
    },
    onSuccess: (_data, variables) => {
      const { serverId } = variables;
      queryClient.invalidateQueries(queryKeys.playlists.list(serverId), { exact: false });
      queryClient.invalidateQueries(queryKeys.playlists.detail(serverId, variables.query.id));
      queryClient.invalidateQueries(
        queryKeys.playlists.detailSongList(serverId, variables.query.id),
      );
    },
    ...options,
  });
};
