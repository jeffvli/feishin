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
import { Album, AlbumListQuery, AlbumListSort, LibraryItem } from '/@/renderer/api/types';
import { useQueryClient } from '@tanstack/react-query';
import {
  useCurrentServer,
  useAlbumListStore,
  useAlbumListItemData,
  useListStoreActions,
  useAlbumListFilter,
} from '/@/renderer/store';
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
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { useCreateFavorite, useDeleteFavorite } from '/@/renderer/features/shared';
import { useAlbumListContext } from '/@/renderer/features/albums/context/album-list-context';

interface AlbumListContentProps {
  gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
  itemCount?: number;
  tableRef: MutableRefObject<AgGridReactType | null>;
}

export const AlbumListContent = ({ itemCount, gridRef, tableRef }: AlbumListContentProps) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const server = useCurrentServer();
  const handlePlayQueueAdd = usePlayQueueAdd();

  const { itemData, setItemData } = useAlbumListItemData();

  const { id, pageKey } = useAlbumListContext();
  const filter = useAlbumListFilter({ id, key: pageKey });
  const { setTable, setTablePagination, setGrid } = useListStoreActions();
  const { table, grid, display } = useAlbumListStore({ id, key: pageKey });
  const isPaginationEnabled = display === ListDisplayType.TABLE_PAGINATED;

  const columnDefs: ColDef[] = useMemo(() => getColumnDefs(table.columns), [table.columns]);

  const onTableReady = useCallback(
    (params: GridReadyEvent) => {
      const dataSource: IDatasource = {
        getRows: async (params) => {
          const limit = params.endRow - params.startRow;
          const startIndex = params.startRow;

          const query: AlbumListQuery = {
            limit,
            startIndex,
            ...filter,
            jfParams: {
              ...filter.jfParams,
            },
            ndParams: {
              ...filter.ndParams,
            },
          };

          const queryKey = queryKeys.albums.list(server?.id || '', query);

          const albumsRes = await queryClient.fetchQuery(
            queryKey,
            async ({ signal }) =>
              api.controller.getAlbumList({
                query,
                server,
                signal,
              }),
            { cacheTime: 1000 * 60 * 1 },
          );

          const albums = api.normalize.albumList(albumsRes, server);
          params.successCallback(albums?.items || [], albumsRes?.totalRecordCount || 0);
        },
        rowCount: undefined,
      };
      params.api.setDatasource(dataSource);
    },
    [filter, queryClient, server],
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
      setTablePagination,
      pageKey,
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
    async ({ skip, take }: { skip: number; take: number }) => {
      const query: AlbumListQuery = {
        limit: take,
        startIndex: skip,
        ...filter,
        jfParams: {
          ...filter.jfParams,
        },
        ndParams: {
          ...filter.ndParams,
        },
      };

      const queryKey = queryKeys.albums.list(server?.id || '', query);

      const albums = await queryClient.fetchQuery(queryKey, async ({ signal }) =>
        controller.getAlbumList({
          query,
          server,
          signal,
        }),
      );

      return api.normalize.albumList(albums, server);
    },
    [filter, queryClient, server],
  );

  const handleGridScroll = useCallback(
    (e: ListOnScrollProps) => {
      setGrid({ data: { scrollOffset: e.scrollOffset }, key: pageKey });
    },
    [pageKey, setGrid],
  );

  const cardRows = useMemo(() => {
    const rows: CardRow<Album>[] = [ALBUM_CARD_ROWS.name];

    switch (filter.sortBy) {
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
  }, [filter.sortBy]);

  const handleContextMenu = useHandleTableContextMenu(LibraryItem.ALBUM, ALBUM_CONTEXT_MENU_ITEMS);

  const handleRowDoubleClick = (e: RowDoubleClickedEvent) => {
    navigate(generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, { albumId: e.data.id }));
  };

  const createFavoriteMutation = useCreateFavorite();
  const deleteFavoriteMutation = useDeleteFavorite();

  const handleFavorite = (options: {
    id: string[];
    isFavorite: boolean;
    itemType: LibraryItem;
  }) => {
    const { id, itemType, isFavorite } = options;
    if (isFavorite) {
      deleteFavoriteMutation.mutate({
        query: {
          id,
          type: itemType,
        },
      });
    } else {
      createFavoriteMutation.mutate({
        query: {
          id,
          type: itemType,
        },
      });
    }
  };

  return (
    <>
      <VirtualGridAutoSizerContainer>
        {display === ListDisplayType.CARD || display === ListDisplayType.POSTER ? (
          <AutoSizer>
            {({ height, width }) => (
              <>
                <VirtualInfiniteGrid
                  key={`album-list-${server?.id}-${display}`}
                  ref={gridRef}
                  cardRows={cardRows}
                  display={display || ListDisplayType.CARD}
                  fetchFn={fetch}
                  handleFavorite={handleFavorite}
                  handlePlayQueueAdd={handlePlayQueueAdd}
                  height={height}
                  initialScrollOffset={grid?.scrollOffset || 0}
                  itemCount={itemCount || 0}
                  itemData={itemData}
                  itemGap={20}
                  itemSize={150 + (grid?.size || 0)}
                  itemType={LibraryItem.ALBUM}
                  loading={itemCount === undefined || itemCount === null}
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
            key={`table-${display}-${table.rowHeight}-${server?.id}`}
            ref={tableRef}
            alwaysShowHorizontalScroll
            suppressRowDrag
            autoFitColumns={table.autoFit}
            blockLoadDebounceMillis={200}
            columnDefs={columnDefs}
            getRowId={(data) => data.data.id}
            infiniteInitialRowCount={itemCount || 100}
            pagination={isPaginationEnabled}
            paginationAutoPageSize={isPaginationEnabled}
            paginationPageSize={table.pagination.itemsPerPage || 100}
            rowBuffer={20}
            rowHeight={table.rowHeight || 40}
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
