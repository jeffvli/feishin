/* eslint-disable no-plusplus */
import { AnimatedPage } from '../../shared/components/AnimatedPage';
import { useAlbums } from '../queries/getAlbums';

export const LibraryArtistsRoute = () => {
  const params = {
    orderBy: 'asc',
    sortBy: 'title',
  };

  const { data: albums } = useAlbums({
    skip: 0,
    take: 0,
    ...params,
  });

  return <AnimatedPage>Temp</AnimatedPage>;
};
