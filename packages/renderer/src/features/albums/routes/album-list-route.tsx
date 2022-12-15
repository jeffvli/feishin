/* eslint-disable no-plusplus */
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import AutoSizer from 'react-virtualized-auto-sizer';
import type { ListOnScrollProps } from 'react-window';
import { queryKeys } from '/@/api/query-keys';
import type { Album, AlbumListResponse } from '/@/api/types';
import {
  VirtualGridAutoSizerContainer,
  VirtualGridContainer,
  VirtualInfiniteGrid,
} from '/@/components';
import { AppRoute } from '/@/router/routes';
import { useAlbumRouteStore, useAppStoreActions, useCurrentServer } from '/@/store';
import { LibraryItem, CardDisplayType } from '/@/types';
import { useAlbumList } from '../queries/album-list-query';
import type { NDAlbum } from '/@/api/navidrome.types';
import { controller } from '/@/api/controller';
import { ndNormalize } from '/@/api/navidrome.api';
import { AnimatedPage } from '/@/features/shared';
import { AlbumListHeader } from '/@/features/albums/components/album-list-header';
import { jfNormalize } from '/@/api/jellyfin.api';
import type { JFAlbum } from '/@/api/jellyfin.types';

const AlbumListRoute = () => {
  const queryClient = useQueryClient();
  const server = useCurrentServer();
  const { setPage } = useAppStoreActions();
  const page = useAlbumRouteStore();
  const filters = page.list.filter;

  const albumListQuery = useAlbumList({
    limit: 1,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    startIndex: 0,
  });

  const fetch = useCallback(
    async ({ skip, take }: { skip: number; take: number }) => {
      const queryKey = queryKeys.albums.list(server?.id || '', {
        limit: take,
        startIndex: skip,
        ...filters,
      });

      const albums = await queryClient.fetchQuery(queryKey, async ({ signal }) =>
        controller.getAlbumList({
          query: {
            limit: take,
            sortBy: filters.sortBy,
            sortOrder: filters.sortOrder,
            startIndex: skip,
          },
          server,
          signal,
        }),
      );

      let items: Album[] = [];
      switch (server?.type) {
        case 'jellyfin':
          items = (albums?.items || []).map((a) => {
            return jfNormalize.album(a as JFAlbum, server);
          });
          break;
        case 'navidrome':
          items = (albums?.items || []).map((a) => {
            return ndNormalize.album(a as NDAlbum, server);
          });
          break;
        case 'subsonic':
          break;
      }

      return {
        items,
        startIndex: skip,
        totalRecordCount: albums?.totalRecordCount || 0,
      } as AlbumListResponse;
    },
    [filters, queryClient, server],
  );

  const handleGridScroll = useCallback(
    (e: ListOnScrollProps) => {
      setPage('albums', {
        ...page,
        list: {
          ...page.list,
          gridScrollOffset: e.scrollOffset,
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
                display={page.list?.display || CardDisplayType.CARD}
                fetchFn={fetch}
                height={height}
                initialScrollOffset={page.list?.gridScrollOffset || 0}
                itemCount={albumListQuery?.data?.totalRecordCount || 0}
                itemGap={20}
                itemSize={150 + page.list?.size}
                itemType={LibraryItem.ALBUM}
                minimumBatchSize={40}
                // refresh={advancedFilters}
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
