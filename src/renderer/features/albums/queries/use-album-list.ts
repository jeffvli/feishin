import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from '@/renderer/api';
import { AlbumListParams } from '@/renderer/api/albums.api';
import { queryKeys } from '@/renderer/api/query-keys';
import { useAuthStore } from '@/renderer/store';
import { AlbumListResponse } from 'renderer/api/types';

export const useAlbumList = (params: AlbumListParams) => {
  const serverId = useAuthStore((state) => state.currentServer?.id) || '';

  return useQuery({
    enabled: !!serverId,
    queryFn: () => api.albums.getAlbumList({ serverId }, params),
    queryKey: queryKeys.albums.list(serverId, params),
  });
};

export const useAlbumListInfinite = (params: AlbumListParams) => {
  const serverId = useAuthStore((state) => state.currentServer?.id) || '';

  return useInfiniteQuery({
    enabled: !!serverId,
    getNextPageParam: (lastPage: AlbumListResponse) => {
      return !!lastPage.pagination.nextPage;
    },
    getPreviousPageParam: (firstPage: AlbumListResponse) => {
      return !!firstPage.pagination.prevPage;
    },
    queryFn: ({ pageParam }) =>
      api.albums.getAlbumList({ serverId }, { ...(pageParam || params) }),
    queryKey: queryKeys.albums.list(serverId, params),
  });
};
