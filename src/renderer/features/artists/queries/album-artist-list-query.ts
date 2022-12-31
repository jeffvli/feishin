import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { AlbumArtistListQuery, RawAlbumArtistListResponse } from '/@/renderer/api/types';
import type { QueryOptions } from '/@/renderer/lib/react-query';
import { useCurrentServer } from '/@/renderer/store';
import { api } from '/@/renderer/api';

export const useAlbumArtistList = (query: AlbumArtistListQuery, options?: QueryOptions) => {
  const server = useCurrentServer();

  return useQuery({
    enabled: !!server?.id,
    queryFn: ({ signal }) => api.controller.getAlbumArtistList({ query, server, signal }),
    queryKey: queryKeys.albumArtists.list(server?.id || '', query),
    select: useCallback(
      (data: RawAlbumArtistListResponse | undefined) => api.normalize.albumArtistList(data, server),
      [server],
    ),
    ...options,
  });
};
