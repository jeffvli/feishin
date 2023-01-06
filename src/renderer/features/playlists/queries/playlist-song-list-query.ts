import { useCallback } from 'react';
import { useQuery, useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { PlaylistSongListQuery, RawSongListResponse } from '/@/renderer/api/types';
import type { InfiniteQueryOptions, QueryOptions } from '/@/renderer/lib/react-query';
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

export const usePlaylistSongListInfinite = (
  query: PlaylistSongListQuery,
  options?: InfiniteQueryOptions,
) => {
  const server = useCurrentServer();

  return useInfiniteQuery({
    enabled: !!server?.id,
    getNextPageParam: (lastPage: RawSongListResponse, allPages) => {
      if (!lastPage?.items) return undefined;
      if (lastPage?.items?.length >= (query?.limit || 50)) {
        return allPages?.length;
      }

      return undefined;
    },
    queryFn: ({ pageParam = 0, signal }) => {
      return api.controller.getPlaylistSongList({
        query: { ...query, limit: query.limit || 50, startIndex: pageParam * (query.limit || 50) },
        server,
        signal,
      });
    },
    queryKey: queryKeys.playlists.detailSongList(server?.id || '', query.id, query),
    select: useCallback(
      (data: InfiniteData<RawSongListResponse | undefined>) => {
        return {
          ...data,
          pages: data.pages.map((page, index) => {
            return { ...api.normalize.songList(page, server), pageIndex: index };
          }),
        };
      },
      [server],
    ),
    ...options,
  });
};
