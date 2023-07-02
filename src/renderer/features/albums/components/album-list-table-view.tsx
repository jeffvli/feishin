import { useMemo, useCallback } from 'react';
import {
    ColDef,
    GridReadyEvent,
    IDatasource,
    PaginationChangedEvent,
    BodyScrollEvent,
    RowDoubleClickedEvent,
} from '@ag-grid-community/core';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { AlbumListQuery, LibraryItem } from '/@/renderer/api/types';
import { getColumnDefs, TablePagination, VirtualTable } from '/@/renderer/components/virtual-table';
import { useAlbumListContext } from '/@/renderer/features/albums/context/album-list-context';
import {
    useCurrentServer,
    useAlbumListFilter,
    useListStoreActions,
    useAlbumListStore,
} from '/@/renderer/store';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import debounce from 'lodash/debounce';
import { ListDisplayType } from '/@/renderer/types';
import { generatePath, useNavigate } from 'react-router';
import { useHandleTableContextMenu } from '/@/renderer/features/context-menu';
import { ALBUM_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { AppRoute } from '/@/renderer/router/routes';
import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid';

export const AlbumListTableView = ({ tableRef, itemCount }: any) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const server = useCurrentServer();
    const { id, pageKey } = useAlbumListContext();
    const filter = useAlbumListFilter({ id, key: pageKey });
    const { setTable, setTablePagination } = useListStoreActions();
    const { table, display } = useAlbumListStore({ id, key: pageKey });
    const columnDefs: ColDef[] = useMemo(() => getColumnDefs(table.columns), [table.columns]);
    const isPaginationEnabled = display === ListDisplayType.TABLE_PAGINATED;

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
                        _custom: {
                            jellyfin: {
                                ...filter._custom?.jellyfin,
                            },
                            navidrome: {
                                ...filter._custom?.navidrome,
                            },
                        },
                    };

                    const queryKey = queryKeys.albums.list(server?.id || '', query);

                    if (!server) {
                        return params.failCallback();
                    }

                    const albumsRes = await queryClient.fetchQuery(
                        queryKey,
                        async ({ signal }) =>
                            api.controller.getAlbumList({
                                apiClientProps: {
                                    server,
                                    signal,
                                },
                                query,
                            }),
                        { cacheTime: 1000 * 60 * 1 },
                    );

                    return params.successCallback(
                        albumsRes?.items || [],
                        albumsRes?.totalRecordCount || 0,
                    );
                },
                rowCount: undefined,
            };
            params.api.setDatasource(dataSource);
            params.api.ensureIndexVisible(table.scrollOffset || 0, 'top');
        },
        [filter, queryClient, server, table.scrollOffset],
    );

    const onTablePaginationChanged = useCallback(
        (event: PaginationChangedEvent) => {
            if (!isPaginationEnabled || !event.api) return;

            try {
                // Scroll to top of page on pagination change
                const currentPageStartIndex =
                    table.pagination.currentPage * table.pagination.itemsPerPage;
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
            const columnInSettings = columnsInSettings.find(
                (c) => c.column === column.getColDef().colId,
            );

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

    const handleContextMenu = useHandleTableContextMenu(
        LibraryItem.ALBUM,
        ALBUM_CONTEXT_MENU_ITEMS,
    );

    const handleRowDoubleClick = (e: RowDoubleClickedEvent) => {
        navigate(generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, { albumId: e.data.id }));
    };

    return (
        <>
            <VirtualGridAutoSizerContainer>
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
