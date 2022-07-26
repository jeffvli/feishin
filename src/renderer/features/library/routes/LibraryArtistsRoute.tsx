/* eslint-disable no-plusplus */
import { useRef } from 'react';
import InfiniteLoader from 'react-window-infinite-loader';
import { AnimatedPage } from 'renderer/features/shared/components/AnimatedPage';
import { useAlbums } from '../queries/getAlbums';

export const LibraryArtistsRoute = () => {
  const infiniteLoaderRef = useRef<InfiniteLoader>(null);

  const params = {
    orderBy: 'asc',
    sortBy: 'title',
  };

  const { data: albums } = useAlbums({
    limit: 0,
    page: 0,
    ...params,
  });

  return <AnimatedPage />;
};
