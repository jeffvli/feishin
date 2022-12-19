import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { controller } from '/@/renderer/api/controller';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { RawSongListResponse, SongListQuery } from '/@/renderer/api/types';
import { useCurrentServer } from '/@/renderer/store';
import { api } from '/@/renderer/api';
import type { QueryOptions } from '/@/renderer/lib/react-query';

export const useSongList = (query: SongListQuery, options?: QueryOptions) => {
  const server = useCurrentServer();

  return useQuery({
    enabled: !!server?.id,
    queryFn: ({ signal }) => controller.getSongList({ query, server, signal }),
    queryKey: queryKeys.songs.list(server?.id || '', query),
    select: useCallback(
      (data: RawSongListResponse | undefined) => api.normalize.songList(data, server),
      [server],
    ),
    ...options,
  });
};
