import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { RawTopSongListResponse, TopSongListQuery } from '/@/renderer/api/types';
import type { QueryOptions } from '/@/renderer/lib/react-query';
import { useCurrentServer } from '/@/renderer/store';
import { api } from '/@/renderer/api';

export const useTopSongsList = (query: TopSongListQuery, options?: QueryOptions) => {
  const server = useCurrentServer();

  return useQuery({
    enabled: !!server?.id,
    queryFn: ({ signal }) => api.controller.getTopSongList({ query, server, signal }),
    queryKey: queryKeys.albumArtists.topSongs(server?.id || '', query),
    select: useCallback(
      (data: RawTopSongListResponse | undefined) => api.normalize.topSongList(data, server),
      [server],
    ),
    ...options,
  });
};
