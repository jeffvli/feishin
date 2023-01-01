import {
  ALBUMARTIST_CARD_ROWS,
  getColumnDefs,
  TablePagination,
  VirtualGridAutoSizerContainer,
  VirtualInfiniteGrid,
  VirtualInfiniteGridRef,
  VirtualTable,
} from '/@/renderer/components';
import { AppRoute } from '/@/renderer/router/routes';
import { ListDisplayType, CardRow, LibraryItem } from '/@/renderer/types';
import AutoSizer from 'react-virtualized-auto-sizer';
import { MutableRefObject, useCallback, useMemo } from 'react';
import { ListOnScrollProps } from 'react-window';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { AlbumArtist, AlbumArtistListSort } from '/@/renderer/api/types';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCurrentServer,
  useAlbumArtistListStore,
  useAlbumArtistTablePagination,
  useSetAlbumArtistStore,
  useSetAlbumArtistTable,
  useSetAlbumArtistTablePagination,
} from '/@/renderer/store';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import {
  BodyScrollEvent,
  CellContextMenuEvent,
  ColDef,
  GridReadyEvent,
  IDatasource,
  PaginationChangedEvent,
  RowDoubleClickedEvent,
} from '@ag-grid-community/core';
import { AnimatePresence } from 'framer-motion';
import debounce from 'lodash/debounce';
import { openContextMenu } from '/@/renderer/features/context-menu';
import { ALBUM_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import sortBy from 'lodash/sortBy';
import { generatePath, useNavigate } from 'react-router';
import { useAlbumArtistList } from '/@/renderer/features/artists/queries/album-artist-list-query';
import { usePlayQueueAdd } from '/@/renderer/features/player';

interface AlbumArtistListContentProps {
  gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
  tableRef: MutableRefObject<AgGridReactType | null>;
}

export const AlbumArtistListContent = ({ gridRef, tableRef }: AlbumArtistListContentProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const server = useCurrentServer();
  const page = useAlbumArtistListStore();
  const setPage = useSetAlbumArtistStore();
  const handlePlayQueueAdd = usePlayQueueAdd();

  const pagination = useAlbumArtistTablePagination();
  const setPagination = useSetAlbumArtistTablePagination();
  const setTable = useSetAlbumArtistTable();

  const isPaginationEnabled = page.display === ListDisplayType.TABLE_PAGINATED;

  const checkAlbumArtistList = useAlbumArtistList(
    {
      limit: 1,
      startIndex: 0,
      ...page.filter,
    },
    {
      cacheTime: Infinity,
      staleTime: 60 * 1000 * 5,
    },
  );

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

  const onTableReady = useCallback(
    (params: GridReadyEvent) => {
      const dataSource: IDatasource = {
        getRows: async (params) => {
          const limit = params.endRow - params.startRow;
          const startIndex = params.startRow;

          const queryKey = queryKeys.albumArtists.list(server?.id || '', {
            limit,
            startIndex,
            ...page.filter,
          });

          const albumArtistsRes = await queryClient.fetchQuery(queryKey, async ({ signal }) =>
            api.controller.getAlbumArtistList({
              query: {
                limit,
                startIndex,
                ...page.filter,
              },
              server,
              signal,
            }),
          );

          const albums = api.normalize.albumArtistList(albumArtistsRes, server);
          params.successCallback(
            albums?.items || [],
            albumArtistsRes?.totalRecordCount || undefined,
          );
        },
        rowCount: undefined,
      };
      params.api.setDatasource(dataSource);
      params.api.ensureIndexVisible(page.table.scrollOffset || 0, 'top');
    },
    [page.filter, page.table.scrollOffset, queryClient, server],
  );

  const onTablePaginationChanged = useCallback(
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

  const handleTableSizeChange = () => {
    if (page.table.autoFit) {
      tableRef?.current?.api.sizeColumnsToFit();
    }
  };

  const handleTableColumnChange = useCallback(() => {
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

  const debouncedTableColumnChange = debounce(handleTableColumnChange, 200);

  const handleTableScroll = (e: BodyScrollEvent) => {
    const scrollOffset = Number((e.top / page.table.rowHeight).toFixed(0));
    setTable({ scrollOffset });
  };

  const fetch = useCallback(
    async ({ skip: startIndex, take: limit }: { skip: number; take: number }) => {
      const queryKey = queryKeys.albumArtists.list(server?.id || '', {
        limit,
        startIndex,
        ...page.filter,
      });

      const albumArtistsRes = await queryClient.fetchQuery(queryKey, async ({ signal }) =>
        api.controller.getAlbumArtistList({
          query: {
            limit,
            startIndex,
            ...page.filter,
          },
          server,
          signal,
        }),
      );

      return api.normalize.albumArtistList(albumArtistsRes, server);
    },
    [page.filter, queryClient, server],
  );

  const handleGridScroll = useCallback(
    (e: ListOnScrollProps) => {
      setPage({
        list: {
          ...page,
          grid: {
            ...page.grid,
            scrollOffset: e.scrollOffset,
          },
        },
      });
    },
    [page, setPage],
  );

  const cardRows = useMemo(() => {
    const rows: CardRow<AlbumArtist>[] = [ALBUMARTIST_CARD_ROWS.name];

    switch (page.filter.sortBy) {
      case AlbumArtistListSort.DURATION:
        rows.push(ALBUMARTIST_CARD_ROWS.duration);
        break;
      case AlbumArtistListSort.FAVORITED:
        break;
      case AlbumArtistListSort.NAME:
        break;
      case AlbumArtistListSort.ALBUM_COUNT:
        rows.push(ALBUMARTIST_CARD_ROWS.albumCount);
        break;
      case AlbumArtistListSort.PLAY_COUNT:
        rows.push(ALBUMARTIST_CARD_ROWS.playCount);
        break;
      case AlbumArtistListSort.RANDOM:
        break;
      case AlbumArtistListSort.RATING:
        rows.push(ALBUMARTIST_CARD_ROWS.rating);
        break;
      case AlbumArtistListSort.RECENTLY_ADDED:
        break;
      case AlbumArtistListSort.SONG_COUNT:
        rows.push(ALBUMARTIST_CARD_ROWS.songCount);
        break;
      case AlbumArtistListSort.RELEASE_DATE:
        break;
    }

    return rows;
  }, [page.filter.sortBy]);

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
      menuItems: ALBUM_CONTEXT_MENU_ITEMS,
      type: LibraryItem.ALBUM_ARTIST,
      xPos: clickEvent.clientX,
      yPos: clickEvent.clientY,
    });
  };

  const handleRowDoubleClick = (e: RowDoubleClickedEvent) => {
    navigate(generatePath(AppRoute.LIBRARY_ALBUMARTISTS_DETAIL, { albumArtistId: e.data.id }));
  };

  return (
    <>
      <VirtualGridAutoSizerContainer>
        {page.display === ListDisplayType.CARD || page.display === ListDisplayType.POSTER ? (
          <AutoSizer>
            {({ height, width }) => (
              <VirtualInfiniteGrid
                key={`albumartist-list-${server?.id}-${page.display}`}
                ref={gridRef}
                cardRows={cardRows}
                display={page.display || ListDisplayType.CARD}
                fetchFn={fetch}
                handlePlayQueueAdd={handlePlayQueueAdd}
                height={height}
                initialScrollOffset={page?.grid.scrollOffset || 0}
                itemCount={checkAlbumArtistList?.data?.totalRecordCount || 0}
                itemGap={20}
                itemSize={150 + page.grid?.size}
                itemType={LibraryItem.ALBUM_ARTIST}
                minimumBatchSize={40}
                route={{
                  route: AppRoute.LIBRARY_ALBUMARTISTS_DETAIL,
                  slugs: [{ idProperty: 'id', slugProperty: 'albumArtistId' }],
                }}
                width={width}
                onScroll={handleGridScroll}
              />
            )}
          </AutoSizer>
        ) : (
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
            getRowId={(data) => data.data.id}
            infiniteInitialRowCount={checkAlbumArtistList.data?.totalRecordCount || 100}
            pagination={isPaginationEnabled}
            paginationAutoPageSize={isPaginationEnabled}
            paginationPageSize={page.table.pagination.itemsPerPage || 100}
            rowBuffer={20}
            rowHeight={page.table.rowHeight || 40}
            rowModelType="infinite"
            rowSelection="multiple"
            onBodyScrollEnd={handleTableScroll}
            onCellContextMenu={handleContextMenu}
            onColumnMoved={handleTableColumnChange}
            onColumnResized={debouncedTableColumnChange}
            onGridReady={onTableReady}
            onGridSizeChanged={handleTableSizeChange}
            onPaginationChanged={onTablePaginationChanged}
            onRowDoubleClicked={handleRowDoubleClick}
          />
        )}
      </VirtualGridAutoSizerContainer>
      {isPaginationEnabled && (
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
      )}
    </>
  );
};
