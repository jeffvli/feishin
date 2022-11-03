/* eslint-disable no-plusplus */
import { useState, useCallback, useMemo } from 'react';
import { Group, Checkbox } from '@mantine/core';
import { useDebouncedValue, useSetState, useToggle } from '@mantine/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { nanoid } from 'nanoid';
import { RiArrowDownSLine, RiArrowLeftLine } from 'react-icons/ri';
import AutoSizer from 'react-virtualized-auto-sizer';
import { api } from '@/renderer/api';
import { AlbumSort } from '@/renderer/api/albums.api';
import { queryKeys } from '@/renderer/api/query-keys';
import { SortOrder } from '@/renderer/api/types';
import {
  Button,
  DropdownMenu,
  NumberInput,
  ScrollArea,
  Paper,
  Text,
  VirtualGridAutoSizerContainer,
  VirtualGridContainer,
  VirtualInfiniteGrid,
} from '@/renderer/components';
import {
  AdvancedFilterGroup,
  AdvancedFilters,
  FilterGroupType,
  formatAdvancedFiltersQuery,
} from '@/renderer/features/albums/components/advanced-filters';
import { useAlbumList } from '@/renderer/features/albums/queries/use-album-list';
import { useServerList } from '@/renderer/features/servers';
import { AnimatedPage, useServerCredential } from '@/renderer/features/shared';
import { AppRoute } from '@/renderer/router/routes';
import { useAuthStore } from '@/renderer/store';
import { LibraryItem } from '@/renderer/types';
import {
  ViewType,
  ViewTypeButton,
} from '../../library/components/ViewTypeButton';

const FILTERS = [
  { name: 'Title', value: AlbumSort.NAME },
  { name: 'Date added', value: AlbumSort.DATE_ADDED },
  {
    name: 'Date Added (remote)',
    value: AlbumSort.DATE_ADDED_REMOTE,
  },
  { name: 'Release Date', value: AlbumSort.DATE_RELEASED },
  { name: 'Year', value: AlbumSort.DATE_RELEASED_YEAR },
  { name: 'Random', value: AlbumSort.RANDOM },
  { name: 'Favorites', value: AlbumSort.FAVORITE },
  { name: 'Rating', value: AlbumSort.RATING },
];

const ORDER = [
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

  const [isAdvFilter, toggleAdvFilter] = useToggle();
  const [rawAdvFilters, setRawAdvFilters] = useState<AdvancedFilterGroup>({
    group: [],
    rules: [{ field: null, operator: null, uniqueId: nanoid(), value: null }],
    type: FilterGroupType.AND,
    uniqueId: nanoid(),
  });

  const [debouncedAdvFilters] = useDebouncedValue(rawAdvFilters, 300);

  const advancedFilters = useMemo(() => {
    const value = formatAdvancedFiltersQuery(debouncedAdvFilters);
    return encodeURI(JSON.stringify(value));
  }, [debouncedAdvFilters]);

  const serverFolders = useMemo(() => {
    const server = servers?.data.find((server) => server.id === serverId);
    return server?.serverFolders;
  }, [serverId, servers]);

  const { data: albums } = useAlbumList({
    advancedFilters,
    orderBy: filters.orderBy,
    serverFolderId: filters.serverFolderId,
    skip: 0,
    sortBy: filters.sortBy,
    take: 0,
  });

  const fetch = useCallback(
    async ({ skip, take }) => {
      const albums = await queryClient.fetchQuery(
        queryKeys.albums.list(serverId, {
          skip,
          take,
          ...filters,
          advancedFilters,
        }),
        async () =>
          api.albums.getAlbumList(
            { serverId },
            { skip, take, ...filters, advancedFilters }
          )
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
    [
      advancedFilters,
      filters,
      isImageTokenRequired,
      queryClient,
      serverId,
      serverToken,
    ]
  );

  return (
    <AnimatedPage>
      <VirtualGridContainer>
        <Group m={10} position="apart">
          <Group>
            <Text noSelect size="lg">
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
                    color={
                      filter.value === filters.sortBy
                        ? 'var(--primary-color)'
                        : undefined
                    }
                    rightSection={
                      filter.value === filters.sortBy ? (
                        <RiArrowLeftLine />
                      ) : undefined
                    }
                    onClick={() => setFilters({ sortBy: filter.value })}
                  >
                    {filter.name}
                  </DropdownMenu.Item>
                ))}
                <DropdownMenu.Divider />
                <DropdownMenu.Item
                  color={isAdvFilter ? 'var(--primary-color)' : undefined}
                  rightSection={isAdvFilter ? <RiArrowLeftLine /> : undefined}
                  onClick={() => toggleAdvFilter()}
                >
                  Advanced Filters
                </DropdownMenu.Item>
              </DropdownMenu.Dropdown>
            </DropdownMenu>
            <DropdownMenu position="bottom-start">
              <DropdownMenu.Target>
                <Button compact variant="subtle">
                  <Group>
                    {ORDER.find((s) => s.value === filters.orderBy)?.name}{' '}
                    <RiArrowDownSLine size={15} />
                  </Group>
                </Button>
              </DropdownMenu.Target>
              <DropdownMenu.Dropdown>
                {ORDER.map((sort) => (
                  <DropdownMenu.Item
                    key={`sort-${sort.value}`}
                    color={
                      sort.value === filters.orderBy
                        ? 'var(--primary-color)'
                        : undefined
                    }
                    rightSection={
                      sort.value === filters.orderBy ? (
                        <RiArrowLeftLine />
                      ) : undefined
                    }
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
          <Group position="right">
            <ViewTypeButton
              handler={setViewType}
              menuProps={{ position: 'bottom-end' }}
              type={viewType}
            />
          </Group>
        </Group>
        {isAdvFilter && (
          <>
            <Paper sx={{ maxHeight: '20vh' }}>
              <ScrollArea
                my={10}
                px={10}
                sx={{ height: '100%', width: '100%' }}
              >
                <Group noWrap my={10} position="apart">
                  <Group>
                    <Text>Advanced Filters</Text>
                    <NumberInput
                      disabled
                      min={1}
                      placeholder="Limit"
                      size="xs"
                      width={75}
                    />
                  </Group>
                  <Button disabled uppercase>
                    Save as...
                  </Button>
                </Group>
                <AdvancedFilters
                  filters={rawAdvFilters}
                  setFilters={setRawAdvFilters}
                />
              </ScrollArea>
            </Paper>
          </>
        )}
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
                minimumBatchSize={40}
                width={width}
              />
            )}
          </AutoSizer>
        </VirtualGridAutoSizerContainer>
      </VirtualGridContainer>
    </AnimatedPage>
  );
};
