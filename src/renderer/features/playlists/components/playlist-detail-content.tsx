import { MutableRefObject, useCallback, useMemo } from 'react';
import type {
  BodyScrollEvent,
  CellContextMenuEvent,
  ColDef,
  RowDoubleClickedEvent,
} from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { getColumnDefs, VirtualTable } from '/@/renderer/components';
import { useCurrentServer, useSetSongTable, useSongListStore } from '/@/renderer/store';
import { LibraryItem } from '/@/renderer/types';
import debounce from 'lodash/debounce';
import { openContextMenu } from '/@/renderer/features/context-menu';
import { SONG_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import sortBy from 'lodash/sortBy';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { QueueSong } from '/@/renderer/api/types';
import { usePlaylistSongList } from '/@/renderer/features/playlists/queries/playlist-song-list-query';
import { useParams } from 'react-router';
import styled from 'styled-components';
import { usePlayQueueAdd } from '/@/renderer/features/player';

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  max-width: 1920px;
  padding: 1rem 2rem;
  overflow: hidden;

  .ag-theme-alpine-dark {
    --ag-header-background-color: rgba(0, 0, 0, 0%);
  }

  .ag-header-container {
    z-index: 1000;
  }

  .ag-header-cell-resize {
    top: 25%;
    width: 7px;
    height: 50%;
    background-color: rgb(70, 70, 70, 20%);
  }
`;

interface PlaylistDetailContentProps {
  tableRef: MutableRefObject<AgGridReactType | null>;
}

export const PlaylistDetailContent = ({ tableRef }: PlaylistDetailContentProps) => {
  const { playlistId } = useParams() as { playlistId: string };
  // const queryClient = useQueryClient();
  const server = useCurrentServer();
  const page = useSongListStore();

  // const pagination = useSongTablePagination();
  // const setPagination = useSetSongTablePagination();
  const setTable = useSetSongTable();
  const handlePlayQueueAdd = usePlayQueueAdd();
  const playButtonBehavior = usePlayButtonBehavior();

  // const isPaginationEnabled = page.display === ListDisplayType.TABLE_PAGINATED;

  const playlistSongsQuery = usePlaylistSongList({
    id: playlistId,
    limit: 50,
    startIndex: 0,
  });

  console.log('checkPlaylistList.data', playlistSongsQuery.data);

  const columnDefs: ColDef[] = useMemo(
    () => getColumnDefs(page.table.columns),
    [page.table.columns],
  );

  const defaultColumnDefs: ColDef = useMemo(() => {
    return {
      lockPinned: true,
      lockVisible: true,
      resizable: true,
    };
  }, []);

  // const onGridReady = useCallback(
  //   (params: GridReadyEvent) => {
  //     const dataSource: IDatasource = {
  //       getRows: async (params) => {
  //         const limit = params.endRow - params.startRow;
  //         const startIndex = params.startRow;

  //         const queryKey = queryKeys.playlists.songList(server?.id || '', playlistId, {
  //           id: playlistId,
  //           limit,
  //           startIndex,
  //         });

  //         const songsRes = await queryClient.fetchQuery(queryKey, async ({ signal }) =>
  //           api.controller.getPlaylistSongList({
  //             query: {
  //               id: playlistId,
  //               limit,
  //               startIndex,
  //             },
  //             server,
  //             signal,
  //           }),
  //         );

  //         const songs = api.normalize.songList(songsRes, server);
  //         params.successCallback(songs?.items || [], songsRes?.totalRecordCount);
  //       },
  //       rowCount: undefined,
  //     };
  //     params.api.setDatasource(dataSource);
  //     params.api.ensureIndexVisible(page.table.scrollOffset, 'top');
  //   },
  //   [page.table.scrollOffset, playlistId, queryClient, server],
  // );

  // const onPaginationChanged = useCallback(
  //   (event: PaginationChangedEvent) => {
  //     if (!isPaginationEnabled || !event.api) return;

  //     // Scroll to top of page on pagination change
  //     const currentPageStartIndex = pagination.currentPage * pagination.itemsPerPage;
  //     event.api?.ensureIndexVisible(currentPageStartIndex, 'top');

  //     setPagination({
  //       itemsPerPage: event.api.paginationGetPageSize(),
  //       totalItems: event.api.paginationGetRowCount(),
  //       totalPages: event.api.paginationGetTotalPages() + 1,
  //     });
  //   },
  //   [isPaginationEnabled, pagination.currentPage, pagination.itemsPerPage, setPagination],
  // );

  const handleGridSizeChange = () => {
    if (page.table.autoFit) {
      tableRef?.current?.api.sizeColumnsToFit();
    }
  };

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
    setTable({ scrollOffset });
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
    <ContentContainer>
      <VirtualTable
        // https://github.com/ag-grid/ag-grid/issues/5284
        // Key is used to force remount of table when display, rowHeight, or server changes
        key={`table-${page.display}-${page.table.rowHeight}-${server?.id}`}
        ref={tableRef}
        animateRows
        detailRowAutoHeight
        maintainColumnOrder
        suppressCopyRowsToClipboard
        suppressMoveWhenRowDragging
        suppressPaginationPanel
        suppressRowDrag
        suppressScrollOnNewData
        columnDefs={columnDefs}
        defaultColDef={defaultColumnDefs}
        enableCellChangeFlash={false}
        rowData={playlistSongsQuery.data?.items}
        rowHeight={page.table.rowHeight || 60}
        rowSelection="multiple"
        onBodyScrollEnd={handleScroll}
        onCellContextMenu={handleContextMenu}
        onColumnMoved={handleColumnChange}
        onColumnResized={debouncedColumnChange}
        onGridReady={(params) => {
          params.api.setDomLayout('autoHeight');
          params.api.sizeColumnsToFit();
        }}
        onGridSizeChanged={handleGridSizeChange}
        onRowDoubleClicked={handleRowDoubleClick}
      />
      {/* <AnimatePresence
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
      </AnimatePresence> */}
    </ContentContainer>
  );
};
