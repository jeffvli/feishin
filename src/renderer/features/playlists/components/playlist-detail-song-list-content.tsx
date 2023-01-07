import { MutableRefObject, useCallback, useMemo } from 'react';
import type {
  BodyScrollEvent,
  CellContextMenuEvent,
  ColDef,
  GridReadyEvent,
  IDatasource,
  PaginationChangedEvent,
  RowDoubleClickedEvent,
} from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { getColumnDefs, TablePagination, VirtualTable } from '/@/renderer/components';
import {
  useCurrentServer,
  usePlaylistDetailStore,
  usePlaylistDetailTablePagination,
  useSetPlaylistDetailTable,
  useSetPlaylistDetailTablePagination,
} from '/@/renderer/store';
import { ListDisplayType } from '/@/renderer/types';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import debounce from 'lodash/debounce';
import { openContextMenu } from '/@/renderer/features/context-menu';
import { SONG_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import sortBy from 'lodash/sortBy';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import {
  LibraryItem,
  PlaylistSongListQuery,
  QueueSong,
  SongListSort,
  SortOrder,
} from '/@/renderer/api/types';
import { usePlaylistSongList } from '/@/renderer/features/playlists/queries/playlist-song-list-query';
import { useParams } from 'react-router';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';

interface PlaylistDetailContentProps {
  tableRef: MutableRefObject<AgGridReactType | null>;
}

export const PlaylistDetailSongListContent = ({ tableRef }: PlaylistDetailContentProps) => {
  const { playlistId } = useParams() as { playlistId: string };
  const queryClient = useQueryClient();
  const server = useCurrentServer();
  const page = usePlaylistDetailStore();
  const filters: Partial<PlaylistSongListQuery> = useMemo(() => {
    return {
      sortBy: page?.table.id[playlistId]?.filter?.sortBy || SongListSort.ID,
      sortOrder: page?.table.id[playlistId]?.filter?.sortOrder || SortOrder.ASC,
    };
  }, [page?.table.id, playlistId]);

  const p = usePlaylistDetailTablePagination(playlistId);
  const pagination = {
    currentPage: p?.currentPage || 0,
    itemsPerPage: p?.itemsPerPage || 100,
    scrollOffset: p?.scrollOffset || 0,
    totalItems: p?.totalItems || 1,
    totalPages: p?.totalPages || 1,
  };

  const setPagination = useSetPlaylistDetailTablePagination();
  const setTable = useSetPlaylistDetailTable();
  const handlePlayQueueAdd = usePlayQueueAdd();
  const playButtonBehavior = usePlayButtonBehavior();

  const isPaginationEnabled = page.display === ListDisplayType.TABLE_PAGINATED;

  const checkPlaylistList = usePlaylistSongList({
    id: playlistId,
    limit: 1,
    startIndex: 0,
  });

  const columnDefs: ColDef[] = useMemo(
    () => getColumnDefs(page.table.columns),
    [page.table.columns],
  );

  const onGridReady = useCallback(
    (params: GridReadyEvent) => {
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
          params.successCallback(songs?.items || [], songsRes?.totalRecordCount);
        },
        rowCount: undefined,
      };
      params.api.setDatasource(dataSource);
      params.api.ensureIndexVisible(pagination.scrollOffset, 'top');
    },
    [filters, pagination.scrollOffset, playlistId, queryClient, server],
  );

  const onPaginationChanged = useCallback(
    (event: PaginationChangedEvent) => {
      if (!isPaginationEnabled || !event.api) return;

      // Scroll to top of page on pagination change
      const currentPageStartIndex = pagination.currentPage * pagination.itemsPerPage;
      event.api?.ensureIndexVisible(currentPageStartIndex, 'top');

      setPagination(playlistId, {
        itemsPerPage: event.api.paginationGetPageSize(),
        totalItems: event.api.paginationGetRowCount(),
        totalPages: event.api.paginationGetTotalPages() + 1,
      });
    },
    [
      isPaginationEnabled,
      pagination.currentPage,
      pagination.itemsPerPage,
      playlistId,
      setPagination,
    ],
  );

  const handleColumnChange = useCallback(() => {
    const { columnApi } = tableRef?.current || {};
    const columnsOrder = columnApi?.getAllGridColumns();

    if (!columnsOrder) return;

    const columnsInSettings = page.table.columns;
    const updatedColumns = [];
    for (const column of columnsOrder) {
      const columnInSettings = columnsInSettings.find((c) => c.column === column.getColDef().colId);

      if (columnInSettings) {
        updatedColumns.push({
          ...columnInSettings,
          ...(!page.table.autoFit && {
            width: column.getActualWidth(),
          }),
        });
      }
    }

    setTable({ columns: updatedColumns });
  }, [page.table.autoFit, page.table.columns, setTable, tableRef]);

  const debouncedColumnChange = debounce(handleColumnChange, 200);

  const handleScroll = (e: BodyScrollEvent) => {
    const scrollOffset = Number((e.top / page.table.rowHeight).toFixed(0));
    setPagination(playlistId, { scrollOffset });
  };

  const handleContextMenu = (e: CellContextMenuEvent) => {
    if (!e.event) return;
    const clickEvent = e.event as MouseEvent;
    clickEvent.preventDefault();

    const selectedNodes = e.api.getSelectedNodes();
    const selectedIds = selectedNodes.map((node) => node.data.id);
    let selectedRows = sortBy(selectedNodes, ['rowIndex']).map((node) => node.data);

    if (!selectedIds.includes(e.data.id)) {
      e.api.deselectAll();
      e.node.setSelected(true);
      selectedRows = [e.data];
    }

    openContextMenu({
      data: selectedRows,
      menuItems: SONG_CONTEXT_MENU_ITEMS,
      type: LibraryItem.SONG,
      xPos: clickEvent.clientX,
      yPos: clickEvent.clientY,
    });
  };

  const handleRowDoubleClick = (e: RowDoubleClickedEvent<QueueSong>) => {
    if (!e.data) return;
    handlePlayQueueAdd?.({
      byData: [e.data],
      play: playButtonBehavior,
    });
  };

  return (
    <>
      <VirtualTable
        // https://github.com/ag-grid/ag-grid/issues/5284
        // Key is used to force remount of table when display, rowHeight, or server changes
        key={`table-${page.display}-${page.table.rowHeight}-${server?.id}`}
        ref={tableRef}
        alwaysShowHorizontalScroll
        columnDefs={columnDefs}
        getRowId={(data) => data.data.uniqueId}
        infiniteInitialRowCount={checkPlaylistList.data?.totalRecordCount || 1}
        pagination={isPaginationEnabled}
        paginationAutoPageSize={isPaginationEnabled}
        paginationPageSize={pagination.itemsPerPage || 100}
        rowHeight={page.table.rowHeight || 40}
        rowModelType="infinite"
        onBodyScrollEnd={handleScroll}
        onCellContextMenu={handleContextMenu}
        onColumnMoved={handleColumnChange}
        onColumnResized={debouncedColumnChange}
        onGridReady={onGridReady}
        onPaginationChanged={onPaginationChanged}
        onRowDoubleClicked={handleRowDoubleClick}
      />
      <AnimatePresence
        presenceAffectsLayout
        initial={false}
        mode="wait"
      >
        {page.display === ListDisplayType.TABLE_PAGINATED && (
          <TablePagination
            id={playlistId}
            pagination={pagination}
            setIdPagination={setPagination}
            tableRef={tableRef}
          />
        )}
      </AnimatePresence>
    </>
  );
};
