import { MutableRefObject, useCallback, MouseEvent, ChangeEvent, useMemo } from 'react';
import { IDatasource } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Flex, Group, Stack } from '@mantine/core';
import { openModal } from '@mantine/modals';
import { useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import {
  RiSortAsc,
  RiSortDesc,
  RiFolder2Line,
  RiMoreFill,
  RiAddBoxFill,
  RiPlayFill,
  RiAddCircleFill,
  RiRefreshLine,
  RiSettings3Fill,
  RiFilterFill,
} from 'react-icons/ri';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { AlbumListQuery, AlbumListSort, LibraryItem, SortOrder } from '/@/renderer/api/types';
import { Button, DropdownMenu, MultiSelect, Slider, Switch, Text } from '/@/renderer/components';
import { useContainerQuery } from '/@/renderer/hooks';
import {
  AlbumListFilter,
  useAlbumListStore,
  useCurrentServer,
  useListStoreActions,
} from '/@/renderer/store';
import { ServerType, Play, ListDisplayType, TableColumn } from '/@/renderer/types';
import { useMusicFolders } from '/@/renderer/features/shared';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { JellyfinAlbumFilters } from '/@/renderer/features/albums/components/jellyfin-album-filters';
import { NavidromeAlbumFilters } from '/@/renderer/features/albums/components/navidrome-album-filters';
import { useAlbumListContext } from '/@/renderer/features/albums/context/album-list-context';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ALBUM_TABLE_COLUMNS } from '/@/renderer/components/virtual-table';

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

interface AlbumListHeaderFiltersProps {
  customFilters?: Partial<AlbumListFilter>;
  gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
  itemCount?: number;
  tableRef: MutableRefObject<AgGridReactType | null>;
}

