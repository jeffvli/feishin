import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiController } from '/@/api/controller';
import { queryKeys } from '/@/api/query-keys';
import type { AlbumListParams, AlbumListResponse } from '/@/api/types';
import type { QueryOptions } from '/@/lib/react-query';
import { useCurrentServer, useCurrentServerId } from '/@/store';
import { ndNormalize } from '/@/api/navidrome.api';
import type { NDAlbum } from '/@/api/navidrome.types';

export const useAlbumList = (params: AlbumListParams, options?: QueryOptions) => {
  const serverId = useCurrentServerId();
  const server = useCurrentServer();

  return useQuery({
    enabled: !!serverId,
    queryFn: ({ signal }) => apiController.getAlbumList(params, signal),
    queryKey: queryKeys.albums.list(serverId, params),
    select: useCallback(
      (data: AlbumListResponse) => {
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
          ...data,
          items: albums,
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
