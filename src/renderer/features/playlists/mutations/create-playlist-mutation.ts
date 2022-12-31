import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { CreatePlaylistArgs, RawCreatePlaylistResponse } from '/@/renderer/api/types';
import { MutationOptions } from '/@/renderer/lib/react-query';
import { useCurrentServer } from '/@/renderer/store';

export const useCreatePlaylist = (options?: MutationOptions) => {
  const queryClient = useQueryClient();
  const server = useCurrentServer();

  return useMutation<
    RawCreatePlaylistResponse,
    HTTPError,
    Omit<CreatePlaylistArgs, 'server'>,
    null
  >({
    mutationFn: (args) => api.controller.createPlaylist({ ...args, server }),
    onSuccess: () => {
      queryClient.invalidateQueries(queryKeys.playlists.list(server?.id || ''));
    },
    ...options,
  });
};
