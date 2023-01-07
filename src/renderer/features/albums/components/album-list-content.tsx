import {
  ALBUM_CARD_ROWS,
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
import { controller } from '/@/renderer/api/controller';
import { queryKeys } from '/@/renderer/api/query-keys';
import { Album, AlbumListSort, LibraryItem } from '/@/renderer/api/types';
import { useAlbumList } from '/@/renderer/features/albums/queries/album-list-query';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCurrentServer,
  useSetAlbumStore,
  useAlbumListStore,
  useAlbumTablePagination,
  useSetAlbumTable,
  useSetAlbumTablePagination,
  useAlbumListItemData,
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
import { usePlayQueueAdd } from '/@/renderer/features/player';

interface AlbumListContentProps {
  gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
  tableRef: MutableRefObject<AgGridReactType | null>;
}

export const AlbumListContent = ({ gridRef, tableRef }: AlbumListContentProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const server = useCurrentServer();
  const page = useAlbumListStore();
  const setPage = useSetAlbumStore();
  const handlePlayQueueAdd = usePlayQueueAdd();

  const { itemData, setItemData } = useAlbumListItemData();

  const pagination = useAlbumTablePagination();
  const setPagination = useSetAlbumTablePagination();
  const setTable = useSetAlbumTable();

  const isPaginationEnabled = page.display === ListDisplayType.TABLE_PAGINATED;

  const checkAlbumList = useAlbumList({
    limit: 1,
    startIndex: 0,
    ...page.filter,
  });

  const columnDefs: ColDef[] = useMemo(
    () => getColumnDefs(page.table.columns),
    [page.table.columns],
  );

  const onTableReady = useCallback(
    (params: GridReadyEvent) => {
      const dataSource: IDatasource = {
        getRows: async (params) => {
          const limit = params.endRow - params.startRow;
          const startIndex = params.startRow;

          const queryKey = queryKeys.albums.list(server?.id || '', {
            limit,
            startIndex,
            ...page.filter,
          });

          const albumsRes = await queryClient.fetchQuery(
            queryKey,
            async ({ signal }) =>
              api.controller.getAlbumList({
                query: {
                  limit,
                  startIndex,
                  ...page.filter,
                },
                server,
                signal,
              }),
            { cacheTime: 1000 * 60 * 1 },
          );

          const albums = api.normalize.albumList(albumsRes, server);
          params.successCallback(albums?.items || [], albumsRes?.totalRecordCount || undefined);
        },
        rowCount: undefined,
      };
      params.api.setDatasource(dataSource);
      // params.api.ensureIndexVisible(page.table.scrollOffset || 0, 'top');
    },
    [page.filter, queryClient, server],
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
    async ({ skip, take }: { skip: number; take: number }) => {
      const queryKey = queryKeys.albums.list(server?.id || '', {
        limit: take,
        startIndex: skip,
        ...page.filter,
      });

      const albums = await queryClient.fetchQuery(queryKey, async ({ signal }) =>
        controller.getAlbumList({
          query: {
            limit: take,
            startIndex: skip,
            ...page.filter,
          },
          server,
          signal,
        }),
      );

      return api.normalize.albumList(albums, server);
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
    const rows: CardRow<Album>[] = [ALBUM_CARD_ROWS.name];

    switch (page.filter.sortBy) {
      case AlbumListSort.ALBUM_ARTIST:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        rows.push(ALBUM_CARD_ROWS.releaseYear);
        break;
      case AlbumListSort.ARTIST:
        rows.push(ALBUM_CARD_ROWS.artists);
        rows.push(ALBUM_CARD_ROWS.releaseYear);
        break;
      case AlbumListSort.COMMUNITY_RATING:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        break;
      case AlbumListSort.DURATION:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        rows.push(ALBUM_CARD_ROWS.duration);
        break;
      case AlbumListSort.FAVORITED:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        rows.push(ALBUM_CARD_ROWS.releaseYear);
        break;
      case AlbumListSort.NAME:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        rows.push(ALBUM_CARD_ROWS.releaseYear);
        break;
      case AlbumListSort.PLAY_COUNT:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        rows.push(ALBUM_CARD_ROWS.playCount);
        break;
      case AlbumListSort.RANDOM:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        rows.push(ALBUM_CARD_ROWS.releaseYear);
        break;
      case AlbumListSort.RATING:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        rows.push(ALBUM_CARD_ROWS.rating);
        break;
      case AlbumListSort.RECENTLY_ADDED:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        rows.push(ALBUM_CARD_ROWS.createdAt);
        break;
      case AlbumListSort.RECENTLY_PLAYED:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        rows.push(ALBUM_CARD_ROWS.lastPlayedAt);
        break;
      case AlbumListSort.SONG_COUNT:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        rows.push(ALBUM_CARD_ROWS.songCount);
        break;
      case AlbumListSort.YEAR:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        rows.push(ALBUM_CARD_ROWS.releaseYear);
        break;
      case AlbumListSort.RELEASE_DATE:
        rows.push(ALBUM_CARD_ROWS.albumArtists);
        rows.push(ALBUM_CARD_ROWS.releaseDate);
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
      type: LibraryItem.ALBUM,
      xPos: clickEvent.clientX,
      yPos: clickEvent.clientY,
    });
  };

  const handleRowDoubleClick = (e: RowDoubleClickedEvent) => {
    navigate(generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, { albumId: e.data.id }));
  };

  return (
    <>
      <VirtualGridAutoSizerContainer>
        {page.display === ListDisplayType.CARD || page.display === ListDisplayType.POSTER ? (
          <AutoSizer>
            {({ height, width }) => (
              <>
                <VirtualInfiniteGrid
                  key={`album-list-${server?.id}-${page.display}`}
                  ref={gridRef}
                  cardRows={cardRows}
                  display={page.display || ListDisplayType.CARD}
                  fetchFn={fetch}
                  handlePlayQueueAdd={handlePlayQueueAdd}
                  height={height}
                  initialScrollOffset={page?.grid.scrollOffset || 0}
                  itemCount={checkAlbumList?.data?.totalRecordCount || 0}
                  itemData={itemData}
                  itemGap={20}
                  itemSize={150 + page.grid?.size}
                  itemType={LibraryItem.ALBUM}
                  loading={checkAlbumList.isLoading}
                  minimumBatchSize={40}
                  route={{
                    route: AppRoute.LIBRARY_ALBUMS_DETAIL,
                    slugs: [{ idProperty: 'id', slugProperty: 'albumId' }],
                  }}
                  setItemData={setItemData}
                  width={width}
                  onScroll={handleGridScroll}
                />
              </>
            )}
          </AutoSizer>
        ) : (
          <VirtualTable
            // https://github.com/ag-grid/ag-grid/issues/5284
            // Key is used to force remount of table when display, rowHeight, or server changes
            key={`table-${page.display}-${page.table.rowHeight}-${server?.id}`}
            ref={tableRef}
            alwaysShowHorizontalScroll
            autoFitColumns={page.table.autoFit}
            blockLoadDebounceMillis={200}
            columnDefs={columnDefs}
            getRowId={(data) => data.data.id}
            infiniteInitialRowCount={checkAlbumList.data?.totalRecordCount || 1}
            pagination={isPaginationEnabled}
            paginationAutoPageSize={isPaginationEnabled}
            paginationPageSize={page.table.pagination.itemsPerPage || 100}
            rowBuffer={20}
            rowHeight={page.table.rowHeight || 40}
            rowModelType="infinite"
            onBodyScrollEnd={handleTableScroll}
            onCellContextMenu={handleContextMenu}
            onColumnMoved={handleTableColumnChange}
            onColumnResized={debouncedTableColumnChange}
            onGridReady={onTableReady}
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
