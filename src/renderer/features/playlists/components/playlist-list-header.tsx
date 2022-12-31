import type { IDatasource } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Flex, Group, Stack } from '@mantine/core';
import { ChangeEvent, MouseEvent, MutableRefObject, useCallback } from 'react';
import { RiArrowDownSLine, RiMoreFill, RiSortAsc, RiSortDesc } from 'react-icons/ri';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { PlaylistListSort, SortOrder } from '/@/renderer/api/types';
import {
  Button,
  DropdownMenu,
  PageHeader,
  Slider,
  TextTitle,
  Switch,
  MultiSelect,
  Text,
  PLAYLIST_TABLE_COLUMNS,
} from '/@/renderer/components';
import { useContainerQuery } from '/@/renderer/hooks';
import { queryClient } from '/@/renderer/lib/react-query';
import {
  PlaylistListFilter,
  useCurrentServer,
  usePlaylistListStore,
  useSetPlaylistFilters,
  useSetPlaylistStore,
  useSetPlaylistTable,
  useSetPlaylistTablePagination,
} from '/@/renderer/store';
import { ListDisplayType, TableColumn } from '/@/renderer/types';

const FILTERS = {
  jellyfin: [
    { defaultOrder: SortOrder.DESC, name: 'Duration', value: PlaylistListSort.DURATION },
    { defaultOrder: SortOrder.ASC, name: 'Name', value: PlaylistListSort.NAME },
    { defaultOrder: SortOrder.DESC, name: 'Song Count', value: PlaylistListSort.SONG_COUNT },
  ],
  navidrome: [
    { defaultOrder: SortOrder.DESC, name: 'Duration', value: PlaylistListSort.DURATION },
    { defaultOrder: SortOrder.ASC, name: 'Name', value: PlaylistListSort.NAME },
    { defaultOrder: SortOrder.ASC, name: 'Owner', value: PlaylistListSort.OWNER },
    { defaultOrder: SortOrder.DESC, name: 'Public', value: PlaylistListSort.PUBLIC },
    { defaultOrder: SortOrder.DESC, name: 'Song Count', value: PlaylistListSort.SONG_COUNT },
    { defaultOrder: SortOrder.DESC, name: 'Updated At', value: PlaylistListSort.UPDATED_AT },
  ],
};

const ORDER = [
  { name: 'Ascending', value: SortOrder.ASC },
  { name: 'Descending', value: SortOrder.DESC },
];

interface PlaylistListHeaderProps {
  tableRef: MutableRefObject<AgGridReactType | null>;
}

