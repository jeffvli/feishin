import { useQuery } from 'react-query';
import { albumsApi } from '../albumsApi';
import { queryKeys } from '../queryKeys';

export const useAlbum = (albumId: number) => {
  return useQuery({
    queryFn: () => albumsApi.getAlbum(albumId),
    queryKey: queryKeys.album(albumId),
  });
};
