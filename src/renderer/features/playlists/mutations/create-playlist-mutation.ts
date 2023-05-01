import { useMutation } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { api } from '/@/renderer/api';
import { CreatePlaylistArgs, CreatePlaylistResponse } from '/@/renderer/api/types';
import { MutationHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';

export const useCreatePlaylist = (args: MutationHookArgs) => {
  const { options } = args || {};

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
    ...options,
  });
};
