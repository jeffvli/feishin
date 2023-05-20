import {
  ColDef,
  GridReadyEvent,
  RowDoubleClickedEvent,
  IDatasource,
} from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Stack } from '@mantine/core';
import { MutableRefObject, useMemo, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { LibraryItem, QueueSong } from '/@/renderer/api/types';
import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid';
import { VirtualTable, getColumnDefs } from '/@/renderer/components/virtual-table';
import { useHandleTableContextMenu } from '/@/renderer/features/context-menu';
import { SONG_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { generatePath, useNavigate } from 'react-router';
import { AppRoute } from '../../../router/routes';
import {
  useCurrentServer,
  useSongListStore,
  usePlayButtonBehavior,
  useAlbumListStore,
  useAlbumArtistListStore,
} from '/@/renderer/store';

interface SearchContentProps {
  getDatasource: (searchQuery: string, itemType: LibraryItem) => IDatasource | undefined;
  tableRef: MutableRefObject<AgGridReactType | null>;
}

export const SearchContent = ({ tableRef, getDatasource }: SearchContentProps) => {
  const navigate = useNavigate();
  const server = useCurrentServer();
  const { itemType } = useParams() as { itemType: LibraryItem };
  const [searchParams] = useSearchParams();
  const songListStore = useSongListStore();
  const albumListStore = useAlbumListStore();
  const albumArtistListStore = useAlbumArtistListStore();
  const handlePlayQueueAdd = usePlayQueueAdd();
  const playButtonBehavior = usePlayButtonBehavior();

  const isPaginationEnabled = true;

  const getTable = useCallback(
    (itemType: string) => {
      switch (itemType) {
        case LibraryItem.SONG:
          return songListStore.table;
        case LibraryItem.ALBUM:
          return albumListStore.table;
        case LibraryItem.ALBUM_ARTIST:
          return albumArtistListStore.table;
        default:
          return undefined;
      }
    },
    [albumArtistListStore.table, albumListStore.table, songListStore.table],
  );

  const table = getTable(itemType)!;

  const columnDefs: ColDef[] = useMemo(() => getColumnDefs(table.columns), [table.columns]);

  const onGridReady = useCallback(
    (params: GridReadyEvent) => {
      const datasource = getDatasource(searchParams.get('query') || '', itemType);
      if (!datasource) return;

      params.api.setDatasource(datasource);
      params.api.ensureIndexVisible(table.scrollOffset, 'top');
    },
    [getDatasource, itemType, searchParams, table.scrollOffset],
  );

  const handleGridSizeChange = () => {
    if (table.autoFit) {
      tableRef?.current?.api.sizeColumnsToFit();
    }
  };

  const handleContextMenu = useHandleTableContextMenu(LibraryItem.SONG, SONG_CONTEXT_MENU_ITEMS);

  const handleRowDoubleClick = (e: RowDoubleClickedEvent<QueueSong>) => {
    if (!e.data) return;
    switch (itemType) {
      case LibraryItem.ALBUM:
        navigate(generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, { albumId: e.data.id }));
        break;
      case LibraryItem.ALBUM_ARTIST:
        navigate(generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, { albumArtistId: e.data.id }));
        break;
      case LibraryItem.SONG:
        handlePlayQueueAdd?.({
          byData: [e.data],
          play: playButtonBehavior,
        });
        break;
    }
  };

  return (
    <Stack
      h="100%"
      spacing={0}
    >
      <VirtualGridAutoSizerContainer>
        <VirtualTable
          // https://github.com/ag-grid/ag-grid/issues/5284
          // Key is used to force remount of table when display, rowHeight, or server changes
          key={`table-${itemType}-${table.rowHeight}-${server?.id}`}
          ref={tableRef}
          alwaysShowHorizontalScroll
          suppressRowDrag
          autoFitColumns={table.autoFit}
          blockLoadDebounceMillis={200}
          cacheBlockSize={25}
          cacheOverflowSize={1}
          columnDefs={columnDefs}
          context={{
            query: searchParams.get('query'),
          }}
          getRowId={(data) => data.data.id}
          infiniteInitialRowCount={25}
          pagination={isPaginationEnabled}
          paginationAutoPageSize={isPaginationEnabled}
          paginationPageSize={table.pagination.itemsPerPage || 100}
          rowBuffer={20}
          rowHeight={table.rowHeight || 40}
          rowModelType="infinite"
          rowSelection="multiple"
          // onBodyScrollEnd={handleScroll}
          onCellContextMenu={handleContextMenu}
          // onColumnMoved={handleColumnChange}
          // onColumnResized={debouncedColumnChange}
          onGridReady={onGridReady}
          onGridSizeChanged={handleGridSizeChange}
          onRowDoubleClicked={handleRowDoubleClick}
        />
      </VirtualGridAutoSizerContainer>
    </Stack>
  );
};
