import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { PlaylistSongListQuery, RawSongListResponse } from '/@/renderer/api/types';
import type { QueryOptions } from '/@/renderer/lib/react-query';
import { useCurrentServer } from '/@/renderer/store';
import { api } from '/@/renderer/api';

export const usePlaylistSongList = (query: PlaylistSongListQuery, options?: QueryOptions) => {
  const server = useCurrentServer();

  return useQuery({
    enabled: !!server?.id,
    queryFn: ({ signal }) => api.controller.getPlaylistSongList({ query, server, signal }),
    queryKey: queryKeys.playlists.songList(server?.id || '', query.id, query),
    select: useCallback(
      (data: RawSongListResponse | undefined) => api.normalize.songList(data, server),
      [server],
    ),
    ...options,
  });
};
