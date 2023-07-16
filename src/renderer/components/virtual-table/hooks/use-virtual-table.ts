import {
    BodyScrollEvent,
    ColDef,
    GetRowIdParams,
    GridReadyEvent,
    IDatasource,
    PaginationChangedEvent,
    RowDoubleClickedEvent,
    RowModelType,
} from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { QueryKey, useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { MutableRefObject, useCallback, useMemo } from 'react';
import { generatePath, useNavigate } from 'react-router';
import { BasePaginatedResponse, LibraryItem } from '/@/renderer/api/types';
import { getColumnDefs, VirtualTableProps } from '/@/renderer/components/virtual-table';
import { SetContextMenuItems, useHandleTableContextMenu } from '/@/renderer/features/context-menu';
import { AppRoute } from '/@/renderer/router/routes';
import { ListDeterministicArgs, ListItemProps, ListTableProps } from '/@/renderer/store';
import { ListDisplayType, ServerListItem, TablePagination } from '/@/renderer/types';

export type AgGridFetchFn<TResponse, TFilter> = (
    args: { filter: TFilter; limit: number; startIndex: number },
    signal?: AbortSignal,
) => Promise<TResponse>;

interface UseAgGridProps<TResponse, TFilter> {
    contextMenu: SetContextMenuItems;
    fetch: {
        filter: TFilter;
        fn: AgGridFetchFn<TResponse, TFilter>;
        itemCount?: number;
        queryKey: (id: string, query?: Record<any, any>) => QueryKey;
        server: ServerListItem | null;
    };
    itemCount?: number;
    itemType: LibraryItem;
    pageKey: string;
    properties: ListItemProps<any>;
    setTable: (args: { data: Partial<ListTableProps> } & ListDeterministicArgs) => void;
    setTablePagination: (args: { data: Partial<TablePagination> } & ListDeterministicArgs) => void;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const useVirtualTable = <TResponse, TFilter>({
    fetch,
    tableRef,
    properties,
    setTable,
    setTablePagination,
    pageKey,
    itemType,
    contextMenu,
    itemCount,
}: UseAgGridProps<TResponse, TFilter>) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const isPaginationEnabled = properties.display === ListDisplayType.TABLE_PAGINATED;

    const columnDefs: ColDef[] = useMemo(() => {
        return getColumnDefs(properties.table.columns);
    }, [properties.table.columns]);

    const defaultColumnDefs: ColDef = useMemo(() => {
        return {
            lockPinned: true,
            lockVisible: true,
            resizable: true,
        };
    }, []);

    const onGridSizeChange = () => {
        if (properties.table.autoFit) {
            tableRef?.current?.api.sizeColumnsToFit();
        }
    };

    const onGridReady = useCallback(
        (params: GridReadyEvent) => {
            const dataSource: IDatasource = {
                getRows: async (params) => {
                    const limit = params.endRow - params.startRow;
                    const startIndex = params.startRow;

                    const queryKey = fetch.queryKey(fetch.server?.id || '', {
                        limit,
                        startIndex,
                        ...fetch.filter,
                    });

                    const results = (await queryClient.fetchQuery(
                        queryKey,
                        async ({ signal }) => {
                            const res = await fetch.fn(
                                {
                                    filter: fetch.filter,
                                    limit,
                                    startIndex,
                                },
                                signal,
                            );

                            return res;
                        },

                        { cacheTime: 1000 * 60 * 1 },
                    )) as BasePaginatedResponse<any>;

                    params.successCallback(results?.items || [], results?.totalRecordCount || 0);
                },
                rowCount: undefined,
            };

            params.api.setDatasource(dataSource);
            params.api.ensureIndexVisible(properties.table.scrollOffset || 0, 'top');
        },
        [fetch, properties.table.scrollOffset, queryClient],
    );

    const onPaginationChanged = useCallback(
        (event: PaginationChangedEvent) => {
            if (!isPaginationEnabled || !event.api) return;

            try {
                // Scroll to top of page on pagination change
                const currentPageStartIndex =
                    properties.table.pagination.currentPage *
                    properties.table.pagination.itemsPerPage;
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
            properties.table.pagination.currentPage,
            properties.table.pagination.itemsPerPage,
        ],
    );

    const onColumnMoved = useCallback(() => {
        const { columnApi } = tableRef?.current || {};
        const columnsOrder = columnApi?.getAllGridColumns();

        if (!columnsOrder) return;

        const columnsInSettings = properties.table.columns;
        const updatedColumns = [];
        for (const column of columnsOrder) {
            const columnInSettings = columnsInSettings.find(
                (c) => c.column === column.getColDef().colId,
            );

            if (columnInSettings) {
                updatedColumns.push({
                    ...columnInSettings,
                    ...(!properties.table.autoFit && {
                        width: column.getActualWidth(),
                    }),
                });
            }
        }

        setTable({ data: { columns: updatedColumns }, key: pageKey });
    }, [pageKey, properties.table.autoFit, properties.table.columns, setTable, tableRef]);

    const onColumnResized = debounce(onColumnMoved, 200);

    const onBodyScrollEnd = (e: BodyScrollEvent) => {
        const scrollOffset = Number((e.top / properties.table.rowHeight).toFixed(0));
        setTable({ data: { scrollOffset }, key: pageKey });
    };

    const onCellContextMenu = useHandleTableContextMenu(itemType, contextMenu);

    const defaultTableProps: Partial<VirtualTableProps> = useMemo(() => {
        return {
            alwaysShowHorizontalScroll: true,
            autoFitColumns: properties.table.autoFit,
            blockLoadDebounceMillis: 200,
            getRowId: (data: GetRowIdParams<any>) => data.data.id,
            infiniteInitialRowCount: itemCount || 100,
            pagination: isPaginationEnabled,
            paginationAutoPageSize: isPaginationEnabled,
            paginationPageSize: properties.table.pagination.itemsPerPage || 100,
            paginationProps: isPaginationEnabled
                ? {
                      pageKey,
                      pagination: properties.table.pagination,
                      setPagination: setTablePagination,
                  }
                : undefined,
            rowBuffer: 20,
            rowHeight: properties.table.rowHeight || 40,
            rowModelType: 'infinite' as RowModelType,
            suppressRowDrag: true,
        };
    }, [
        isPaginationEnabled,
        itemCount,
        pageKey,
        properties.table.autoFit,
        properties.table.pagination,
        properties.table.rowHeight,
        setTablePagination,
    ]);

    const onRowDoubleClicked = useCallback(
        (e: RowDoubleClickedEvent) => {
            switch (itemType) {
                case LibraryItem.ALBUM:
                    navigate(generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, { albumId: e.data.id }));
                    break;
                case LibraryItem.ARTIST:
                    navigate(
                        generatePath(AppRoute.LIBRARY_ARTISTS_DETAIL, { artistId: e.data.id }),
                    );
                    break;
                case LibraryItem.PLAYLIST:
                    navigate(generatePath(AppRoute.PLAYLISTS_DETAIL, { playlistId: e.data.id }));
                    break;
                default:
                    break;
            }
        },
        [itemType, navigate],
    );

    return {
        columnDefs,
        defaultColumnDefs,
        onBodyScrollEnd,
        onCellContextMenu,
        onColumnMoved,
        onColumnResized,
        onGridReady,
        onGridSizeChange,
        onPaginationChanged,
        onRowDoubleClicked,
        ...defaultTableProps,
    };
};
