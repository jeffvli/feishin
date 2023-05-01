import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { AddToPlaylistArgs, AddToPlaylistResponse } from '/@/renderer/api/types';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';

export const useAddToPlaylist = (args: MutationHookArgs) => {
  const { options } = args || {};
  const queryClient = useQueryClient();

  return useMutation<
    AddToPlaylistResponse,
    HTTPError,
    Omit<AddToPlaylistArgs, 'server' | 'apiClientProps'>,
    null
  >({
    mutationFn: (args) => {
      const server = getServerById(args.serverId);
      if (!server) throw new Error('Server not found');
      return api.controller.addToPlaylist({ ...args, apiClientProps: { server } });
    },
    onSuccess: (_data, variables) => {
      const { serverId } = variables;

      if (!serverId) return;

      queryClient.invalidateQueries(queryKeys.playlists.list(serverId), { exact: false });
      queryClient.invalidateQueries(queryKeys.playlists.detail(serverId, variables.query.id));
      queryClient.invalidateQueries(
        queryKeys.playlists.detailSongList(serverId, variables.query.id),
      );
    },
    ...options,
  });
};
