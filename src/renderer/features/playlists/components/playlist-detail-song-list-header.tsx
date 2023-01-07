import { IDatasource } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Flex, Group, Stack } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, MutableRefObject, useCallback, MouseEvent } from 'react';
import { RiArrowDownSLine, RiMoreFill, RiSortAsc, RiSortDesc } from 'react-icons/ri';
import { useParams } from 'react-router';
import styled from 'styled-components';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import {
  LibraryItem,
  PlaylistSongListQuery,
  ServerType,
  SongListSort,
  SortOrder,
} from '/@/renderer/api/types';
import {
  Button,
  DropdownMenu,
  MultiSelect,
  PageHeader,
  Slider,
  SONG_TABLE_COLUMNS,
  Switch,
  Text,
  TextTitle,
} from '/@/renderer/components';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { usePlaylistDetail } from '/@/renderer/features/playlists/queries/playlist-detail-query';
import { useContainerQuery } from '/@/renderer/hooks';
import {
  useCurrentServer,
  usePlaylistDetailStore,
  useSetPlaylistTablePagination,
  useSetPlaylistDetailTable,
  SongListFilter,
  useSetPlaylistDetailFilters,
  useSetPlaylistStore,
} from '/@/renderer/store';
import { ListDisplayType, Play, TableColumn } from '/@/renderer/types';

