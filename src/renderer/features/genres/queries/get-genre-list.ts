import { useQuery } from '@tanstack/react-query';
import { api } from '@/renderer/api';
import { queryKeys } from '@/renderer/api/query-keys';
import { QueryOptions } from '@/renderer/lib/react-query';
import { useAuthStore } from '@/renderer/store';

export const useGenreList = (options?: QueryOptions) => {
  const serverId = useAuthStore((state) => state.currentServer?.id) || '';

  const query = useQuery({
    enabled: !!serverId,
    queryFn: ({ signal }) => api.genres.getGenreList({ serverId }, signal),
    queryKey: queryKeys.genres.list(serverId),
    staleTime: 1000 * 60 * 60,
    ...options,
  });

  return query;
};
