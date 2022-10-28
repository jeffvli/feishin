import { useQuery } from '@tanstack/react-query';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';
import { QueryOptions } from '@/renderer/lib/react-query';
import { useAuthStore } from '@/renderer/store';
import { AlbumDetailResponse } from 'renderer/api/types';

export const useAlbumDetail = (
  query: { albumId: string },
  options: QueryOptions<AlbumDetailResponse>
) => {
  const serverId = useAuthStore((state) => state.currentServer?.id) || '';

  return useQuery({
    enabled: !!serverId,
    queryFn: ({ signal }) =>
      api.albums.getAlbumDetail({ albumId: query.albumId, serverId }, signal),
    queryKey: queryKeys.albums.detail(query.albumId),
    ...options,
  });
};
