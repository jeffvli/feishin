import { MutableRefObject, useCallback, useMemo } from 'react';
import type {
  BodyScrollEvent,
  ColDef,
  GridReadyEvent,
  IDatasource,
  PaginationChangedEvent,
} from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Stack } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import {
  getColumnDefs,
  TablePagination,
  VirtualGridAutoSizerContainer,
  VirtualTable,
} from '/@/renderer/components';
import { useSongList } from '/@/renderer/features/songs/queries/song-list-query';
import {
  useCurrentServer,
  useSetSongTable,
  useSetSongTablePagination,
  useSongListStore,
  useSongTablePagination,
} from '/@/renderer/store';
import { ListDisplayType } from '/@/renderer/types';
import { AnimatePresence } from 'framer-motion';
import debounce from 'lodash/debounce';

interface SongListContentProps {
  tableRef: MutableRefObject<AgGridReactType | null>;
}

export const SongListContent = ({ tableRef }: SongListContentProps) => {
  const queryClient = useQueryClient();
  const server = useCurrentServer();
  const page = useSongListStore();

  const pagination = useSongTablePagination();
  const setPagination = useSetSongTablePagination();
  const setTable = useSetSongTable();

  const isPaginationEnabled = page.display === ListDisplayType.TABLE_PAGINATED;

  const checkSongList = useSongList({
    limit: 1,
    startIndex: 0,
    ...page.filter,
  });

  const columnDefs = useMemo(() => getColumnDefs(page.table.columns), [page.table.columns]);

  const defaultColumnDefs: ColDef = useMemo(() => {
    return {
      lockPinned: true,
      lockVisible: true,
      resizable: true,
    };
  }, []);

  const onGridReady = useCallback(
    (params: GridReadyEvent) => {
      const dataSource: IDatasource = {
        getRows: async (params) => {
          const limit = params.endRow - params.startRow;
          const startIndex = params.startRow;

          const queryKey = queryKeys.songs.list(server?.id || '', {
            limit,
            startIndex,
            ...page.filter,
          });

          const songsRes = await queryClient.fetchQuery(queryKey, async ({ signal }) =>
            api.controller.getSongList({
              query: {
                limit,
                startIndex,
                ...page.filter,
              },
              server,
              signal,
            }),
          );

          const songs = api.normalize.songList(songsRes, server);
          params.successCallback(songs?.items || [], songsRes?.totalRecordCount);
        },
        rowCount: undefined,
      };
      params.api.setDatasource(dataSource);
      params.api.ensureIndexVisible(page.table.scrollOffset || 0, 'top');
    },
    [page.filter, page.table.scrollOffset, queryClient, server],
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

  const handleGridSizeChange = () => {
    if (page.table.autoFit) {
      tableRef?.current?.api.sizeColumnsToFit();
    }
  };

  const handleColumnMove = useCallback(() => {
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
            width: column.getColDef().width,
          }),
        });
      }
    }

    setTable({ columns: updatedColumns });
  }, [page.table.autoFit, page.table.columns, setTable, tableRef]);

  const handleScroll = debounce((e: BodyScrollEvent) => {
    const scrollOffset = Number((e.top / page.table.rowHeight).toFixed(0));
    setTable({ scrollOffset });
  }, 200);

  return (
    <Stack
      h="100%"
      spacing={0}
    >
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
          blockLoadDebounceMillis={200}
          cacheBlockSize={500}
          cacheOverflowSize={1}
          columnDefs={columnDefs}
          defaultColDef={defaultColumnDefs}
          enableCellChangeFlash={false}
          getRowId={(data) => data.data.uniqueId}
          infiniteInitialRowCount={checkSongList.data?.totalRecordCount || 10}
          pagination={isPaginationEnabled}
          paginationAutoPageSize={isPaginationEnabled}
          rowBuffer={20}
          rowHeight={page.table.rowHeight || 40}
          rowModelType="infinite"
          rowSelection="multiple"
          // onBodyScroll={handleScroll}
          onBodyScrollEnd={handleScroll}
          onCellContextMenu={(e) => console.log('context', e)}
          onColumnMoved={handleColumnMove}
          onGridReady={onGridReady}
          onGridSizeChanged={handleGridSizeChange}
          onPaginationChanged={onPaginationChanged}
        />
      </VirtualGridAutoSizerContainer>
      <AnimatePresence
        presenceAffectsLayout
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
    </Stack>
  );
};
