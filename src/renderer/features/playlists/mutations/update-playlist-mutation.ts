import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { RawUpdatePlaylistResponse, UpdatePlaylistArgs } from '/@/renderer/api/types';
import { MutationOptions } from '/@/renderer/lib/react-query';
import { useCurrentServer } from '/@/renderer/store';

export const useUpdatePlaylist = (options?: MutationOptions) => {
  const queryClient = useQueryClient();
  const server = useCurrentServer();

  return useMutation<
    RawUpdatePlaylistResponse,
    HTTPError,
    Omit<UpdatePlaylistArgs, 'server'>,
    null
  >({
    mutationFn: (args) => api.controller.updatePlaylist({ ...args, server }),
    onSuccess: (data) => {
      queryClient.invalidateQueries(queryKeys.playlists.list(server?.id || ''));

      if (data?.id) {
        queryClient.invalidateQueries(queryKeys.playlists.detail(server?.id || '', data.id));
      }
    },
    ...options,
  });
};
