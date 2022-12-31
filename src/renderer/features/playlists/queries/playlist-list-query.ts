import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { PlaylistListQuery, RawPlaylistListResponse } from '/@/renderer/api/types';
import type { QueryOptions } from '/@/renderer/lib/react-query';
import { useCurrentServer } from '/@/renderer/store';
import { api } from '/@/renderer/api';

export const usePlaylistList = (query: PlaylistListQuery, options?: QueryOptions) => {
  const server = useCurrentServer();

  return useQuery({
    cacheTime: 1000 * 60 * 60,
    enabled: !!server?.id,
    queryFn: ({ signal }) => api.controller.getPlaylistList({ query, server, signal }),
    queryKey: queryKeys.playlists.list(server?.id || '', query),
    select: useCallback(
      (data: RawPlaylistListResponse | undefined) => api.normalize.playlistList(data, server),
      [server],
    ),
    ...options,
  });
};
