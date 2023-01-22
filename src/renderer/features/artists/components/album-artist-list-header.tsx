import type { ChangeEvent, MouseEvent, MutableRefObject } from 'react';
import { useCallback } from 'react';
import { IDatasource } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Flex, Group, Stack } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { RiArrowDownSLine, RiFolder2Line, RiMoreFill, RiSortAsc, RiSortDesc } from 'react-icons/ri';
import styled from 'styled-components';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { AlbumArtistListSort, ServerType, SortOrder } from '/@/renderer/api/types';
import {
  ALBUMARTIST_TABLE_COLUMNS,
  Button,
  DropdownMenu,
  MultiSelect,
  PageHeader,
  SearchInput,
  Slider,
  Switch,
  Text,
  TextTitle,
  VirtualInfiniteGridRef,
} from '/@/renderer/components';
import { useMusicFolders } from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';
import {
  AlbumArtistListFilter,
  useAlbumArtistListStore,
  useCurrentServer,
  useSetAlbumArtistFilters,
  useSetAlbumArtistStore,
  useSetAlbumArtistTable,
  useSetAlbumArtistTablePagination,
} from '/@/renderer/store';
import { ListDisplayType, TableColumn } from '/@/renderer/types';

const FILTERS = {
  jellyfin: [
    { defaultOrder: SortOrder.ASC, name: 'Album', value: AlbumArtistListSort.ALBUM },
    { defaultOrder: SortOrder.DESC, name: 'Duration', value: AlbumArtistListSort.DURATION },
    { defaultOrder: SortOrder.ASC, name: 'Name', value: AlbumArtistListSort.NAME },
    { defaultOrder: SortOrder.ASC, name: 'Random', value: AlbumArtistListSort.RANDOM },
    {
      defaultOrder: SortOrder.DESC,
      name: 'Recently Added',
      value: AlbumArtistListSort.RECENTLY_ADDED,
    },
    // { defaultOrder: SortOrder.DESC, name: 'Release Date', value: AlbumArtistListSort.RELEASE_DATE },
  ],
  navidrome: [
    { defaultOrder: SortOrder.DESC, name: 'Album Count', value: AlbumArtistListSort.ALBUM_COUNT },
    { defaultOrder: SortOrder.DESC, name: 'Favorited', value: AlbumArtistListSort.FAVORITED },
    { defaultOrder: SortOrder.DESC, name: 'Most Played', value: AlbumArtistListSort.PLAY_COUNT },
    { defaultOrder: SortOrder.ASC, name: 'Name', value: AlbumArtistListSort.NAME },
    { defaultOrder: SortOrder.DESC, name: 'Rating', value: AlbumArtistListSort.RATING },
    { defaultOrder: SortOrder.DESC, name: 'Song Count', value: AlbumArtistListSort.SONG_COUNT },
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

interface AlbumArtistListHeaderProps {
  gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
  tableRef: MutableRefObject<AgGridReactType | null>;
}

export const AlbumArtistListHeader = ({ gridRef, tableRef }: AlbumArtistListHeaderProps) => {
  const queryClient = useQueryClient();
  const server = useCurrentServer();
  const setPage = useSetAlbumArtistStore();
  const setFilter = useSetAlbumArtistFilters();
  const page = useAlbumArtistListStore();
  const filters = page.filter;
  const cq = useContainerQuery();

  const musicFoldersQuery = useMusicFolders();

  const setPagination = useSetAlbumArtistTablePagination();
  const setTable = useSetAlbumArtistTable();

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
    async (startIndex: number, limit: number, filters: AlbumArtistListFilter) => {
      const queryKey = queryKeys.albumArtists.list(server?.id || '', {
        limit,
        startIndex,
        ...filters,
      });

      const albums = await queryClient.fetchQuery(
        queryKey,
        async ({ signal }) =>
          api.controller.getAlbumArtistList({
            query: {
              limit,
              startIndex,
              ...filters,
            },
            server,
            signal,
          }),
        { cacheTime: 1000 * 60 * 1 },
      );

      return api.normalize.albumArtistList(albums, server);
    },
    [queryClient, server],
  );

  const handleFilterChange = useCallback(
    async (filters: AlbumArtistListFilter) => {
      if (
        page.display === ListDisplayType.TABLE ||
        page.display === ListDisplayType.TABLE_PAGINATED
      ) {
        const dataSource: IDatasource = {
          getRows: async (params) => {
            const limit = params.endRow - params.startRow;
            const startIndex = params.startRow;

            const queryKey = queryKeys.albumArtists.list(server?.id || '', {
              limit,
              startIndex,
              ...filters,
            });

            const albumArtistsRes = await queryClient.fetchQuery(
              queryKey,
              async ({ signal }) =>
                api.controller.getAlbumArtistList({
                  query: {
                    limit,
                    startIndex,
                    ...filters,
                  },
                  server,
                  signal,
                }),
              { cacheTime: 1000 * 60 * 1 },
            );

            const albumArtists = api.normalize.albumArtistList(albumArtistsRes, server);
            params.successCallback(
              albumArtists?.items || [],
              albumArtistsRes?.totalRecordCount || undefined,
            );
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
        sortBy: e.currentTarget.value as AlbumArtistListSort,
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

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries(queryKeys.albumArtists.list(server?.id || ''));
    handleFilterChange(filters);
  }, [filters, handleFilterChange, queryClient, server?.id]);

  return (
    <PageHeader p="1rem">
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
                  order={3}
                  weight={700}
                >
                  Album Artists
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
                        data={ALBUMARTIST_TABLE_COLUMNS}
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
              <DropdownMenu.Item disabled>Add to queue next</DropdownMenu.Item>
              <DropdownMenu.Item disabled>Add to queue</DropdownMenu.Item>
              <DropdownMenu.Divider />
              <DropdownMenu.Item onClick={handleRefresh}>Refresh</DropdownMenu.Item>
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
