import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '/@/api/query-keys';
import type { QueryOptions } from '/@/lib/react-query';
import { useCurrentServer } from '../../../store/auth.store';
import { apiController } from '/@/api/controller';
import type { AlbumDetailQuery } from '/@/api/types';

export const useAlbumDetail = (query: AlbumDetailQuery, options: QueryOptions) => {
  const server = useCurrentServer();

  return useQuery({
    queryFn: ({ signal }) => apiController.getAlbumDetail(query, signal),
    queryKey: queryKeys.albums.detail(server?.id || '', query),
    ...options,
  });
};
