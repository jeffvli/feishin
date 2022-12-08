/* eslint-disable no-plusplus */
import type { MouseEvent } from 'react';
import { useCallback } from 'react';
import { Group } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import debounce from 'lodash/debounce';
import throttle from 'lodash/throttle';
import { RiArrowDownSLine, RiSettings2Fill } from 'react-icons/ri';
import AutoSizer from 'react-virtualized-auto-sizer';
import type { ListOnScrollProps } from 'react-window';
import { queryKeys } from '/@/api/query-keys';
import type { Album, AlbumListResponse, AlbumListSort } from '/@/api/types';
import { SortOrder } from '/@/api/types';
import {
  Button,
  DropdownMenu,
  Slider,
  Text,
  VirtualGridAutoSizerContainer,
  VirtualGridContainer,
  VirtualInfiniteGrid,
} from '/@/components';
import { AnimatedPage } from '/@/features/shared';
import { AppRoute } from '/@/router/routes';
import { useAlbumRouteStore, useAppStoreActions, useCurrentServer } from '/@/store';
import { LibraryItem, CardDisplayType } from '/@/types';
import { useAlbumList } from '../queries/album-list-query';
import { JFAlbumListSort } from '/@/api/jellyfin.types';
import type { NDAlbum } from '/@/api/navidrome.types';
import { NDAlbumListSort } from '/@/api/navidrome.types';
import { apiController } from '/@/api/controller';
import { ndNormalize } from '/@/api/navidrome.api';

const FILTERS = {
  jellyfin: [
    { name: 'Album Artist', value: JFAlbumListSort.NAME },
    { name: 'Community Rating', value: JFAlbumListSort.RATING },
    { name: 'Critic Rating', value: JFAlbumListSort.CRITIC_RATING },
    { name: 'Name', value: JFAlbumListSort.NAME },
    { name: 'Random', value: JFAlbumListSort.RANDOM },
    { name: 'Recently Added', value: JFAlbumListSort.RECENTLY_ADDED },
    { name: 'Release Date', value: JFAlbumListSort.RELEASE_DATE },
  ],
  navidrome: [
    { name: 'Album Artist', value: NDAlbumListSort.ALBUM_ARTIST },
    { name: 'Artist', value: NDAlbumListSort.ARTIST },
    { name: 'Duration', value: NDAlbumListSort.DURATION },
    { name: 'Name', value: NDAlbumListSort.NAME },
    { name: 'Play Count', value: NDAlbumListSort.PLAY_COUNT },
    { name: 'Random', value: NDAlbumListSort.RANDOM },
    { name: 'Rating', value: NDAlbumListSort.RATING },
    { name: 'Recently Added', value: NDAlbumListSort.RECENTLY_ADDED },
    { name: 'Song Count', value: NDAlbumListSort.SONG_COUNT },
    { name: 'Starred', value: NDAlbumListSort.STARRED },
    { name: 'Year', value: NDAlbumListSort.YEAR },
  ],
};

const ORDER = [
  { name: 'Ascending', value: SortOrder.ASC },
  { name: 'Descending', value: SortOrder.DESC },
];

