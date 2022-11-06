/* eslint-disable no-plusplus */
import { useState, useCallback, useMemo } from 'react';
import { Group, Box, Slider } from '@mantine/core';
import { useDebouncedValue, useSetState, useToggle } from '@mantine/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import throttle from 'lodash/throttle';
import { nanoid } from 'nanoid';
import {
  RiArrowDownSLine,
  RiDeleteBack2Fill,
  RiSettings2Fill,
} from 'react-icons/ri';
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
  encodeAdvancedFiltersQuery,
} from '@/renderer/features/albums/components/advanced-filters';
import { useAlbumList } from '@/renderer/features/albums/queries/use-album-list';
import { useServerList } from '@/renderer/features/servers';
import { AnimatedPage, useServerCredential } from '@/renderer/features/shared';
import { AppRoute } from '@/renderer/router/routes';
import { useAppStore, useAuthStore } from '@/renderer/store';
import { LibraryItem, CardDisplayType } from '@/renderer/types';

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

const DEFAULT_ADVANCED_FILTERS = {
  group: [],
  rules: [
    {
      field: '',
      operator: '',
      uniqueId: nanoid(),
      value: '',
    },
  ],
  type: FilterGroupType.AND,
  uniqueId: nanoid(),
};

export const AlbumListRoute = () => {
  const queryClient = useQueryClient();
  const { serverToken, isImageTokenRequired } = useServerCredential();
  const page = useAppStore((state) => state.albums);
  const setPage = useAppStore((state) => state.setPage);
  const serverId = useAuthStore((state) => state.currentServer?.id) || '';
  const { data: servers } = useServerList({ enabled: true });
  const [filters, setFilters] = useSetState({
    orderBy: SortOrder.ASC,
    serverFolderId: [] as string[],
    sortBy: AlbumSort.NAME,
  });

  const [isAdvFilter, toggleAdvFilter] = useToggle();
  const [rawAdvFilters, setRawAdvFilters] = useState<AdvancedFilterGroup>(
    DEFAULT_ADVANCED_FILTERS
  );

  const [debouncedAdvFilters] = useDebouncedValue(rawAdvFilters, 500);

  const advancedFilters = useMemo(() => {
    if (!isAdvFilter) {
      return encodeAdvancedFiltersQuery(DEFAULT_ADVANCED_FILTERS);
    }

    return encodeAdvancedFiltersQuery(debouncedAdvFilters);
  }, [debouncedAdvFilters, isAdvFilter]);

  const handleResetAdvancedFilters = () => {
    setRawAdvFilters(DEFAULT_ADVANCED_FILTERS);
  };

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
    async ({ skip, take }: { skip: number; take: number }) => {
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
        const data = albums.data.map((album) => {
          return {
            ...album,
            imageUrl: album.imageUrl && album.imageUrl + serverToken!,
          };
        });

        return { ...albums, data };
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

  const setSize = throttle(
    (e: number) =>
      setPage('albums', {
        ...page,
        list: { ...page.list, size: e },
      }),
    200
  );

  return (
    <AnimatedPage>
      <VirtualGridContainer>
        <Group m={10} position="apart">
          <Group>
            <Text $noSelect size="lg">
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
                    $isActive={filter.value === filters.sortBy}
                    onClick={() => setFilters({ sortBy: filter.value })}
                  >
                    {filter.name}
                  </DropdownMenu.Item>
                ))}
                <DropdownMenu.Divider />
                <DropdownMenu.Item
                  $isActive={isAdvFilter}
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
                    $isActive={sort.value === filters.orderBy}
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
                {serverFolders?.map((folder) => (
                  <DropdownMenu.Item
                    key={folder.id}
                    $isActive={filters.serverFolderId.includes(folder.id)}
                    closeMenuOnClick={false}
                    onClick={() => {
                      if (filters.serverFolderId.includes(folder.id)) {
                        setFilters({
                          serverFolderId: filters.serverFolderId.filter(
                            (id) => id !== folder.id
                          ),
                        });
                      } else {
                        setFilters({
                          serverFolderId: [
                            ...filters.serverFolderId,
                            folder.id,
                          ],
                        });
                      }
                    }}
                  >
                    {folder.name}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Dropdown>
            </DropdownMenu>
          </Group>
          <Group position="right">
            <DropdownMenu position="bottom-end" width={100}>
              <DropdownMenu.Target>
                <Button compact variant="subtle">
                  <RiSettings2Fill size={15} />
                </Button>
              </DropdownMenu.Target>
              <DropdownMenu.Dropdown>
                <DropdownMenu.Item>
                  <Slider
                    defaultValue={page.list?.size || 0}
                    label={null}
                    onChange={setSize}
                  />
                </DropdownMenu.Item>
                <DropdownMenu.Divider />
                <DropdownMenu.Item
                  $isActive={
                    page.list.type === 'grid' &&
                    page.list.display === CardDisplayType.CARD
                  }
                  onClick={() =>
                    setPage('albums', {
                      ...page,
                      list: {
                        ...page.list,
                        display: CardDisplayType.CARD,
                        type: 'grid',
                      },
                    })
                  }
                >
                  Card
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  $isActive={
                    page.list.type === 'grid' &&
                    page.list.display === CardDisplayType.POSTER
                  }
                  onClick={() =>
                    setPage('albums', {
                      ...page,
                      list: {
                        ...page.list,
                        display: CardDisplayType.POSTER,
                        type: 'grid',
                      },
                    })
                  }
                >
                  Poster
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  disabled
                  $isActive={page.list.type === 'list'}
                  onClick={() =>
                    setPage('albums', {
                      ...page,
                      list: {
                        ...page.list,
                        type: 'list',
                      },
                    })
                  }
                >
                  List
                </DropdownMenu.Item>
              </DropdownMenu.Dropdown>
            </DropdownMenu>
          </Group>
        </Group>
        <AnimatePresence
          key="album-list-advanced-filter"
          exitBeforeEnter
          initial={false}
        >
          {isAdvFilter && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -25 }}
              initial={{ opacity: 0, y: -25 }}
              style={{ maxHeight: '20vh', zIndex: 100 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              <Paper
                sx={{
                  boxShadow: ' 0 10px 5px -2px rgb(0, 0, 0, .2)',
                  height: '100%',
                  position: 'relative',
                }}
              >
                <ScrollArea sx={{ height: '100%', width: '100%' }}>
                  <Group
                    noWrap
                    p={10}
                    position="apart"
                    sx={{
                      background: 'var(--paper-bg)',
                      position: 'sticky',
                      top: 0,
                      zIndex: 50,
                    }}
                  >
                    <Group>
                      <Text $noSelect>Advanced Filters</Text>
                      <NumberInput
                        disabled
                        min={1}
                        placeholder="Limit"
                        size="xs"
                        width={75}
                      />
                      <Button
                        px={10}
                        size="xs"
                        tooltip={{ label: 'Reset' }}
                        variant="default"
                        onClick={handleResetAdvancedFilters}
                      >
                        <RiDeleteBack2Fill size={15} />
                      </Button>
                    </Group>
                    <Button disabled uppercase variant="default">
                      Save as...
                    </Button>
                  </Group>
                  <Box p={10}>
                    <AdvancedFilters
                      filters={rawAdvFilters}
                      setFilters={setRawAdvFilters}
                    />
                  </Box>
                </ScrollArea>
              </Paper>
            </motion.div>
          )}
        </AnimatePresence>
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
                      slugs: [
                        { idProperty: 'id', slugProperty: 'albumArtistId' },
                      ],
                    },
                  },
                  {
                    property: 'releaseYear',
                  },
                ]}
                display={page.list?.display || CardDisplayType.CARD}
                fetchFn={fetch}
                height={height}
                itemCount={albums?.pagination.totalEntries || 0}
                itemGap={20}
                itemSize={150 + page.list?.size}
                itemType={LibraryItem.ALBUM}
                minimumBatchSize={40}
                refresh={advancedFilters}
                route={{
                  route: AppRoute.LIBRARY_ALBUMS_DETAIL,
                  slugs: [{ idProperty: 'id', slugProperty: 'albumId' }],
                }}
                width={width}
              />
            )}
          </AutoSizer>
        </VirtualGridAutoSizerContainer>
      </VirtualGridContainer>
    </AnimatedPage>
  );
};
