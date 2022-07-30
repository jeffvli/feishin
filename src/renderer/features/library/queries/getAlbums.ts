import { useInfiniteQuery, useQuery } from 'react-query';
import { queryKeys } from 'renderer/api/queryKeys';
import { AlbumsResponse } from 'renderer/api/types';
import { albumsApi, AlbumsRequest } from '../../../api/albumsApi';

export const useAlbums = (params: AlbumsRequest) => {
  return useQuery({
    queryFn: () => albumsApi.getAlbums(params),
    queryKey: queryKeys.albums(params),
  });
};

export const useAlbumsInfinite = (params: AlbumsRequest) => {
  return useInfiniteQuery({
    getNextPageParam: (lastPage: AlbumsResponse) => {
      return !!lastPage.pagination.nextPage;
    },
    getPreviousPageParam: (firstPage: AlbumsResponse) => {
      return !!firstPage.pagination.prevPage;
    },
    queryFn: ({ pageParam }) =>
      albumsApi.getAlbums({ ...(pageParam || params) }),
    queryKey: queryKeys.albums(params),
  });
};