const FILTERS = {
  jellyfin: [
    { defaultOrder: SortOrder.ASC, name: 'Album', value: SongListSort.ALBUM },
    { defaultOrder: SortOrder.ASC, name: 'Album Artist', value: SongListSort.ALBUM_ARTIST },
    { defaultOrder: SortOrder.ASC, name: 'Artist', value: SongListSort.ARTIST },
    { defaultOrder: SortOrder.ASC, name: 'Duration', value: SongListSort.DURATION },
    { defaultOrder: SortOrder.ASC, name: 'Most Played', value: SongListSort.PLAY_COUNT },
    { defaultOrder: SortOrder.ASC, name: 'Name', value: SongListSort.NAME },
    { defaultOrder: SortOrder.ASC, name: 'Random', value: SongListSort.RANDOM },
    { defaultOrder: SortOrder.ASC, name: 'Recently Added', value: SongListSort.RECENTLY_ADDED },
    { defaultOrder: SortOrder.ASC, name: 'Recently Played', value: SongListSort.RECENTLY_PLAYED },
    { defaultOrder: SortOrder.ASC, name: 'Release Date', value: SongListSort.RELEASE_DATE },
  ],
  navidrome: [
    { defaultOrder: SortOrder.ASC, name: 'Album', value: SongListSort.ALBUM },
    { defaultOrder: SortOrder.ASC, name: 'Album Artist', value: SongListSort.ALBUM_ARTIST },
    { defaultOrder: SortOrder.ASC, name: 'Artist', value: SongListSort.ARTIST },
    { defaultOrder: SortOrder.DESC, name: 'BPM', value: SongListSort.BPM },
    { defaultOrder: SortOrder.ASC, name: 'Channels', value: SongListSort.CHANNELS },
    { defaultOrder: SortOrder.ASC, name: 'Comment', value: SongListSort.COMMENT },
    { defaultOrder: SortOrder.DESC, name: 'Duration', value: SongListSort.DURATION },
    { defaultOrder: SortOrder.DESC, name: 'Favorited', value: SongListSort.FAVORITED },
    { defaultOrder: SortOrder.ASC, name: 'Genre', value: SongListSort.GENRE },
    { defaultOrder: SortOrder.ASC, name: 'Id', value: SongListSort.ID },
    { defaultOrder: SortOrder.ASC, name: 'Name', value: SongListSort.NAME },
    { defaultOrder: SortOrder.DESC, name: 'Play Count', value: SongListSort.PLAY_COUNT },
    { defaultOrder: SortOrder.DESC, name: 'Rating', value: SongListSort.RATING },
    { defaultOrder: SortOrder.DESC, name: 'Recently Added', value: SongListSort.RECENTLY_ADDED },
    { defaultOrder: SortOrder.DESC, name: 'Recently Played', value: SongListSort.RECENTLY_PLAYED },
    { defaultOrder: SortOrder.DESC, name: 'Year', value: SongListSort.YEAR },
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

interface PlaylistDetailHeaderProps {
  handleToggleShowQueryBuilder: () => void;
  tableRef: MutableRefObject<AgGridReactType | null>;
}

export const PlaylistDetailSongListHeader = ({
  tableRef,
  handleToggleShowQueryBuilder,
}: PlaylistDetailHeaderProps) => {
  const { playlistId } = useParams() as { playlistId: string };

  const queryClient = useQueryClient();
  const server = useCurrentServer();
  const setPage = useSetPlaylistStore();
  const setFilter = useSetPlaylistDetailFilters();
  const page = usePlaylistDetailStore();
  const filters: Partial<PlaylistSongListQuery> = {
    sortBy: page?.table.id[playlistId]?.filter?.sortBy || SongListSort.ID,
    sortOrder: page?.table.id[playlistId]?.filter?.sortOrder || SortOrder.ASC,
  };

  const detailQuery = usePlaylistDetail({ id: playlistId });
  const handlePlayQueueAdd = usePlayQueueAdd();

  const cq = useContainerQuery();

  const setPagination = useSetPlaylistTablePagination();
  const setTable = useSetPlaylistDetailTable();

  const sortByLabel =
    (server?.type &&
      FILTERS[server.type as keyof typeof FILTERS].find((f) => f.value === filters.sortBy)?.name) ||
    'Unknown';

  const sortOrderLabel = ORDER.find((o) => o.value === filters.sortOrder)?.name || 'Unknown';

  const handleItemSize = (e: number) => {
    setTable({ rowHeight: e });
  };

  const handleFilterChange = useCallback(
    async (filters: SongListFilter) => {
      const dataSource: IDatasource = {
        getRows: async (params) => {
          const limit = params.endRow - params.startRow;
          const startIndex = params.startRow;

          const queryKey = queryKeys.playlists.songList(server?.id || '', playlistId, {
            id: playlistId,
            limit,
            startIndex,
            ...filters,
          });

          const songsRes = await queryClient.fetchQuery(
            queryKey,
            async ({ signal }) =>
              api.controller.getPlaylistSongList({
                query: {
                  id: playlistId,
                  limit,
                  startIndex,
                  ...filters,
                },
                server,
                signal,
              }),
            { cacheTime: 1000 * 60 * 1 },
          );

          const songs = api.normalize.songList(songsRes, server);
          params.successCallback(songs?.items || [], songsRes?.totalRecordCount || undefined);
        },
        rowCount: undefined,
      };
      tableRef.current?.api.setDatasource(dataSource);
      tableRef.current?.api.purgeInfiniteCache();
      tableRef.current?.api.ensureIndexVisible(0, 'top');

      if (page.display === ListDisplayType.TABLE_PAGINATED) {
        setPagination({ currentPage: 0 });
      }
    },
    [tableRef, page.display, server, playlistId, queryClient, setPagination],
  );

  const handleSetSortBy = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget?.value || !server?.type) return;

      const sortOrder = FILTERS[server.type as keyof typeof FILTERS].find(
        (f) => f.value === e.currentTarget.value,
      )?.defaultOrder;

      const updatedFilters = setFilter(playlistId, {
        sortBy: e.currentTarget.value as SongListSort,
        sortOrder: sortOrder || SortOrder.ASC,
      });

      handleFilterChange(updatedFilters);
    },
    [handleFilterChange, playlistId, server?.type, setFilter],
  );

  const handleToggleSortOrder = useCallback(() => {
    const newSortOrder = filters.sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;
    const updatedFilters = setFilter(playlistId, { sortOrder: newSortOrder });
    handleFilterChange(updatedFilters);
  }, [filters.sortOrder, handleFilterChange, playlistId, setFilter]);

  const handleSetViewType = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!e.currentTarget?.value) return;
      setPage({ detail: { ...page, display: e.currentTarget.value as ListDisplayType } });
    },
    [page, setPage],
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

  const handlePlay = async (playType: Play) => {
    handlePlayQueueAdd?.({
      byItemType: { id: [playlistId], type: LibraryItem.PLAYLIST },
      play: playType,
    });
  };

  if (detailQuery.isLoading) return null;

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
                  fw="bold"
                  order={3}
                >
                  {detailQuery?.data?.name}
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
              <DropdownMenu.Label>Item size</DropdownMenu.Label>
              <DropdownMenu.Item closeMenuOnClick={false}>
                <Slider
                  defaultValue={page.table.rowHeight}
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
                        data={SONG_TABLE_COLUMNS}
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
              <DropdownMenu.Item onClick={() => handlePlay(Play.NOW)}>Play</DropdownMenu.Item>
              <DropdownMenu.Item onClick={() => handlePlay(Play.LAST)}>
                Add to queue
              </DropdownMenu.Item>
              <DropdownMenu.Item onClick={() => handlePlay(Play.NEXT)}>
                Add to queue next
              </DropdownMenu.Item>
              <DropdownMenu.Divider />
              <DropdownMenu.Item
                disabled
                onClick={() => handlePlay(Play.LAST)}
              >
                Edit playlist
              </DropdownMenu.Item>
              <DropdownMenu.Item
                disabled
                onClick={() => handlePlay(Play.LAST)}
              >
                Delete playlist
              </DropdownMenu.Item>
              {server?.type === ServerType.NAVIDROME && !detailQuery?.data?.rules && (
                <>
                  <DropdownMenu.Divider />
                  <DropdownMenu.Item
                    $danger
                    onClick={handleToggleShowQueryBuilder}
                  >
                    Toggle smart playlist editor
                  </DropdownMenu.Item>
                </>
              )}
            </DropdownMenu.Dropdown>
          </DropdownMenu>
        </Flex>
      </HeaderItems>
    </PageHeader>
  );
};
