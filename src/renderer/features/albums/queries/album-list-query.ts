import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { controller } from '/@/renderer/api/controller';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { AlbumListQuery, RawAlbumListResponse } from '/@/renderer/api/types';
import type { QueryOptions } from '/@/renderer/lib/react-query';
import { useCurrentServer } from '/@/renderer/store';
import { api } from '/@/renderer/api';

export const useAlbumList = (query: AlbumListQuery, options?: QueryOptions) => {
  const server = useCurrentServer();

  return useQuery({
    enabled: !!server?.id,
    queryFn: ({ signal }) => controller.getAlbumList({ query, server, signal }),
    queryKey: queryKeys.albums.list(server?.id || '', query),
    select: useCallback(
      (data: RawAlbumListResponse | undefined) => api.normalize.albumList(data, server),
      [server],
    ),
    ...options,
  });
};

// export const useAlbumListInfinite = (params: AlbumListParams, options?: QueryOptions) => {
//   const serverId = useAuthStore((state) => state.currentServer?.id) || '';

//   return useInfiniteQuery({
//     enabled: !!serverId,
//     getNextPageParam: (lastPage: AlbumListResponse) => {
//       return !!lastPage.pagination.nextPage;
//     },
//     getPreviousPageParam: (firstPage: AlbumListResponse) => {
//       return !!firstPage.pagination.prevPage;
//     },
//     queryFn: ({ pageParam }) => api.albums.getAlbumList({ serverId }, { ...(pageParam || params) }),
//     queryKey: queryKeys.albums.list(serverId, params),
//     ...options,
//   });
// };