export const AlbumListHeaderFilters = ({
  customFilters,
  gridRef,
  tableRef,
  itemCount,
}: AlbumListHeaderFiltersProps) => {
  const queryClient = useQueryClient();
  const { id, pageKey } = useAlbumListContext();
  const server = useCurrentServer();
  const { setFilter, setTablePagination, setTable, setGrid, setDisplayType, setTableColumns } =
    useListStoreActions();
  const { display, filter, table, grid } = useAlbumListStore({ id, key: pageKey });
  const cq = useContainerQuery();

  const musicFoldersQuery = useMusicFolders({ query: null, serverId: server?.id });

  const sortByLabel =
    (server?.type &&
      FILTERS[server.type as keyof typeof FILTERS].find((f) => f.value === filter.sortBy)?.name) ||
    'Unknown';

  const sortOrderLabel = ORDER.find((o) => o.value === filter.sortOrder)?.name || 'Unknown';

  const fetch = useCallback(
    async (skip: number, take: number, filters: AlbumListFilter) => {
      const query: AlbumListQuery = {
        limit: take,
        startIndex: skip,
        ...filters,
        _custom: {
          jellyfin: {
            ...filters._custom?.jellyfin,
            ...customFilters?._custom?.jellyfin,
          },
          navidrome: {
            ...filters._custom?.navidrome,
            ...customFilters?._custom?.navidrome,
          },
        },
        ...customFilters,
      };

      const queryKey = queryKeys.albums.list(server?.id || '', query);

      const albums = await queryClient.fetchQuery(
        queryKey,
        async ({ signal }) =>
          api.controller.getAlbumList({
            apiClientProps: {
              server,
              signal,
            },
            query,
          }),
        { cacheTime: 1000 * 60 * 1 },
      );

      return albums;
    },
    [customFilters, queryClient, server],
  );

  const handleFilterChange = useCallback(
    async (filters: AlbumListFilter) => {
      if (display === ListDisplayType.TABLE || display === ListDisplayType.TABLE_PAGINATED) {
        const dataSource: IDatasource = {
          getRows: async (params) => {
            const limit = params.endRow - params.startRow;
            const startIndex = params.startRow;

            const query: AlbumListQuery = {
              limit,
              startIndex,
              ...filters,
              ...customFilters,
              _custom: {
                jellyfin: {
                  ...filters._custom?.jellyfin,
                  ...customFilters?._custom?.jellyfin,
                },
                navidrome: {
                  ...filters._custom?.navidrome,
                  ...customFilters?._custom?.navidrome,
                },
              },
            };

            const queryKey = queryKeys.albums.list(server?.id || '', query);

            const albumsRes = await queryClient.fetchQuery(
              queryKey,
              async ({ signal }) =>
                api.controller.getAlbumList({
                  apiClientProps: {
                    server,
                    signal,
                  },
                  query,
                }),
              { cacheTime: 1000 * 60 * 1 },
            );

            return params.successCallback(albumsRes?.items || [], albumsRes?.totalRecordCount || 0);
          },
          rowCount: undefined,
        };
        tableRef.current?.api.setDatasource(dataSource);
        tableRef.current?.api.purgeInfiniteCache();
        tableRef.current?.api.ensureIndexVisible(0, 'top');

        if (display === ListDisplayType.TABLE_PAGINATED) {
          setTablePagination({ data: { currentPage: 0 }, key: 'album' });
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
    [display, tableRef, customFilters, server, queryClient, setTablePagination, gridRef, fetch],
  );

  const handleOpenFiltersModal = () => {
    openModal({
      children: (
        <>
          {server?.type === ServerType.NAVIDROME ? (
            <NavidromeAlbumFilters
              disableArtistFilter={!!customFilters}
              handleFilterChange={handleFilterChange}
              id={id}
              pageKey={pageKey}
              serverId={server?.id}
            />
          ) : (
            <JellyfinAlbumFilters
              disableArtistFilter={!!customFilters}
              handleFilterChange={handleFilterChange}
              id={id}
              pageKey={pageKey}
              serverId={server?.id}
            />
          )}
        </>
      ),
      title: 'Album Filters',
    });
  };

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries(queryKeys.albums.list(server?.id || ''));
    handleFilterChange(filter);
  }, [filter, handleFilterChange, queryClient, server?.id]);

  const handleSetSortBy = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget?.value || !server?.type) return;

      const sortOrder = FILTERS[server.type as keyof typeof FILTERS].find(
        (f) => f.value === e.currentTarget.value,
      )?.defaultOrder;

      const updatedFilters = setFilter({
        data: {
          sortBy: e.currentTarget.value as AlbumListSort,
          sortOrder: sortOrder || SortOrder.ASC,
        },
        key: 'album',
      }) as AlbumListFilter;

      handleFilterChange(updatedFilters);
    },
    [handleFilterChange, server?.type, setFilter],
  );

  const handleSetMusicFolder = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget?.value) return;

      let updatedFilters = null;
      if (e.currentTarget.value === String(filter.musicFolderId)) {
        updatedFilters = setFilter({
          data: { musicFolderId: undefined },
          key: 'album',
        }) as AlbumListFilter;
      } else {
        updatedFilters = setFilter({
          data: { musicFolderId: e.currentTarget.value },
          key: 'album',
        }) as AlbumListFilter;
      }

      handleFilterChange(updatedFilters);
    },
    [handleFilterChange, filter.musicFolderId, setFilter],
  );

  const handleToggleSortOrder = useCallback(() => {
    const newSortOrder = filter.sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;
    const updatedFilters = setFilter({
      data: { sortOrder: newSortOrder },
      key: 'album',
    }) as AlbumListFilter;
    handleFilterChange(updatedFilters);
  }, [filter.sortOrder, handleFilterChange, setFilter]);

  const handlePlayQueueAdd = usePlayQueueAdd();

  const handlePlay = async (playType: Play) => {
    if (!itemCount || itemCount === 0 || !server) return;

    const query = {
      startIndex: 0,
      ...filter,
      ...customFilters,
      _custom: {
        jellyfin: {
          ...filter._custom?.jellyfin,
          ...customFilters?._custom?.jellyfin,
        },
        navidrome: {
          ...filter._custom?.navidrome,
          ...customFilters?._custom?.navidrome,
        },
      },
    };
    const queryKey = queryKeys.albums.list(server?.id || '', query);

    const albumListRes = await queryClient.fetchQuery({
      queryFn: ({ signal }) =>
        api.controller.getAlbumList({ apiClientProps: { server, signal }, query }),
      queryKey,
    });

    const albumIds = albumListRes?.items?.map((a) => a.id) || [];

    handlePlayQueueAdd?.({
      byItemType: {
        id: albumIds,
        type: LibraryItem.ALBUM,
      },
      playType,
    });
  };

  const handleItemSize = (e: number) => {
    if (display === ListDisplayType.TABLE || display === ListDisplayType.TABLE_PAGINATED) {
      setTable({ data: { rowHeight: e }, key: 'album' });
    } else {
      setGrid({ data: { itemsPerRow: e }, key: 'album' });
    }
  };

  const debouncedHandleItemSize = debounce(handleItemSize, 20);

  const handleSetViewType = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget?.value) return;
      setDisplayType({ data: e.currentTarget.value as ListDisplayType, key: 'album' });
    },
    [setDisplayType],
  );

  const handleTableColumns = (values: TableColumn[]) => {
    const existingColumns = table.columns;

    if (values.length === 0) {
      return setTableColumns({
        data: [],
        key: 'album',
      });
    }

    // If adding a column
    if (values.length > existingColumns.length) {
      const newColumn = { column: values[values.length - 1], width: 100 };

      setTableColumns({ data: [...existingColumns, newColumn], key: 'album' });
    } else {
      // If removing a column
      const removed = existingColumns.filter((column) => !values.includes(column.column));
      const newColumns = existingColumns.filter((column) => !removed.includes(column));

      setTableColumns({ data: newColumns, key: 'album' });
    }

    return tableRef.current?.api.sizeColumnsToFit();
  };

  const handleAutoFitColumns = (e: ChangeEvent<HTMLInputElement>) => {
    setTable({ data: { autoFit: e.currentTarget.checked }, key: 'album' });

    if (e.currentTarget.checked) {
      tableRef.current?.api.sizeColumnsToFit();
    }
  };

  const isFilterApplied = useMemo(() => {
    const isNavidromeFilterApplied =
      server?.type === ServerType.NAVIDROME &&
      filter?._custom?.navidrome &&
      Object.values(filter?._custom?.navidrome).some((value) => value !== undefined);

    const isJellyfinFilterApplied =
      server?.type === ServerType.JELLYFIN &&
      filter?._custom?.jellyfin &&
      Object.values(filter?._custom?.jellyfin).some((value) => value !== undefined);

    return isNavidromeFilterApplied || isJellyfinFilterApplied;
  }, [filter?._custom?.jellyfin, filter?._custom?.navidrome, server?.type]);

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
              fw={600}
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
          fw={600}
          size="md"
          variant="subtle"
          onClick={handleToggleSortOrder}
        >
          {cq.isSm ? (
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
                fw={600}
                size="md"
                variant="subtle"
              >
                {cq.isSm ? 'Folder' : <RiFolder2Line size="1.3rem" />}
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
              icon={<RiPlayFill />}
              onClick={() => handlePlay(Play.NOW)}
            >
              Play
            </DropdownMenu.Item>
            <DropdownMenu.Item
              icon={<RiAddBoxFill />}
              onClick={() => handlePlay(Play.LAST)}
            >
              Add to queue
            </DropdownMenu.Item>
            <DropdownMenu.Item
              icon={<RiAddCircleFill />}
              onClick={() => handlePlay(Play.NEXT)}
            >
              Add to queue next
            </DropdownMenu.Item>
            <DropdownMenu.Divider />
            <DropdownMenu.Item
              icon={<RiRefreshLine />}
              onClick={handleRefresh}
            >
              Refresh
            </DropdownMenu.Item>
          </DropdownMenu.Dropdown>
        </DropdownMenu>
      </Group>
      <Group
        noWrap
        spacing="sm"
      >
        <Button
          compact
          size="md"
          sx={{ svg: { fill: isFilterApplied ? 'var(--primary-color) !important' : undefined } }}
          tooltip={{ label: 'Filters' }}
          variant="subtle"
          onClick={handleOpenFiltersModal}
        >
          <RiFilterFill size="1.3rem" />
        </Button>
        <DropdownMenu position="bottom-end">
          <DropdownMenu.Target>
            <Button
              compact
              size="md"
              tooltip={{ label: 'Configure' }}
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
            <DropdownMenu.Label>
              {display === ListDisplayType.CARD || display === ListDisplayType.POSTER
                ? 'Items per row'
                : 'Item size'}
            </DropdownMenu.Label>
            <DropdownMenu.Item closeMenuOnClick={false}>
              <Slider
                defaultValue={
                  display === ListDisplayType.CARD || display === ListDisplayType.POSTER
                    ? grid?.itemsPerRow || 0
                    : table.rowHeight
                }
                label={null}
                max={14}
                min={2}
                onChange={debouncedHandleItemSize}
              />
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
                      data={ALBUM_TABLE_COLUMNS}
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
