import { useCallback, ChangeEvent, MutableRefObject, MouseEvent } from 'react';
import { IDatasource } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Group, Stack, Flex } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import {
  RiSortAsc,
  RiSortDesc,
  RiFolder2Line,
  RiMoreFill,
  RiRefreshLine,
  RiSettings3Fill,
} from 'react-icons/ri';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { AlbumArtistListSort, LibraryItem, SortOrder } from '/@/renderer/api/types';
import { DropdownMenu, Text, Button, Slider, MultiSelect, Switch } from '/@/renderer/components';
import { useMusicFolders } from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';
import {
  useCurrentServer,
  useAlbumArtistListStore,
  AlbumArtistListFilter,
  useListStoreActions,
  useAlbumArtistListFilter,
} from '/@/renderer/store';
import { ListDisplayType, TableColumn, ServerType } from '/@/renderer/types';
import { useAlbumArtistListContext } from '../context/album-artist-list-context';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ALBUMARTIST_TABLE_COLUMNS } from '/@/renderer/components/virtual-table';

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

interface AlbumArtistListHeaderFiltersProps {
  gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
  tableRef: MutableRefObject<AgGridReactType | null>;
}

export const AlbumArtistListHeaderFilters = ({
  gridRef,
  tableRef,
}: AlbumArtistListHeaderFiltersProps) => {
  const queryClient = useQueryClient();
  const server = useCurrentServer();
  const { pageKey } = useAlbumArtistListContext();
  const { display, table, grid } = useAlbumArtistListStore();
  const { setFilter, setTable, setTablePagination, setDisplayType, setGrid } =
    useListStoreActions();
  const filter = useAlbumArtistListFilter({ key: pageKey });
  const cq = useContainerQuery();

  const musicFoldersQuery = useMusicFolders({ query: null, serverId: server?.id });

  const sortByLabel =
    (server?.type &&
      FILTERS[server.type as keyof typeof FILTERS].find((f) => f.value === filter.sortBy)?.name) ||
    'Unknown';

  const sortOrderLabel = ORDER.find((o) => o.value === filter.sortOrder)?.name || 'Unknown';

  const handleItemSize = (e: number) => {
    if (display === ListDisplayType.TABLE || display === ListDisplayType.TABLE_PAGINATED) {
      setTable({ data: { rowHeight: e }, key: pageKey });
    } else {
      setGrid({ data: { itemsPerRow: e }, key: pageKey });
    }
  };

  const debouncedHandleItemSize = debounce(handleItemSize, 20);

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
            apiClientProps: {
              server,
              signal,
            },
            query: {
              limit,
              startIndex,
              ...filters,
            },
          }),
        { cacheTime: 1000 * 60 * 1 },
      );

      return albums;
    },
    [queryClient, server],
  );

  const handleFilterChange = useCallback(
    async (filters: AlbumArtistListFilter) => {
      if (display === ListDisplayType.TABLE || display === ListDisplayType.TABLE_PAGINATED) {
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
                  apiClientProps: {
                    server,
                    signal,
                  },
                  query: {
                    limit,
                    startIndex,
                    ...filters,
                  },
                }),
              { cacheTime: 1000 * 60 * 1 },
            );

            params.successCallback(
              albumArtistsRes?.items || [],
              albumArtistsRes?.totalRecordCount || 0,
            );
          },
          rowCount: undefined,
        };
        tableRef.current?.api.setDatasource(dataSource);
        tableRef.current?.api.purgeInfiniteCache();
        tableRef.current?.api.ensureIndexVisible(0, 'top');

        if (display === ListDisplayType.TABLE_PAGINATED) {
          setTablePagination({ data: { currentPage: 0 }, key: pageKey });
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
    [display, tableRef, server, queryClient, setTablePagination, pageKey, gridRef, fetch],
  );

  const handleSetSortBy = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget?.value || !server?.type) return;

      const sortOrder = FILTERS[server.type as keyof typeof FILTERS].find(
        (f) => f.value === e.currentTarget.value,
      )?.defaultOrder;

      const updatedFilters = setFilter({
        data: {
          sortBy: e.currentTarget.value as AlbumArtistListSort,
          sortOrder: sortOrder || SortOrder.ASC,
        },
        itemType: LibraryItem.ALBUM_ARTIST,
        key: pageKey,
      }) as AlbumArtistListFilter;

      handleFilterChange(updatedFilters);
    },
    [handleFilterChange, pageKey, server?.type, setFilter],
  );

  const handleSetMusicFolder = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget?.value) return;

      let updatedFilters = null;
      if (e.currentTarget.value === String(filter.musicFolderId)) {
        updatedFilters = setFilter({
          data: { musicFolderId: undefined },
          itemType: LibraryItem.ALBUM_ARTIST,
          key: pageKey,
        }) as AlbumArtistListFilter;
      } else {
        updatedFilters = setFilter({
          data: { musicFolderId: e.currentTarget.value },
          itemType: LibraryItem.ALBUM_ARTIST,
          key: pageKey,
        }) as AlbumArtistListFilter;
      }

      handleFilterChange(updatedFilters);
    },
    [filter.musicFolderId, handleFilterChange, setFilter, pageKey],
  );

  const handleToggleSortOrder = useCallback(() => {
    const newSortOrder = filter.sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;
    const updatedFilters = setFilter({
      data: { sortOrder: newSortOrder },
      itemType: LibraryItem.ALBUM_ARTIST,
      key: pageKey,
    }) as AlbumArtistListFilter;
    handleFilterChange(updatedFilters);
  }, [filter.sortOrder, handleFilterChange, pageKey, setFilter]);

  const handleSetViewType = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget?.value) return;

      setDisplayType({ data: e.currentTarget.value as ListDisplayType, key: pageKey });
    },
    [pageKey, setDisplayType],
  );

  const handleTableColumns = (values: TableColumn[]) => {
    const existingColumns = table.columns;

    if (values.length === 0) {
      return setTable({
        data: {
          columns: [],
        },
        key: pageKey,
      });
    }

    // If adding a column
    if (values.length > existingColumns.length) {
      const newColumn = { column: values[values.length - 1], width: 100 };

      setTable({ data: { columns: [...existingColumns, newColumn] }, key: pageKey });
    } else {
      // If removing a column
      const removed = existingColumns.filter((column) => !values.includes(column.column));
      const newColumns = existingColumns.filter((column) => !removed.includes(column));

      setTable({ data: { columns: newColumns }, key: pageKey });
    }

    return tableRef.current?.api.sizeColumnsToFit();
  };

  const handleAutoFitColumns = (e: ChangeEvent<HTMLInputElement>) => {
    setTable({ data: { autoFit: e.currentTarget.checked }, key: pageKey });

    if (e.currentTarget.checked) {
      tableRef.current?.api.sizeColumnsToFit();
    }
  };

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries(queryKeys.albumArtists.list(server?.id || ''));
    handleFilterChange(filter);
  }, [filter, handleFilterChange, queryClient, server?.id]);

  return (
    <Flex justify="space-between">
      <Group
        ref={cq.ref}
        spacing="sm"
        w="100%"
      >
        <DropdownMenu position="bottom-start">
          <DropdownMenu.Target>
            <Button
              compact
              fw="600"
              size="md"
              variant="subtle"
            >
              {sortByLabel}
            </Button>
          </DropdownMenu.Target>
          <DropdownMenu.Dropdown>
            {FILTERS[server?.type as keyof typeof FILTERS].map((f) => (
              <DropdownMenu.Item
                key={`filter-${f.name}`}
                $isActive={f.value === filter.sortBy}
                value={f.value}
                onClick={handleSetSortBy}
              >
                {f.name}
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Dropdown>
        </DropdownMenu>
        <Button
          compact
          fw="600"
          size="md"
          variant="subtle"
          onClick={handleToggleSortOrder}
        >
          {cq.isMd ? (
            sortOrderLabel
          ) : (
            <>
              {filter.sortOrder === SortOrder.ASC ? (
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
                size="md"
                variant="subtle"
              >
                {cq.isMd ? 'Folder' : <RiFolder2Line size={15} />}
              </Button>
            </DropdownMenu.Target>
            <DropdownMenu.Dropdown>
              {musicFoldersQuery.data?.items.map((folder) => (
                <DropdownMenu.Item
                  key={`musicFolder-${folder.id}`}
                  $isActive={filter.musicFolderId === folder.id}
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
              size="md"
              variant="subtle"
            >
              <RiMoreFill size={15} />
            </Button>
          </DropdownMenu.Target>
          <DropdownMenu.Dropdown>
            <DropdownMenu.Item
              icon={<RiRefreshLine />}
              onClick={handleRefresh}
            >
              Refresh
            </DropdownMenu.Item>
          </DropdownMenu.Dropdown>
        </DropdownMenu>
      </Group>
      <Group>
        <DropdownMenu position="bottom-end">
          <DropdownMenu.Target>
            <Button
              compact
              size="md"
              variant="subtle"
            >
              <RiSettings3Fill size="1.3rem" />
            </Button>
          </DropdownMenu.Target>
          <DropdownMenu.Dropdown>
            <DropdownMenu.Label>Display type</DropdownMenu.Label>
            <DropdownMenu.Item
              $isActive={display === ListDisplayType.CARD}
              value={ListDisplayType.CARD}
              onClick={handleSetViewType}
            >
              Card
            </DropdownMenu.Item>
            <DropdownMenu.Item
              $isActive={display === ListDisplayType.POSTER}
              value={ListDisplayType.POSTER}
              onClick={handleSetViewType}
            >
              Poster
            </DropdownMenu.Item>
            <DropdownMenu.Item
              $isActive={display === ListDisplayType.TABLE}
              value={ListDisplayType.TABLE}
              onClick={handleSetViewType}
            >
              Table
            </DropdownMenu.Item>
            <DropdownMenu.Item
              $isActive={display === ListDisplayType.TABLE_PAGINATED}
              value={ListDisplayType.TABLE_PAGINATED}
              onClick={handleSetViewType}
            >
              Table (paginated)
            </DropdownMenu.Item>
            <DropdownMenu.Divider />
            <DropdownMenu.Label>Item size</DropdownMenu.Label>
            <DropdownMenu.Item closeMenuOnClick={false}>
              {display === ListDisplayType.CARD || display === ListDisplayType.POSTER ? (
                <Slider
                  defaultValue={grid?.itemsPerRow}
                  label={null}
                  max={10}
                  min={2}
                  onChange={debouncedHandleItemSize}
                />
              ) : (
                <Slider
                  defaultValue={table.rowHeight}
                  label={null}
                  max={100}
                  min={30}
                  onChange={debouncedHandleItemSize}
                />
              )}
            </DropdownMenu.Item>
            {(display === ListDisplayType.TABLE || display === ListDisplayType.TABLE_PAGINATED) && (
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
                      defaultValue={table?.columns.map((column) => column.column)}
                      width={300}
                      onChange={handleTableColumns}
                    />
                    <Group position="apart">
                      <Text>Auto Fit Columns</Text>
                      <Switch
                        defaultChecked={table.autoFit}
                        onChange={handleAutoFitColumns}
                      />
                    </Group>
                  </Stack>
                </DropdownMenu.Item>
              </>
            )}
          </DropdownMenu.Dropdown>
        </DropdownMenu>
      </Group>
    </Flex>
  );
};