export const PlaylistListHeader = ({ tableRef }: PlaylistListHeaderProps) => {
  const server = useCurrentServer();
  const page = usePlaylistListStore();
  const setPage = useSetPlaylistStore();
  const setFilter = useSetPlaylistFilters();
  const setTable = useSetPlaylistTable();
  const setPagination = useSetPlaylistTablePagination();
  const cq = useContainerQuery();

  const sortByLabel =
    (server?.type &&
      (FILTERS[server.type as keyof typeof FILTERS] as { name: string; value: string }[]).find(
        (f) => f.value === page.filter.sortBy,
      )?.name) ||
    'Unknown';

  const sortOrderLabel = ORDER.find((s) => s.value === page.filter.sortOrder)?.name;

  const handleFilterChange = useCallback(
    async (filters?: PlaylistListFilter) => {
      const dataSource: IDatasource = {
        getRows: async (params) => {
          const limit = params.endRow - params.startRow;
          const startIndex = params.startRow;

          const pageFilters = filters || page.filter;

          const queryKey = queryKeys.playlists.list(server?.id || '', {
            limit,
            startIndex,
            ...pageFilters,
          });

          const playlistsRes = await queryClient.fetchQuery(queryKey, async ({ signal }) =>
            api.controller.getPlaylistList({
              query: {
                limit,
                startIndex,
                ...pageFilters,
              },
              server,
              signal,
            }),
          );

          const playlists = api.normalize.playlistList(playlistsRes, server);
          params.successCallback(playlists?.items || [], playlistsRes?.totalRecordCount);
        },
        rowCount: undefined,
      };
      tableRef.current?.api.setDatasource(dataSource);
      tableRef.current?.api.purgeInfiniteCache();
      tableRef.current?.api.ensureIndexVisible(0, 'top');
      setPagination({ currentPage: 0 });
    },
    [page.filter, server, setPagination, tableRef],
  );

  const handleSetSortBy = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget?.value || !server?.type) return;

      const sortOrder = FILTERS[server.type as keyof typeof FILTERS].find(
        (f) => f.value === e.currentTarget.value,
      )?.defaultOrder;

      const updatedFilters = setFilter({
        sortBy: e.currentTarget.value as PlaylistListSort,
        sortOrder: sortOrder || SortOrder.ASC,
      });

      handleFilterChange(updatedFilters);
    },
    [handleFilterChange, server?.type, setFilter],
  );

  const handleToggleSortOrder = useCallback(() => {
    const newSortOrder = page.filter.sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;
    const updatedFilters = setFilter({ sortOrder: newSortOrder });
    handleFilterChange(updatedFilters);
  }, [page.filter.sortOrder, handleFilterChange, setFilter]);

  const handleSetViewType = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget?.value) return;
      const display = e.currentTarget.value as ListDisplayType;
      setPage({ list: { ...page, display: e.currentTarget.value as ListDisplayType } });

      if (display === ListDisplayType.TABLE) {
        tableRef.current?.api.paginationSetPageSize(tableRef.current.props.infiniteInitialRowCount);
        setPagination({ currentPage: 0 });
      } else if (display === ListDisplayType.TABLE_PAGINATED) {
        setPagination({ currentPage: 0 });
      }
    },
    [page, setPage, setPagination, tableRef],
  );

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

      return setTable({ columns: [...existingColumns, newColumn] });
    }

    // If removing a column
    const removed = existingColumns.filter((column) => !values.includes(column.column));
    const newColumns = existingColumns.filter((column) => !removed.includes(column));

    return setTable({ columns: newColumns });
  };

  const handleAutoFitColumns = (e: ChangeEvent<HTMLInputElement>) => {
    setTable({ autoFit: e.currentTarget.checked });

    if (e.currentTarget.checked) {
      tableRef.current?.api.sizeColumnsToFit();
    }
  };

  const handleRowHeight = (e: number) => {
    setTable({ rowHeight: e });
  };

  return (
    <PageHeader>
      <Flex
        ref={cq.ref}
        direction="row"
        justify="space-between"
      >
        <Flex
          align="center"
          gap="md"
          justify="center"
        >
          <DropdownMenu position="bottom-start">
            <DropdownMenu.Target>
              <Button
                compact
                rightIcon={<RiArrowDownSLine size={15} />}
                size="xl"
                sx={{ paddingLeft: 0, paddingRight: 0 }}
                variant="subtle"
              >
                <TextTitle
                  fw="bold"
                  order={3}
                >
                  Playlists
                </TextTitle>
              </Button>
            </DropdownMenu.Target>
            <DropdownMenu.Dropdown>
              <DropdownMenu.Label>Display type</DropdownMenu.Label>
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
              <DropdownMenu.Label>Item Size</DropdownMenu.Label>
              <DropdownMenu.Item closeMenuOnClick={false}>
                <Slider
                  defaultValue={page.table.rowHeight || 0}
                  label={null}
                  max={100}
                  min={25}
                  onChangeEnd={handleRowHeight}
                />
              </DropdownMenu.Item>
              <DropdownMenu.Label>Table Columns</DropdownMenu.Label>
              <DropdownMenu.Item
                closeMenuOnClick={false}
                component="div"
                sx={{ cursor: 'default' }}
              >
                <Stack>
                  <MultiSelect
                    clearable
                    data={PLAYLIST_TABLE_COLUMNS}
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
                  $isActive={filter.value === page.filter.sortBy}
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
                {page.filter.sortOrder === SortOrder.ASC ? (
                  <RiSortAsc size={15} />
                ) : (
                  <RiSortDesc size={15} />
                )}
              </>
            )}
          </Button>
          <DropdownMenu position="bottom-start">
            <DropdownMenu.Target>
              <Button
                compact
                fw="600"
                variant="subtle"
              >
                <RiMoreFill size={15} />
              </Button>
            </DropdownMenu.Target>
            <DropdownMenu.Dropdown>
              <DropdownMenu.Item disabled>Play</DropdownMenu.Item>
              <DropdownMenu.Item disabled>Add to queue (last)</DropdownMenu.Item>
              <DropdownMenu.Item disabled>Add to queue (next)</DropdownMenu.Item>
              <DropdownMenu.Item disabled>Add to playlist</DropdownMenu.Item>
            </DropdownMenu.Dropdown>
          </DropdownMenu>
        </Flex>
      </Flex>
    </PageHeader>
  );
};