export const AlbumListRoute = () => {
  const queryClient = useQueryClient();
  const server = useCurrentServer();
  const { setPage } = useAppStoreActions();
  const page = useAlbumRouteStore();
  const filters = page.list.filter;

  const albumListQuery = useAlbumList({
    _skip: 0,
    _take: 1,
    musicFolderId: null,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const fetch = useCallback(
    async ({ skip, take }: { skip: number; take: number }) => {
      const queryKey = queryKeys.albums.list(server?.id || '', {
        _skip: skip,
        _take: take,
        ...filters,
      });

      const albums = await queryClient.fetchQuery(queryKey, async () =>
        apiController.getAlbumList({
          _skip: skip,
          _take: take,
          musicFolderId: null,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        }),
      );

      let items: Album[] = [];
      switch (server?.type) {
        case 'jellyfin':
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
        pagination: {
          startIndex: skip,
          totalEntries: albums?.pagination?.totalEntries || 0,
        },
      } as AlbumListResponse;
    },
    [filters, queryClient, server],
  );

  const setSize = throttle(
    (e: number) =>
      setPage('albums', {
        ...page,
        list: { ...page.list, size: e },
      }),
    200,
  );

  const handleSetFilter = (e: MouseEvent<HTMLButtonElement>) => {
    if (!e.currentTarget?.value) return;
    setPage('albums', {
      list: {
        ...page.list,
        filter: {
          ...page.list.filter,
          sortBy: e.currentTarget.value as AlbumListSort,
        },
      },
    });
  };

  const handleSetOrder = (e: MouseEvent<HTMLButtonElement>) => {
    if (!e.currentTarget?.value) return;
    setPage('albums', {
      list: {
        ...page.list,
        filter: {
          ...page.list.filter,
          sortOrder: e.currentTarget.value as SortOrder,
        },
      },
    });
  };

  const handleSetViewType = (e: MouseEvent<HTMLButtonElement>) => {
    if (!e.currentTarget?.value) return;
    const type = e.currentTarget.value;
    if (type === CardDisplayType.CARD) {
      setPage('albums', {
        ...page,
        list: {
          ...page.list,
          display: CardDisplayType.CARD,
          type: 'grid',
        },
      });
    } else if (type === CardDisplayType.POSTER) {
      setPage('albums', {
        ...page,
        list: {
          ...page.list,
          display: CardDisplayType.POSTER,
          type: 'grid',
        },
      });
    } else {
      setPage('albums', {
        ...page,
        list: {
          ...page.list,
          type: 'list',
        },
      });
    }
  };

  const handleGridScroll = debounce((e: ListOnScrollProps) => {
    setPage('albums', {
      ...page,
      list: {
        ...page.list,
        gridScrollOffset: e.scrollOffset,
      },
    });
  }, 300);

  const sortByLabel = server?.type
    ? (FILTERS[server.type as keyof typeof FILTERS] as { name: string; value: string }[]).find(
        (f) => f.value === filters.sortBy,
      )?.name
    : 'Unknown';

  const sortOrderLabel = ORDER.find((s) => s.value === filters.sortOrder)?.name;

  return (
    <AnimatedPage>
      <VirtualGridContainer>
        <Group
          m={10}
          position="apart"
        >
          <Group>
            <Text
              $noSelect
              size="lg"
            >
              Albums
            </Text>
            <DropdownMenu position="bottom-start">
              <DropdownMenu.Target>
                <Button
                  compact
                  variant="subtle"
                >
                  <Group>
                    {sortByLabel}
                    <RiArrowDownSLine size={15} />
                  </Group>
                </Button>
              </DropdownMenu.Target>
              <DropdownMenu.Dropdown>
                {FILTERS[server?.type as keyof typeof FILTERS].map((filter) => (
                  <DropdownMenu.Item
                    key={`filter-${filter.value}`}
                    $isActive={filter.value === filters.sortBy}
                    value={filter.value}
                    onClick={handleSetFilter}
                  >
                    {filter.name}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Dropdown>
            </DropdownMenu>
            <DropdownMenu position="bottom-start">
              <DropdownMenu.Target>
                <Button
                  compact
                  variant="subtle"
                >
                  <Group>
                    {sortOrderLabel}
                    <RiArrowDownSLine size={15} />
                  </Group>
                </Button>
              </DropdownMenu.Target>
              <DropdownMenu.Dropdown>
                {ORDER.map((sort) => (
                  <DropdownMenu.Item
                    key={`sort-${sort.value}`}
                    $isActive={sort.value === filters.sortOrder}
                    value={sort.value}
                    onClick={handleSetOrder}
                  >
                    {sort.name}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Dropdown>
            </DropdownMenu>
            <DropdownMenu position="bottom-start">
              <DropdownMenu.Target>
                <Button
                  compact
                  variant="subtle"
                >
                  <Group>
                    Folders <RiArrowDownSLine size={15} />
                  </Group>
                </Button>
              </DropdownMenu.Target>
              {/* <DropdownMenu.Dropdown>
                {serverFolders?.map((folder) => (
                  <DropdownMenu.Item
                    key={folder.id}
                    $isActive={filters.serverFolderId.includes(folder.id)}
                    closeMenuOnClick={false}
                    value={folder.id}
                    onClick={handleSetServerFolder}
                  >
                    {folder.name}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Dropdown> */}
            </DropdownMenu>
          </Group>
          <Group position="right">
            <DropdownMenu
              position="bottom-end"
              width={100}
            >
              <DropdownMenu.Target>
                <Button
                  compact
                  variant="subtle"
                >
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
                    page.list.type === 'grid' && page.list.display === CardDisplayType.CARD
                  }
                  value={CardDisplayType.CARD}
                  onClick={handleSetViewType}
                >
                  Card
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  $isActive={
                    page.list.type === 'grid' && page.list.display === CardDisplayType.POSTER
                  }
                  value={CardDisplayType.POSTER}
                  onClick={handleSetViewType}
                >
                  Poster
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  disabled
                  $isActive={page.list.type === 'list'}
                  value="list"
                  onClick={handleSetViewType}
                >
                  List
                </DropdownMenu.Item>
              </DropdownMenu.Dropdown>
            </DropdownMenu>
          </Group>
        </Group>
        <AnimatePresence
          key="album-list-advanced-filter"
          initial={false}
          mode="wait"
        >
          {/* {isAdvFilter && (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -25 }}
              initial={{ opacity: 0, y: -25 }}
              style={{ maxHeight: '25vh', zIndex: 100 }}
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
                    <Button
                      disabled
                      uppercase
                      variant="default"
                    >
                      Save as...
                    </Button>
                  </Group>
                  <Box p={10}>
                    <AdvancedFilters
                      ref={advancedFiltersRef}
                      defaultFilters={page.list.advancedFilter.filter}
                      onChange={handleUpdateAdvancedFilters}
                    />
                  </Box>
                </ScrollArea>
              </Paper>
            </motion.div>
          )} */}
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
                itemCount={albumListQuery?.data?.pagination?.totalEntries || 0}
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
