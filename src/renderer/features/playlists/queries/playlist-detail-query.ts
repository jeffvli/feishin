import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { PlaylistDetailQuery, RawPlaylistDetailResponse } from '/@/renderer/api/types';
import type { QueryOptions } from '/@/renderer/lib/react-query';
import { useCurrentServer } from '/@/renderer/store';
import { api } from '/@/renderer/api';

export const usePlaylistDetail = (query: PlaylistDetailQuery, options?: QueryOptions) => {
  const server = useCurrentServer();

  return useQuery({
    enabled: !!server?.id,
    queryFn: ({ signal }) => api.controller.getPlaylistDetail({ query, server, signal }),
    queryKey: queryKeys.playlists.detail(server?.id || '', query.id, query),
    select: useCallback(
      (data: RawPlaylistDetailResponse | undefined) => api.normalize.playlistDetail(data, server),
      [server],
    ),
    ...options,
  });
};
