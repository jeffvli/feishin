import { useQuery } from '@tanstack/react-query';
import { controller } from '/@/renderer/api/controller';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { GenreListQuery } from '/@/renderer/api/types';
import type { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';

export const useGenreList = (args: QueryHookArgs<GenreListQuery>) => {
  const { options, query, serverId } = args || {};
  const server = getServerById(serverId);

  return useQuery({
    cacheTime: 1000 * 60 * 60 * 2,
    enabled: !!server,
    queryFn: ({ signal }) => {
      if (!server) throw new Error('Server not found');
      return controller.getGenreList({ apiClientProps: { server, signal }, query });
    },
    queryKey: queryKeys.genres.list(server?.id || ''),
    staleTime: 1000 * 60 * 60,
    ...options,
  });
};
