/* eslint-disable no-plusplus */
import { useState, useCallback, useMemo } from 'react';
import { Group, Checkbox } from '@mantine/core';
import { useSetState } from '@mantine/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { RiArrowDownSLine } from 'react-icons/ri';
import AutoSizer from 'react-virtualized-auto-sizer';
import { api } from '@/renderer/api';
import { AlbumSort } from '@/renderer/api/albums.api';
import { queryKeys } from '@/renderer/api/query-keys';
import { SortOrder } from '@/renderer/api/types';
import {
  Button,
  DropdownMenu,
  Text,
  VirtualGridAutoSizerContainer,
  VirtualGridContainer,
  VirtualInfiniteGrid,
} from '@/renderer/components';
import { useAlbumList } from '@/renderer/features/albums/queries/use-album-list';
import { useServerList } from '@/renderer/features/servers';
import { AnimatedPage, useServerCredential } from '@/renderer/features/shared';
import { AppRoute } from '@/renderer/router/routes';
import { useAuthStore } from '@/renderer/store';
import { Font } from '@/renderer/styles';
import { LibraryItem } from '@/renderer/types';
import {
  ViewType,
  ViewTypeButton,
} from '../../library/components/ViewTypeButton';

const FILTERS = [
  { name: 'Date added', value: AlbumSort.DATE_ADDED },
  {
    name: 'Date added (remote)',
    value: AlbumSort.DATE_ADDED_REMOTE,
  },
  { name: 'Date released', value: AlbumSort.DATE_RELEASED },
  { name: 'Favorites', value: AlbumSort.FAVORITE },
  { name: 'Random', value: AlbumSort.RANDOM },
  { name: 'Rating', value: AlbumSort.RATING },
  { name: 'Title', value: AlbumSort.NAME },
  { name: 'Year', value: AlbumSort.DATE_RELEASED_YEAR },
];

const SORT = [
  { name: 'Ascending', value: SortOrder.ASC },
  { name: 'Descending', value: SortOrder.DESC },
];

export const AlbumListRoute = () => {
  const queryClient = useQueryClient();
  const { serverToken, isImageTokenRequired } = useServerCredential();
  const serverId = useAuthStore((state) => state.currentServer?.id) || '';
  const { data: servers } = useServerList({ enabled: true });
  const [viewType, setViewType] = useState(ViewType.Grid);
  const [filters, setFilters] = useSetState({
    orderBy: SortOrder.ASC,
    serverFolderId: [] as string[],
    sortBy: AlbumSort.NAME,
  });

  const serverFolders = useMemo(() => {
    const server = servers?.data.find((server) => server.id === serverId);
    return server?.serverFolders;
  }, [serverId, servers]);

  const { data: albums } = useAlbumList({
    orderBy: filters.orderBy,
    serverFolderId: filters.serverFolderId,
    skip: 0,
    sortBy: filters.sortBy,
    take: 0,
  });

  const fetch = useCallback(
    async ({ skip, take }) => {
      const albums = await queryClient.fetchQuery(
        queryKeys.albums.list(serverId, { skip, take, ...filters }),
        async () =>
          api.albums.getAlbumList({ serverId }, { skip, take, ...filters })
      );

      // * Adds server token
      if (isImageTokenRequired) {
        const t = albums.data.map((album) => {
          return {
            ...album,
            imageUrl: album?.imageUrl + serverToken!,
          };
        });

        return { ...albums, data: t };
      }

      return albums;
    },
    [filters, isImageTokenRequired, queryClient, serverId, serverToken]
  );

  return (
    <AnimatedPage>
      <VirtualGridContainer>
        <Group m={10} position="apart">
          <Group>
            <Text font={Font.POPPINS} size="lg">
              Albums
            </Text>
            <DropdownMenu position="bottom-start">
              <DropdownMenu.Target>
                <Button compact variant="subtle">
                  <Group>
                    {FILTERS.find((f) => f.value === filters.sortBy)?.name}{' '}
                    <RiArrowDownSLine size={15} />
                  </Group>
                </Button>
              </DropdownMenu.Target>
              <DropdownMenu.Dropdown>
                {FILTERS.map((filter) => (
                  <DropdownMenu.Item
                    key={`filter-${filter.value}`}
                    onClick={() => setFilters({ sortBy: filter.value })}
                  >
                    {filter.name}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Dropdown>
            </DropdownMenu>
            <DropdownMenu position="bottom-start">
              <DropdownMenu.Target>
                <Button compact variant="subtle">
                  <Group>
                    {SORT.find((s) => s.value === filters.orderBy)?.name}{' '}
                    <RiArrowDownSLine size={15} />
                  </Group>
                </Button>
              </DropdownMenu.Target>
              <DropdownMenu.Dropdown>
                {SORT.map((sort) => (
                  <DropdownMenu.Item
                    key={`sort-${sort.value}`}
                    onClick={() => setFilters({ orderBy: sort.value })}
                  >
                    {sort.name}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Dropdown>
            </DropdownMenu>
            <DropdownMenu position="bottom-start">
              <DropdownMenu.Target>
                <Button compact variant="subtle">
                  <Group>
                    Folders <RiArrowDownSLine size={15} />
                  </Group>
                </Button>
              </DropdownMenu.Target>
              <DropdownMenu.Dropdown>
                <Checkbox.Group
                  orientation="vertical"
                  value={filters.serverFolderId}
                  onChange={(e) => setFilters({ serverFolderId: e })}
                >
                  {serverFolders?.map((folder) => (
                    <Checkbox
                      key={folder.id}
                      label={folder.name}
                      value={folder.id}
                    />
                  ))}
                </Checkbox.Group>
              </DropdownMenu.Dropdown>
            </DropdownMenu>
          </Group>
          <ViewTypeButton
            handler={setViewType}
            menuProps={{ position: 'bottom-end' }}
            type={viewType}
          />
        </Group>
        <VirtualGridAutoSizerContainer>
          <AutoSizer>
            {({ height, width }) => (
              <VirtualInfiniteGrid
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
                    prop: 'releaseYear',
                  },
                ]}
                fetchFn={fetch}
                height={height}
                itemCount={albums?.pagination.totalEntries || 0}
                itemGap={20}
                itemSize={200}
                itemType={LibraryItem.ALBUM}
                minimumBatchSize={100}
                width={width}
              />
            )}
          </AutoSizer>
        </VirtualGridAutoSizerContainer>
      </VirtualGridContainer>
    </AnimatedPage>
  );
};
