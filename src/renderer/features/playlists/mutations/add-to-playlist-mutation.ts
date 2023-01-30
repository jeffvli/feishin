import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { AddToPlaylistArgs, RawAddToPlaylistResponse } from '/@/renderer/api/types';
import { MutationOptions } from '/@/renderer/lib/react-query';
import { useCurrentServer } from '/@/renderer/store';

export const useAddToPlaylist = (options?: MutationOptions) => {
  const queryClient = useQueryClient();
  const server = useCurrentServer();

  return useMutation<RawAddToPlaylistResponse, HTTPError, Omit<AddToPlaylistArgs, 'server'>, null>({
    mutationFn: (args) => api.controller.addToPlaylist({ ...args, server }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries(queryKeys.playlists.list(server?.id || ''), { exact: false });

      queryClient.invalidateQueries(
        queryKeys.playlists.detail(server?.id || '', variables.query.id),
      );

      queryClient.invalidateQueries(
        queryKeys.playlists.detailSongList(server?.id || '', variables.query.id),
      );
    },
    ...options,
  });
};
