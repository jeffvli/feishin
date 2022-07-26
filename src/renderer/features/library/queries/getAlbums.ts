import { useInfiniteQuery, useQuery } from 'react-query';
import { queryKeys } from 'renderer/api/queryKeys';
import { albumsApi, AlbumsRequest } from '../../../api/albumsApi';

export const useAlbums = (params: AlbumsRequest) => {
  return useQuery({
    queryFn: () => albumsApi.getAlbums(params),
    queryKey: queryKeys.albums(),
  });
};

export const useAlbumsInfinite = (params: AlbumsRequest) => {
  return useInfiniteQuery({
    getNextPageParam: (lastPage) => {
      return !!lastPage.pagination.nextPage;
    },
    getPreviousPageParam: (firstPage) => {
      return !!firstPage.pagination.prevPage;
    },
    queryFn: ({ pageParam }) =>
      albumsApi.getAlbums({ ...(pageParam || params) }),
    queryKey: queryKeys.albums(params),
  });
};
