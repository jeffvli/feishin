import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { controller } from '/@/api/controller';
import { queryKeys } from '/@/api/query-keys';
import type { AlbumListQuery, RawAlbumListResponse } from '/@/api/types';
import type { QueryOptions } from '/@/lib/react-query';
import { useCurrentServer } from '/@/store';
import { ndNormalize } from '/@/api/navidrome.api';
import type { NDAlbum } from '/@/api/navidrome.types';

export const useAlbumList = (query: AlbumListQuery, options?: QueryOptions) => {
  const server = useCurrentServer();

  return useQuery({
    enabled: !!server?.id,
    queryFn: ({ signal }) => controller.getAlbumList({ query, server, signal }),
    queryKey: queryKeys.albums.list(server?.id || '', query),
    select: useCallback(
      (data: RawAlbumListResponse | undefined) => {
        let albums;
        switch (server?.type) {
          case 'jellyfin':
            break;
          case 'navidrome':
            albums = data?.items.map((item) => ndNormalize.album(item as NDAlbum, server));
            break;
          case 'subsonic':
            break;
        }

        return {
          items: albums,
          startIndex: data?.startIndex,
          totalRecordCount: data?.totalRecordCount,
        };
      },
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
