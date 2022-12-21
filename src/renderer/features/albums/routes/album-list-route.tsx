/* eslint-disable no-plusplus */
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import AutoSizer from 'react-virtualized-auto-sizer';
import type { ListOnScrollProps } from 'react-window';
import { queryKeys } from '/@/renderer/api/query-keys';
import {
  VirtualGridAutoSizerContainer,
  VirtualGridContainer,
  VirtualInfiniteGrid,
} from '/@/renderer/components';
import { AppRoute } from '/@/renderer/router/routes';
import { useAlbumListStore, useCurrentServer, useSetAlbumStore } from '/@/renderer/store';
import { LibraryItem, CardDisplayType } from '/@/renderer/types';
import { useAlbumList } from '../queries/album-list-query';
import { controller } from '/@/renderer/api/controller';
import { AnimatedPage } from '/@/renderer/features/shared';
import { AlbumListHeader } from '/@/renderer/features/albums/components/album-list-header';
import { api } from '/@/renderer/api';
import { useHandlePlayQueueAdd } from '/@/renderer/features/player/hooks/use-handle-playqueue-add';

const AlbumListRoute = () => {
  const queryClient = useQueryClient();
  const server = useCurrentServer();
  const setPage = useSetAlbumStore();

  const page = useAlbumListStore();
  const handlePlayQueueAdd = useHandlePlayQueueAdd();

  const albumListQuery = useAlbumList({
    limit: 1,
    startIndex: 0,
    ...page.filter,
  });

  const fetch = useCallback(
    async ({ skip, take }: { skip: number; take: number }) => {
      const queryKey = queryKeys.albums.list(server?.id || '', {
        limit: take,
        startIndex: skip,
        ...page.filter,
      });

      const albums = await queryClient.fetchQuery(queryKey, async ({ signal }) =>
        controller.getAlbumList({
          query: {
            limit: take,
            startIndex: skip,
            ...page.filter,
          },
          server,
          signal,
        }),
      );

      return api.normalize.albumList(albums, server);
    },
    [page.filter, queryClient, server],
  );

  const handleGridScroll = useCallback(
    (e: ListOnScrollProps) => {
      setPage({
        list: {
          ...page,
          grid: {
            ...page.grid,
            scrollOffset: e.scrollOffset,
          },
        },
      });
    },
    [page, setPage],
  );

  return (
    <AnimatedPage>
      <VirtualGridContainer>
        <AlbumListHeader />
        <VirtualGridAutoSizerContainer>
          <AutoSizer>
            {({ height, width }) => (
              <VirtualInfiniteGrid
                cardRows={[
                  {
                    property: 'name',
                    route: {
                      route: AppRoute.LIBRARY_ALBUMS_DETAIL,
                      slugs: [{ idProperty: 'id', slugProperty: 'albumId' }],
                    },
                  },
                  {
                    arrayProperty: 'name',
                    property: 'albumArtists',
                    route: {
                      route: AppRoute.LIBRARY_ALBUMARTISTS_DETAIL,
                      slugs: [{ idProperty: 'id', slugProperty: 'albumArtistId' }],
                    },
                  },
                  {
                    property: 'releaseYear',
                  },
                ]}
                display={page.display || CardDisplayType.CARD}
                fetchFn={fetch}
                handlePlayQueueAdd={handlePlayQueueAdd}
                height={height}
                initialScrollOffset={page?.grid.scrollOffset || 0}
                itemCount={albumListQuery?.data?.totalRecordCount || 0}
                itemGap={20}
                itemSize={150 + page.grid?.size}
                itemType={LibraryItem.ALBUM}
                minimumBatchSize={40}
                refresh={page.filter}
                route={{
                  route: AppRoute.LIBRARY_ALBUMS_DETAIL,
                  slugs: [{ idProperty: 'id', slugProperty: 'albumId' }],
                }}
                width={width}
                onScroll={handleGridScroll}
              />
            )}
          </AutoSizer>
        </VirtualGridAutoSizerContainer>
      </VirtualGridContainer>
    </AnimatedPage>
  );
};

export default AlbumListRoute;
