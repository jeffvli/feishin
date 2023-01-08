import { useMutation } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { api } from '/@/renderer/api';
import { FavoriteArgs, RawFavoriteResponse } from '/@/renderer/api/types';
import { MutationOptions } from '/@/renderer/lib/react-query';
import { useCurrentServer } from '/@/renderer/store';

export const useCreateFavorite = (options?: MutationOptions) => {
  const server = useCurrentServer();

  return useMutation<RawFavoriteResponse, HTTPError, Omit<FavoriteArgs, 'server'>, null>({
    mutationFn: (args) => api.controller.createFavorite({ ...args, server }),
    ...options,
  });
};
