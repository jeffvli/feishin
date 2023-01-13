import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { AlbumArtistDetailQuery, RawAlbumArtistDetailResponse } from '/@/renderer/api/types';
import type { QueryOptions } from '/@/renderer/lib/react-query';
import { useCurrentServer } from '/@/renderer/store';
import { api } from '/@/renderer/api';

export const useAlbumArtistInfo = (query: AlbumArtistDetailQuery, options?: QueryOptions) => {
  const server = useCurrentServer();

  return useQuery({
    enabled: !!server?.id && !!query.id,
    queryFn: ({ signal }) => api.controller.getAlbumArtistDetail({ query, server, signal }),
    queryKey: queryKeys.albumArtists.detail(server?.id || '', query),
    select: useCallback(
      (data: RawAlbumArtistDetailResponse | undefined) =>
        api.normalize.albumArtistDetail(data, server),
      [server],
    ),
    ...options,
  });
};
