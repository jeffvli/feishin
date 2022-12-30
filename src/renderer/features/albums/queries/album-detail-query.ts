import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { QueryOptions } from '/@/renderer/lib/react-query';
import { useCurrentServer } from '../../../store/auth.store';
import type { AlbumDetailQuery, RawAlbumDetailResponse } from '/@/renderer/api/types';
import { controller } from '/@/renderer/api/controller';
import { useCallback } from 'react';
import { api } from '/@/renderer/api';

export const useAlbumDetail = (query: AlbumDetailQuery, options?: QueryOptions) => {
  const server = useCurrentServer();

  return useQuery({
    queryFn: ({ signal }) => controller.getAlbumDetail({ query, server, signal }),
    queryKey: queryKeys.albums.detail(server?.id || '', query),
    select: useCallback(
      (data: RawAlbumDetailResponse | undefined) => api.normalize.albumDetail(data, server),
      [server],
    ),
    ...options,
  });
};
