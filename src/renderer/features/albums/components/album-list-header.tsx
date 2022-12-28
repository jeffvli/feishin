import type { ChangeEvent, MouseEvent, MutableRefObject } from 'react';
import { useCallback } from 'react';
import { IDatasource } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Flex, Group, Stack } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import {
  RiArrowDownSLine,
  RiFilter3Line,
  RiFolder2Line,
  RiMoreFill,
  RiSortAsc,
  RiSortDesc,
} from 'react-icons/ri';
import styled from 'styled-components';
import { api } from '/@/renderer/api';
import { controller } from '/@/renderer/api/controller';
import { queryKeys } from '/@/renderer/api/query-keys';
import { AlbumListSort, ServerType, SortOrder } from '/@/renderer/api/types';
import {
  ALBUM_TABLE_COLUMNS,
  Button,
  DropdownMenu,
  MultiSelect,
  PageHeader,
  Popover,
  SearchInput,
  Slider,
  Switch,
  Text,
  TextTitle,
  VirtualInfiniteGridRef,
} from '/@/renderer/components';
import { JellyfinAlbumFilters } from '/@/renderer/features/albums/components/jellyfin-album-filters';
import { NavidromeAlbumFilters } from '/@/renderer/features/albums/components/navidrome-album-filters';
import { useMusicFolders } from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';
import {
  AlbumListFilter,
  useAlbumListStore,
  useCurrentServer,
  useSetAlbumFilters,
  useSetAlbumStore,
  useSetAlbumTable,
  useSetAlbumTablePagination,
} from '/@/renderer/store';
import { ListDisplayType, TableColumn } from '/@/renderer/types';

const FILTERS = {
  jellyfin: [
    { defaultOrder: SortOrder.ASC, name: 'Album Artist', value: AlbumListSort.ALBUM_ARTIST },
    {
      defaultOrder: SortOrder.DESC,
      name: 'Community Rating',
      value: AlbumListSort.COMMUNITY_RATING,
    },
    { defaultOrder: SortOrder.DESC, name: 'Critic Rating', value: AlbumListSort.CRITIC_RATING },
    { defaultOrder: SortOrder.ASC, name: 'Name', value: AlbumListSort.NAME },
    { defaultOrder: SortOrder.ASC, name: 'Random', value: AlbumListSort.RANDOM },
    { defaultOrder: SortOrder.DESC, name: 'Recently Added', value: AlbumListSort.RECENTLY_ADDED },
    { defaultOrder: SortOrder.DESC, name: 'Release Date', value: AlbumListSort.RELEASE_DATE },
  ],
  navidrome: [
    { defaultOrder: SortOrder.ASC, name: 'Album Artist', value: AlbumListSort.ALBUM_ARTIST },
    { defaultOrder: SortOrder.ASC, name: 'Artist', value: AlbumListSort.ARTIST },
    { defaultOrder: SortOrder.DESC, name: 'Duration', value: AlbumListSort.DURATION },
    { defaultOrder: SortOrder.DESC, name: 'Most Played', value: AlbumListSort.PLAY_COUNT },
    { defaultOrder: SortOrder.ASC, name: 'Name', value: AlbumListSort.NAME },
    { defaultOrder: SortOrder.ASC, name: 'Random', value: AlbumListSort.RANDOM },
    { defaultOrder: SortOrder.DESC, name: 'Rating', value: AlbumListSort.RATING },
    { defaultOrder: SortOrder.DESC, name: 'Recently Added', value: AlbumListSort.RECENTLY_ADDED },
    { defaultOrder: SortOrder.DESC, name: 'Recently Played', value: AlbumListSort.RECENTLY_PLAYED },
    { defaultOrder: SortOrder.DESC, name: 'Song Count', value: AlbumListSort.SONG_COUNT },
    { defaultOrder: SortOrder.DESC, name: 'Favorited', value: AlbumListSort.FAVORITED },
    { defaultOrder: SortOrder.DESC, name: 'Year', value: AlbumListSort.YEAR },
  ],
};

const ORDER = [
  { name: 'Ascending', value: SortOrder.ASC },
  { name: 'Descending', value: SortOrder.DESC },
];

const HeaderItems = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

