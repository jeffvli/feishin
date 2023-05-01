import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { UpdatePlaylistArgs, UpdatePlaylistResponse } from '/@/renderer/api/types';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';

export const useUpdatePlaylist = (args: MutationHookArgs) => {
  const { options } = args || {};
  const queryClient = useQueryClient();

  return useMutation<
    UpdatePlaylistResponse,
    HTTPError,
    Omit<UpdatePlaylistArgs, 'server' | 'apiClientProps'>,
    null
  >({
    mutationFn: (args) => {
      const server = getServerById(args.serverId);
      if (!server) throw new Error('Server not found');
      return api.controller.updatePlaylist({ ...args, apiClientProps: { server } });
    },
    onSuccess: (_data, variables) => {
      const { query, serverId } = variables;

      if (!serverId) return;

      queryClient.invalidateQueries(queryKeys.playlists.list(serverId));

      if (query?.id) {
        queryClient.invalidateQueries(queryKeys.playlists.detail(serverId, query.id));
      }
    },
    ...options,
  });
};
