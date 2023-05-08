import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { api } from '/@/renderer/api';
import { CreatePlaylistArgs, CreatePlaylistResponse } from '/@/renderer/api/types';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';
import { queryKeys } from '../../../api/query-keys';

export const useCreatePlaylist = (args: MutationHookArgs) => {
  const { options } = args || {};
  const queryClient = useQueryClient();

  return useMutation<
    CreatePlaylistResponse,
    HTTPError,
    Omit<CreatePlaylistArgs, 'server' | 'apiClientProps'>,
    null
  >({
    mutationFn: (args) => {
      const server = getServerById(args.serverId);
      if (!server) throw new Error('Server not found');
      return api.controller.createPlaylist({ ...args, apiClientProps: { server } });
    },
    onSuccess: (_args, variables) => {
      const server = getServerById(variables.serverId);
      if (server) {
        queryClient.invalidateQueries(queryKeys.playlists.list(server.id));
      }
    },
    ...options,
  });
};
