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
import { ListDisplayType, CardRow } from '/@/renderer/types';
import AutoSizer from 'react-virtualized-auto-sizer';
import { MutableRefObject, useCallback, useMemo } from 'react';
import { ListOnScrollProps } from 'react-window';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { AlbumArtist, AlbumArtistListSort, LibraryItem } from '/@/renderer/api/types';
import { useQueryClient } from '@tanstack/react-query';
import { useCurrentServer, useAlbumArtistListStore } from '/@/renderer/store';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import {
  BodyScrollEvent,
  ColDef,
  GridReadyEvent,
  IDatasource,
  PaginationChangedEvent,
  RowDoubleClickedEvent,
} from '@ag-grid-community/core';
import { AnimatePresence } from 'framer-motion';
import debounce from 'lodash/debounce';
import { useHandleTableContextMenu } from '/@/renderer/features/context-menu';
import { ALBUM_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { generatePath, useNavigate } from 'react-router';
import { useAlbumArtistList } from '/@/renderer/features/artists/queries/album-artist-list-query';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { useAlbumArtistListFilter, useListStoreActions } from '../../../store/list.store';
import { useAlbumArtistListContext } from '/@/renderer/features/artists/context/album-artist-list-context';

interface AlbumArtistListContentProps {
  gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
  tableRef: MutableRefObject<AgGridReactType | null>;
}

export const AlbumArtistListContent = ({ gridRef, tableRef }: AlbumArtistListContentProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const server = useCurrentServer();
  const handlePlayQueueAdd = usePlayQueueAdd();

  const { id, pageKey } = useAlbumArtistListContext();
  const filter = useAlbumArtistListFilter({ id, key: pageKey });
  const { table, grid, display } = useAlbumArtistListStore();
  const { setTable, setTablePagination, setGrid } = useListStoreActions();

  const isPaginationEnabled = display === ListDisplayType.TABLE_PAGINATED;

  const checkAlbumArtistList = useAlbumArtistList(
    {
      limit: 1,
      startIndex: 0,
      ...filter,
    },
    {
      cacheTime: Infinity,
      staleTime: 60 * 1000 * 5,
    },
  );

  const columnDefs: ColDef[] = useMemo(() => getColumnDefs(table.columns), [table.columns]);

  const onTableReady = useCallback(
    (params: GridReadyEvent) => {
      const dataSource: IDatasource = {
        getRows: async (params) => {
          const limit = params.endRow - params.startRow;
          const startIndex = params.startRow;

          const queryKey = queryKeys.albumArtists.list(server?.id || '', {
            limit,
            startIndex,
            ...filter,
          });

          const albumArtistsRes = await queryClient.fetchQuery(
            queryKey,
            async ({ signal }) =>
              api.controller.getAlbumArtistList({
                query: {
                  limit,
                  startIndex,
                  ...filter,
                },
                server,
                signal,
              }),
            { cacheTime: 1000 * 60 * 1 },
          );

          const albums = api.normalize.albumArtistList(albumArtistsRes, server);
          params.successCallback(albums?.items || [], albumArtistsRes?.totalRecordCount || 0);
        },
        rowCount: undefined,
      };

      params.api.setDatasource(dataSource);
      params.api.ensureIndexVisible(table.scrollOffset || 0, 'top');
    },
    [filter, table.scrollOffset, queryClient, server],
  );

  const onTablePaginationChanged = useCallback(
    (event: PaginationChangedEvent) => {
      if (!isPaginationEnabled || !event.api) return;

      try {
        // Scroll to top of page on pagination change
        const currentPageStartIndex = table.pagination.currentPage * table.pagination.itemsPerPage;
        event.api?.ensureIndexVisible(currentPageStartIndex, 'top');
      } catch (err) {
        console.log(err);
      }

      setTablePagination({
        data: {
          itemsPerPage: event.api.paginationGetPageSize(),
          totalItems: event.api.paginationGetRowCount(),
          totalPages: event.api.paginationGetTotalPages() + 1,
        },
        key: pageKey,
      });
    },
    [
      isPaginationEnabled,
      pageKey,
      setTablePagination,
      table.pagination.currentPage,
      table.pagination.itemsPerPage,
    ],
  );

  const handleTableColumnChange = useCallback(() => {
    const { columnApi } = tableRef?.current || {};
    const columnsOrder = columnApi?.getAllGridColumns();

    if (!columnsOrder) return;

    const columnsInSettings = table.columns;
    const updatedColumns = [];
    for (const column of columnsOrder) {
      const columnInSettings = columnsInSettings.find((c) => c.column === column.getColDef().colId);

      if (columnInSettings) {
        updatedColumns.push({
          ...columnInSettings,
          ...(!table.autoFit && {
            width: column.getColDef().width,
          }),
        });
      }
    }

    setTable({ data: { columns: updatedColumns }, key: pageKey });
  }, [tableRef, table.columns, table.autoFit, setTable, pageKey]);

  const debouncedTableColumnChange = debounce(handleTableColumnChange, 200);

  const handleTableScroll = (e: BodyScrollEvent) => {
    const scrollOffset = Number((e.top / table.rowHeight).toFixed(0));
    setTable({ data: { scrollOffset }, key: pageKey });
  };

  const fetch = useCallback(
    async ({ skip: startIndex, take: limit }: { skip: number; take: number }) => {
      const queryKey = queryKeys.albumArtists.list(server?.id || '', {
        limit,
        startIndex,
        ...filter,
      });

      const albumArtistsRes = await queryClient.fetchQuery(
        queryKey,
        async ({ signal }) =>
          api.controller.getAlbumArtistList({
            query: {
              limit,
              startIndex,
              ...filter,
            },
            server,
            signal,
          }),
        { cacheTime: 1000 * 60 * 1 },
      );

      return api.normalize.albumArtistList(albumArtistsRes, server);
    },
    [filter, queryClient, server],
  );

  const handleGridScroll = useCallback(
    (e: ListOnScrollProps) => {
      setGrid({ data: { scrollOffset: e.scrollOffset }, key: pageKey });
    },
    [pageKey, setGrid],
  );

  const handleGridSizeChange = () => {
    if (table.autoFit) {
      tableRef?.current?.api.sizeColumnsToFit();
    }
  };

  const cardRows = useMemo(() => {
    const rows: CardRow<AlbumArtist>[] = [ALBUMARTIST_CARD_ROWS.name];

    switch (filter.sortBy) {
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
  }, [filter.sortBy]);

  const handleContextMenu = useHandleTableContextMenu(
    LibraryItem.ALBUM_ARTIST,
    ALBUM_CONTEXT_MENU_ITEMS,
  );

  const handleRowDoubleClick = (e: RowDoubleClickedEvent) => {
    navigate(generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, { albumArtistId: e.data.id }));
  };

  return (
    <>
      <VirtualGridAutoSizerContainer>
        {display === ListDisplayType.CARD || display === ListDisplayType.POSTER ? (
          <AutoSizer>
            {({ height, width }) => (
              <VirtualInfiniteGrid
                ref={gridRef}
                cardRows={cardRows}
                display={display || ListDisplayType.CARD}
                fetchFn={fetch}
                handlePlayQueueAdd={handlePlayQueueAdd}
                height={height}
                initialScrollOffset={grid?.scrollOffset || 0}
                itemCount={checkAlbumArtistList?.data?.totalRecordCount || 0}
                itemGap={20}
                itemSize={grid?.itemsPerRow || 5}
                itemType={LibraryItem.ALBUM_ARTIST}
                loading={checkAlbumArtistList.isLoading}
                minimumBatchSize={40}
                route={{
                  route: AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL,
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
            key={`table-${display}-${table.rowHeight}-${server?.id}`}
            ref={tableRef}
            alwaysShowHorizontalScroll
            suppressRowDrag
            autoFitColumns={table.autoFit}
            columnDefs={columnDefs}
            getRowId={(data) => data.data.id}
            infiniteInitialRowCount={checkAlbumArtistList.data?.totalRecordCount || 1}
            pagination={isPaginationEnabled}
            paginationAutoPageSize={isPaginationEnabled}
            paginationPageSize={table.pagination.itemsPerPage || 100}
            rowHeight={table.rowHeight || 40}
            rowModelType="infinite"
            onBodyScrollEnd={handleTableScroll}
            onCellContextMenu={handleContextMenu}
            onColumnMoved={handleTableColumnChange}
            onColumnResized={debouncedTableColumnChange}
            onGridReady={onTableReady}
            onGridSizeChanged={handleGridSizeChange}
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
          {display === ListDisplayType.TABLE_PAGINATED && (
            <TablePagination
              pageKey={pageKey}
              pagination={table.pagination}
              setPagination={setTablePagination}
              tableRef={tableRef}
            />
          )}
        </AnimatePresence>
      )}
    </>
  );
};
