/* eslint-disable no-plusplus */
import { useRef } from 'react';
import InfiniteLoader from 'react-window-infinite-loader';
import { albumsApi } from 'renderer/api/albumsApi';
import { VirtualInfiniteGrid } from 'renderer/components/virtual-grid/VirtualInfiniteGrid';
import { AnimatedPage } from 'renderer/features/shared/components/AnimatedPage';
import { AppRoute } from 'renderer/router/utils/routes';
import { Item } from 'types';
import { useAlbums } from '../queries/getAlbums';

export const LibraryAlbumsRoute = () => {
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

  return (
    <AnimatedPage>
      {albums && (
        <VirtualInfiniteGrid
          ref={infiniteLoaderRef}
          cardControls={{
            endpoint: albumsApi.getAlbum,
            idProperty: 'id',
            type: Item.Album,
          }}
          cardRows={[
            {
              align: 'center',
              prop: 'name',
              route: {
                prop: 'id',
                route: AppRoute.LIBRARY_ALBUMS_DETAIL,
              },
            },
            {
              align: 'center',
              prop: 'year',
            },
          ]}
          itemCount={albums.pagination.totalEntries}
          itemGap={20}
          itemSize={180}
          query={albumsApi.getAlbums}
          queryParams={params}
        />
      )}
    </AnimatedPage>
  );
};
