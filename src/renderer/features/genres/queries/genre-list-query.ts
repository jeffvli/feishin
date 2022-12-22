import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { controller } from '/@/renderer/api/controller';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { GenreListQuery, RawGenreListResponse } from '/@/renderer/api/types';
import type { QueryOptions } from '/@/renderer/lib/react-query';
import { useCurrentServer } from '/@/renderer/store';
import { api } from '/@/renderer/api';

export const useGenreList = (query: GenreListQuery, options?: QueryOptions) => {
  const server = useCurrentServer();

  return useQuery({
    cacheTime: 1000 * 60 * 60 * 2,
    enabled: !!server?.id,
    queryFn: ({ signal }) => controller.getGenreList({ query, server, signal }),
    queryKey: queryKeys.genres.list(server?.id || ''),
    select: useCallback(
      (data: RawGenreListResponse | undefined) => api.normalize.genreList(data, server),
      [server],
    ),
    staleTime: 1000 * 60 * 60,
    ...options,
  });
};
