import { useQuery } from '@tanstack/react-query';
import { controller } from '/@/renderer/api/controller';
import { queryKeys } from '/@/renderer/api/query-keys';
import type { AlbumListQuery } from '/@/renderer/api/types';
import type { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';

export const useAlbumList = (args: QueryHookArgs<AlbumListQuery>) => {
  const { options, query, serverId } = args;
  const server = getServerById(serverId);

  return useQuery({
    enabled: !!serverId,
    queryFn: ({ signal }) => {
      if (!server) throw new Error('Server not found');
      return controller.getAlbumList({
        apiClientProps: {
          server,
          signal,
        },
        query,
      });
    },
    queryKey: queryKeys.albums.list(serverId || '', query),
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
