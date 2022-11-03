import { useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '@/renderer/api';
import { GenreListResponse } from '@/renderer/api/genres.api';
import { queryKeys } from '@/renderer/api/query-keys';
import { ApiError } from '@/renderer/api/types';
import { QueryOptions } from '@/renderer/lib/react-query';
import { useAuthStore } from '@/renderer/store';

export const useGenreList = (options?: QueryOptions<GenreListResponse>) => {
  const serverId = useAuthStore((state) => state.currentServer?.id) || '';

  const query = useQuery<GenreListResponse, AxiosError<ApiError>>({
    enabled: !!serverId,
    queryFn: ({ signal }) => api.genres.getGenreList({ serverId }, signal),
    queryKey: queryKeys.genres.list(serverId),
    staleTime: Infinity,
    ...options,
  });

  return query;
};