interface AlbumListHeaderProps {
  gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
  tableRef: MutableRefObject<AgGridReactType | null>;
}

export const AlbumListHeader = ({ gridRef, tableRef }: AlbumListHeaderProps) => {
  const queryClient = useQueryClient();
  const server = useCurrentServer();
  const setPage = useSetAlbumStore();
  const setFilter = useSetAlbumFilters();
  const page = useAlbumListStore();
  const filters = page.filter;
  const cq = useContainerQuery();

  const musicFoldersQuery = useMusicFolders();

  const setPagination = useSetAlbumTablePagination();
  const setTable = useSetAlbumTable();

  const sortByLabel =
    (server?.type &&
      FILTERS[server.type as keyof typeof FILTERS].find((f) => f.value === filters.sortBy)?.name) ||
    'Unknown';

  const sortOrderLabel = ORDER.find((o) => o.value === filters.sortOrder)?.name || 'Unknown';

  const handleItemSize = (e: number) => {
    if (
      page.display === ListDisplayType.TABLE ||
      page.display === ListDisplayType.TABLE_PAGINATED
    ) {
      setTable({ rowHeight: e });
    } else {
      setPage({ list: { ...page, grid: { ...page.grid, size: e } } });
    }
  };

  const fetch = useCallback(
    async (skip: number, take: number, filters: AlbumListFilter) => {
      const queryKey = queryKeys.albums.list(server?.id || '', {
        limit: take,
        startIndex: skip,
        ...filters,
      });

      const albums = await queryClient.fetchQuery(queryKey, async ({ signal }) =>
        controller.getAlbumList({
          query: {
            limit: take,
            startIndex: skip,
            ...filters,
          },
          server,
          signal,
        }),
      );

      return api.normalize.albumList(albums, server);
    },
    [queryClient, server],
  );

  const handleFilterChange = useCallback(
    async (filters: AlbumListFilter) => {
      if (
        page.display === ListDisplayType.TABLE ||
        page.display === ListDisplayType.TABLE_PAGINATED
      ) {
        const dataSource: IDatasource = {
          getRows: async (params) => {
            const limit = params.endRow - params.startRow;
            const startIndex = params.startRow;

            const queryKey = queryKeys.albums.list(server?.id || '', {
              limit,
              startIndex,
              ...filters,
            });

            const albumsRes = await queryClient.fetchQuery(queryKey, async ({ signal }) =>
              api.controller.getAlbumList({
                query: {
                  limit,
                  startIndex,
                  ...filters,
                },
                server,
                signal,
              }),
            );

            const albums = api.normalize.albumList(albumsRes, server);
            params.successCallback(albums?.items || [], albumsRes?.totalRecordCount || undefined);
          },
          rowCount: undefined,
        };
        tableRef.current?.api.setDatasource(dataSource);
        tableRef.current?.api.purgeInfiniteCache();
        tableRef.current?.api.ensureIndexVisible(0, 'top');

        if (page.display === ListDisplayType.TABLE_PAGINATED) {
          setPagination({ currentPage: 0 });
        }
      } else {
        gridRef.current?.scrollTo(0);
        gridRef.current?.resetLoadMoreItemsCache();

        // Refetching within the virtualized grid may be inconsistent due to it refetching
        // using an outdated set of filters. To avoid this, we fetch using the updated filters
        // and then set the grid's data here.
        const data = await fetch(0, 200, filters);

        if (!data?.items) return;
        gridRef.current?.setItemData(data.items);
      }
    },
    [page.display, tableRef, setPagination, server, queryClient, gridRef, fetch],
  );

  const handleSetSortBy = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget?.value || !server?.type) return;

      const sortOrder = FILTERS[server.type as keyof typeof FILTERS].find(
        (f) => f.value === e.currentTarget.value,
      )?.defaultOrder;

      const updatedFilters = setFilter({
        sortBy: e.currentTarget.value as AlbumListSort,
        sortOrder: sortOrder || SortOrder.ASC,
      });

      handleFilterChange(updatedFilters);
    },
    [handleFilterChange, server?.type, setFilter],
  );

  const handleSetMusicFolder = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget?.value) return;

      let updatedFilters = null;
      if (e.currentTarget.value === String(page.filter.musicFolderId)) {
        updatedFilters = setFilter({ musicFolderId: undefined });
      } else {
        updatedFilters = setFilter({ musicFolderId: e.currentTarget.value });
      }

      handleFilterChange(updatedFilters);
    },
    [handleFilterChange, page.filter.musicFolderId, setFilter],
  );

  const handleToggleSortOrder = useCallback(() => {
    const newSortOrder = filters.sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;
    const updatedFilters = setFilter({ sortOrder: newSortOrder });
    handleFilterChange(updatedFilters);
  }, [filters.sortOrder, handleFilterChange, setFilter]);

  const handleSetViewType = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget?.value) return;
      setPage({ list: { ...page, display: e.currentTarget.value as ListDisplayType } });
    },
    [page, setPage],
  );

  const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
    const previousSearchTerm = page.filter.searchTerm;
    const searchTerm = e.target.value === '' ? undefined : e.target.value;
    const updatedFilters = setFilter({ searchTerm });
    if (previousSearchTerm !== searchTerm) handleFilterChange(updatedFilters);
  }, 500);

  const handleTableColumns = (values: TableColumn[]) => {
    const existingColumns = page.table.columns;

    if (values.length === 0) {
      return setTable({
        columns: [],
      });
    }

    // If adding a column
    if (values.length > existingColumns.length) {
      const newColumn = { column: values[values.length - 1], width: 100 };

      setTable({ columns: [...existingColumns, newColumn] });
    } else {
      // If removing a column
      const removed = existingColumns.filter((column) => !values.includes(column.column));
      const newColumns = existingColumns.filter((column) => !removed.includes(column));

      setTable({ columns: newColumns });
    }

    return tableRef.current?.api.sizeColumnsToFit();
  };

  const handleAutoFitColumns = (e: ChangeEvent<HTMLInputElement>) => {
    setTable({ autoFit: e.currentTarget.checked });

    if (e.currentTarget.checked) {
      tableRef.current?.api.sizeColumnsToFit();
    }
  };

  return (
    <PageHeader>
      <HeaderItems ref={cq.ref}>
        <Flex
          align="center"
          gap="md"
          justify="center"
        >
          <DropdownMenu position="bottom-start">
            <DropdownMenu.Target>
              <Button
                compact
                px={0}
                rightIcon={<RiArrowDownSLine size={15} />}
                size="xl"
                variant="subtle"
              >
                <TextTitle
                  fw="bold"
                  order={3}
                >
                  Albums
                </TextTitle>
              </Button>
            </DropdownMenu.Target>
            <DropdownMenu.Dropdown>
              <DropdownMenu.Label>Display type</DropdownMenu.Label>
              <DropdownMenu.Item
                $isActive={page.display === ListDisplayType.CARD}
                value={ListDisplayType.CARD}
                onClick={handleSetViewType}
              >
                Card
              </DropdownMenu.Item>
              <DropdownMenu.Item
                $isActive={page.display === ListDisplayType.POSTER}
                value={ListDisplayType.POSTER}
                onClick={handleSetViewType}
              >
                Poster
              </DropdownMenu.Item>
              <DropdownMenu.Item
                $isActive={page.display === ListDisplayType.TABLE}
                value={ListDisplayType.TABLE}
                onClick={handleSetViewType}
              >
                Table
              </DropdownMenu.Item>
              <DropdownMenu.Item
                $isActive={page.display === ListDisplayType.TABLE_PAGINATED}
                value={ListDisplayType.TABLE_PAGINATED}
                onClick={handleSetViewType}
              >
                Table (paginated)
              </DropdownMenu.Item>
              <DropdownMenu.Divider />
              <DropdownMenu.Label>Item size</DropdownMenu.Label>
              <DropdownMenu.Item closeMenuOnClick={false}>
                <Slider
                  defaultValue={
                    page.display === ListDisplayType.CARD || page.display === ListDisplayType.POSTER
                      ? page.grid.size
                      : page.table.rowHeight
                  }
                  label={null}
                  max={100}
                  min={25}
                  onChangeEnd={handleItemSize}
                />
              </DropdownMenu.Item>
              {(page.display === ListDisplayType.TABLE ||
                page.display === ListDisplayType.TABLE_PAGINATED) && (
                <>
                  <DropdownMenu.Label>Table Columns</DropdownMenu.Label>
                  <DropdownMenu.Item
                    closeMenuOnClick={false}
                    component="div"
                    sx={{ cursor: 'default' }}
                  >
                    <Stack>
                      <MultiSelect
                        clearable
                        data={ALBUM_TABLE_COLUMNS}
                        defaultValue={page.table?.columns.map((column) => column.column)}
                        width={300}
                        onChange={handleTableColumns}
                      />
                      <Group position="apart">
                        <Text>Auto Fit Columns</Text>
                        <Switch
                          defaultChecked={page.table.autoFit}
                          onChange={handleAutoFitColumns}
                        />
                      </Group>
                    </Stack>
                  </DropdownMenu.Item>
                </>
              )}
            </DropdownMenu.Dropdown>
          </DropdownMenu>
          <DropdownMenu position="bottom-start">
            <DropdownMenu.Target>
              <Button
                compact
                fw="600"
                variant="subtle"
              >
                {sortByLabel}
              </Button>
            </DropdownMenu.Target>
            <DropdownMenu.Dropdown>
              {FILTERS[server?.type as keyof typeof FILTERS].map((filter) => (
                <DropdownMenu.Item
                  key={`filter-${filter.name}`}
                  $isActive={filter.value === filters.sortBy}
                  value={filter.value}
                  onClick={handleSetSortBy}
                >
                  {filter.name}
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Dropdown>
          </DropdownMenu>
          <Button
            compact
            fw="600"
            variant="subtle"
            onClick={handleToggleSortOrder}
          >
            {cq.isMd ? (
              sortOrderLabel
            ) : (
              <>
                {filters.sortOrder === SortOrder.ASC ? (
                  <RiSortAsc size={15} />
                ) : (
                  <RiSortDesc size={15} />
                )}
              </>
            )}
          </Button>
          {server?.type === ServerType.JELLYFIN && (
            <DropdownMenu position="bottom-start">
              <DropdownMenu.Target>
                <Button
                  compact
                  fw="600"
                  variant="subtle"
                >
                  {cq.isMd ? 'Folder' : <RiFolder2Line size={15} />}
                </Button>
              </DropdownMenu.Target>
              <DropdownMenu.Dropdown>
                {musicFoldersQuery.data?.map((folder) => (
                  <DropdownMenu.Item
                    key={`musicFolder-${folder.id}`}
                    $isActive={filters.musicFolderId === folder.id}
                    value={folder.id}
                    onClick={handleSetMusicFolder}
                  >
                    {folder.name}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Dropdown>
            </DropdownMenu>
          )}
          <Popover position="bottom-start">
            <Popover.Target>
              <Button
                compact
                fw="600"
                variant="subtle"
              >
                {cq.isMd ? 'Filters' : <RiFilter3Line size={15} />}
              </Button>
            </Popover.Target>
            <Popover.Dropdown>
              {server?.type === ServerType.NAVIDROME ? (
                <NavidromeAlbumFilters handleFilterChange={handleFilterChange} />
              ) : (
                <JellyfinAlbumFilters handleFilterChange={handleFilterChange} />
              )}
            </Popover.Dropdown>
          </Popover>
          <DropdownMenu position="bottom-start">
            <DropdownMenu.Target>
              <Button
                compact
                variant="subtle"
              >
                <RiMoreFill size={15} />
              </Button>
            </DropdownMenu.Target>
            <DropdownMenu.Dropdown>
              <DropdownMenu.Item disabled>Play</DropdownMenu.Item>
              <DropdownMenu.Item disabled>Play last</DropdownMenu.Item>
              <DropdownMenu.Item disabled>Play next</DropdownMenu.Item>
              <DropdownMenu.Item disabled>Add to playlist</DropdownMenu.Item>
            </DropdownMenu.Dropdown>
          </DropdownMenu>
        </Flex>
        <Flex gap="md">
          <SearchInput
            defaultValue={page.filter.searchTerm}
            openedWidth={cq.isLg ? 300 : cq.isMd ? 250 : cq.isSm ? 150 : 75}
            onChange={handleSearch}
          />
        </Flex>
      </HeaderItems>
    </PageHeader>
  );
};
