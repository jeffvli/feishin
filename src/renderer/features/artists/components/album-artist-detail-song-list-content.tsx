import { MutableRefObject, useCallback, useMemo } from 'react';
import type {
  ColDef,
  GridReadyEvent,
  IDatasource,
  PaginationChangedEvent,
  RowDoubleClickedEvent,
} from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useSetState } from '@mantine/hooks';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import {
  getColumnDefs,
  TablePagination,
  VirtualGridAutoSizerContainer,
  VirtualTable,
} from '/@/renderer/components';
import {
  SongListFilter,
  useCurrentServer,
  useSetSongTable,
  useSongListStore,
} from '/@/renderer/store';
import { ListDisplayType, TablePagination as TablePaginationType } from '/@/renderer/types';
import { AnimatePresence } from 'framer-motion';
import debounce from 'lodash/debounce';
import { useHandleTableContextMenu } from '/@/renderer/features/context-menu';
import { SONG_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { LibraryItem, QueueSong } from '/@/renderer/api/types';
import { usePlayQueueAdd } from '/@/renderer/features/player';

interface AlbumArtistSongListContentProps {
  filter: SongListFilter;
  itemCount?: number;
  tableRef: MutableRefObject<AgGridReactType | null>;
}

export const AlbumArtistDetailSongListContent = ({
  itemCount,
  filter,
  tableRef,
}: AlbumArtistSongListContentProps) => {
  const queryClient = useQueryClient();
  const server = useCurrentServer();
  const page = useSongListStore();

  const [pagination, setPagination] = useSetState<TablePaginationType>({
    currentPage: 0,
    itemsPerPage: 100,
    totalItems: itemCount || 0,
    totalPages: 0,
  });

  const setTable = useSetSongTable();
  const handlePlayQueueAdd = usePlayQueueAdd();
  const playButtonBehavior = usePlayButtonBehavior();

  const isPaginationEnabled = page.display === ListDisplayType.TABLE_PAGINATED;

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

          const queryKey = queryKeys.songs.list(server?.id || '', {
            ...filter,
            limit,
            startIndex,
          });

          const songsRes = await queryClient.fetchQuery(
            queryKey,
            async ({ signal }) =>
              api.controller.getSongList({
                query: {
                  ...filter,
                  limit,
                  startIndex,
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
    },
    [filter, queryClient, server],
  );

  const onPaginationChanged = useCallback(
    (event: PaginationChangedEvent) => {
      if (!isPaginationEnabled || !event.api) return;

      // Scroll to top of page on pagination change
      const currentPageStartIndex = pagination.currentPage * pagination.itemsPerPage;
      event.api?.ensureIndexVisible(currentPageStartIndex, 'top');

      setPagination({
        itemsPerPage: event.api.paginationGetPageSize(),
        totalItems: event.api.paginationGetRowCount(),
        totalPages: event.api.paginationGetTotalPages() + 1,
      });
    },
    [isPaginationEnabled, pagination.currentPage, pagination.itemsPerPage, setPagination],
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

  const handleContextMenu = useHandleTableContextMenu(LibraryItem.SONG, SONG_CONTEXT_MENU_ITEMS);

  const handleRowDoubleClick = (e: RowDoubleClickedEvent<QueueSong>) => {
    if (!e.data) return;
    handlePlayQueueAdd?.({
      byData: [e.data],
      play: playButtonBehavior,
    });
  };

  return (
    <>
      <VirtualGridAutoSizerContainer>
        <VirtualTable
          // https://github.com/ag-grid/ag-grid/issues/5284
          // Key is used to force remount of table when display, rowHeight, or server changes
          key={`table-${page.display}-${page.table.rowHeight}-${server?.id}`}
          ref={tableRef}
          alwaysShowHorizontalScroll
          animateRows
          maintainColumnOrder
          suppressCopyRowsToClipboard
          suppressMoveWhenRowDragging
          suppressPaginationPanel
          suppressRowDrag
          suppressScrollOnNewData
          autoFitColumns={page.table.autoFit}
          blockLoadDebounceMillis={200}
          cacheBlockSize={500}
          cacheOverflowSize={1}
          columnDefs={columnDefs}
          enableCellChangeFlash={false}
          getRowId={(data) => data.data.id}
          infiniteInitialRowCount={itemCount || 100}
          pagination={isPaginationEnabled}
          paginationAutoPageSize={isPaginationEnabled}
          paginationPageSize={page.table.pagination.itemsPerPage || 100}
          rowBuffer={20}
          rowHeight={page.table.rowHeight || 40}
          rowModelType="infinite"
          rowSelection="multiple"
          onCellContextMenu={handleContextMenu}
          onColumnMoved={handleColumnChange}
          onColumnResized={debouncedColumnChange}
          onGridReady={onGridReady}
          onPaginationChanged={onPaginationChanged}
          onRowDoubleClicked={handleRowDoubleClick}
        />
      </VirtualGridAutoSizerContainer>
      <AnimatePresence
        presenceAffectsLayout
        initial={false}
        mode="wait"
      >
        {page.display === ListDisplayType.TABLE_PAGINATED && (
          <TablePagination
            pagination={pagination}
            setPagination={setPagination}
            tableRef={tableRef}
          />
        )}
      </AnimatePresence>
    </>
  );
};
