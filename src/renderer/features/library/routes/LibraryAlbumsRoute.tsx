/* eslint-disable no-plusplus */
import { useState } from 'react';
import { Button, Group, Menu } from '@mantine/core';
import { useSetState } from '@mantine/hooks';
import AutoSizer from 'react-virtualized-auto-sizer';
import i18n from 'i18n/i18n';
import { albumsApi } from 'renderer/api/albumsApi';
import { VirtualInfiniteGrid } from 'renderer/components/virtual-grid/VirtualInfiniteGrid';
import { AnimatedPage } from 'renderer/features/shared/components/AnimatedPage';
import { AppRoute } from 'renderer/router/utils/routes';
import { Item } from 'types';
import { ViewType, ViewTypeButton } from '../components/ViewTypeButton';
import { useAlbums } from '../queries/getAlbums';

export enum AlbumSort {
  DATE_ADDED = 'date_added',
  DATE_ADDED_REMOTE = 'date_added_remote',
  DATE_PLAYED = 'date_played',
  DATE_RELEASED = 'date_released',
  RANDOM = 'random',
  RATING = 'rating',
  TITLE = 'title',
  YEAR = 'year',
}

const FILTERS = [
  { name: i18n.t('filters.dateAdded'), value: AlbumSort.DATE_ADDED },
  {
    name: i18n.t('filters.dateAddedRemote'),
    value: AlbumSort.DATE_ADDED_REMOTE,
  },
  { name: i18n.t('filters.datePlayed'), value: AlbumSort.DATE_PLAYED },
  { name: i18n.t('filters.dateReleased'), value: AlbumSort.DATE_RELEASED },
  { name: i18n.t('filters.random'), value: AlbumSort.RANDOM },
  { name: i18n.t('filters.rating'), value: AlbumSort.RATING },
  { name: i18n.t('filters.title'), value: AlbumSort.TITLE },
  { name: i18n.t('filters.year'), value: AlbumSort.YEAR },
];

export const LibraryAlbumsRoute = () => {
  const [viewType, setViewType] = useState(ViewType.Grid);
  const [filters, setFilters] = useSetState({
    orderBy: 'asc',
    sortBy: AlbumSort.TITLE,
  });

  const { data: albums } = useAlbums({
    skip: 0,
    take: 0,
    ...filters,
  });

  return (
    <AnimatedPage>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Group mb={10} position="apart">
          <Menu position="bottom-start">
            <Menu.Target>
              <Button variant="subtle">
                {
                  FILTERS.find((filter) => filter.value === filters.sortBy)
                    ?.name
                }
              </Button>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                onClick={() => setFilters({ sortBy: AlbumSort.TITLE })}
              >
                Title
              </Menu.Item>
              <Menu.Item onClick={() => setFilters({ sortBy: AlbumSort.YEAR })}>
                Year
              </Menu.Item>
              <Menu.Item
                onClick={() => setFilters({ sortBy: AlbumSort.RATING })}
              >
                Rating
              </Menu.Item>
              <Menu.Item
                onClick={() => setFilters({ sortBy: AlbumSort.DATE_RELEASED })}
              >
                Date Released
              </Menu.Item>
              <Menu.Item
                onClick={() => setFilters({ sortBy: AlbumSort.DATE_ADDED })}
              >
                Date Added
              </Menu.Item>
              <Menu.Item
                onClick={() =>
                  setFilters({ sortBy: AlbumSort.DATE_ADDED_REMOTE })
                }
              >
                Date Added (Remote)
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>

          <ViewTypeButton
            handler={setViewType}
            menuProps={{ position: 'bottom-end' }}
            type={viewType}
          />
        </Group>
        <div style={{ flex: 1 }}>
          {albums && (
            <AutoSizer>
              {({ height, width }) => (
                <VirtualInfiniteGrid
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
                  height={height}
                  itemCount={albums.pagination.totalEntries}
                  itemGap={20}
                  itemSize={180}
                  minimumBatchSize={100}
                  query={albumsApi.getAlbums}
                  queryParams={filters}
                  width={width}
                />
              )}
            </AutoSizer>
          )}
        </div>
      </div>
    </AnimatedPage>
  );
};
