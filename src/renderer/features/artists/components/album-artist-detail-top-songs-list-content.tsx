import { MutableRefObject, useMemo } from 'react';
import type { ColDef, RowDoubleClickedEvent } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useCurrentServer, useSongListStore } from '/@/renderer/store';
import { useHandleTableContextMenu } from '/@/renderer/features/context-menu';
import { SONG_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { LibraryItem, QueueSong } from '/@/renderer/api/types';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid';
import { getColumnDefs, VirtualTable } from '/@/renderer/components/virtual-table';

interface AlbumArtistSongListContentProps {
  data: QueueSong[];
  tableRef: MutableRefObject<AgGridReactType | null>;
}

export const AlbumArtistDetailTopSongsListContent = ({
  tableRef,
  data,
}: AlbumArtistSongListContentProps) => {
  const server = useCurrentServer();
  const page = useSongListStore();

  const handlePlayQueueAdd = usePlayQueueAdd();
  const playButtonBehavior = usePlayButtonBehavior();

  const columnDefs: ColDef[] = useMemo(
    () => getColumnDefs(page.table.columns),
    [page.table.columns],
  );

  const handleContextMenu = useHandleTableContextMenu(LibraryItem.SONG, SONG_CONTEXT_MENU_ITEMS);

  const handleRowDoubleClick = (e: RowDoubleClickedEvent<QueueSong>) => {
    if (!e.data) return;
    handlePlayQueueAdd?.({
      byData: [e.data],
      playType: playButtonBehavior,
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
          columnDefs={columnDefs}
          enableCellChangeFlash={false}
          getRowId={(data) => data.data.uniqueId}
          rowBuffer={20}
          rowData={data}
          rowHeight={page.table.rowHeight || 40}
          rowModelType="clientSide"
          rowSelection="multiple"
          onCellContextMenu={handleContextMenu}
          onRowDoubleClicked={handleRowDoubleClick}
        />
      </VirtualGridAutoSizerContainer>
    </>
  );
};
