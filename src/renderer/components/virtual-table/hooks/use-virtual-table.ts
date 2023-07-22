import { MutableRefObject, useCallback, useMemo } from 'react';
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
import { generatePath, useNavigate } from 'react-router';
import { api } from '/@/renderer/api';
import { QueryPagination, queryKeys } from '/@/renderer/api/query-keys';
import { BasePaginatedResponse, LibraryItem } from '/@/renderer/api/types';
import { getColumnDefs, VirtualTableProps } from '/@/renderer/components/virtual-table';
import { SetContextMenuItems, useHandleTableContextMenu } from '/@/renderer/features/context-menu';
import { AppRoute } from '/@/renderer/router/routes';
import { useListStoreActions } from '/@/renderer/store';
import { ListDisplayType, ServerListItem, TablePagination } from '/@/renderer/types';
import { useSearchParams } from 'react-router-dom';
import { ListKey, useListStoreByKey } from '../../../store/list.store';

export type AgGridFetchFn<TResponse, TFilter> = (
    args: { filter: TFilter; limit: number; startIndex: number },
    signal?: AbortSignal,
) => Promise<TResponse>;

interface UseAgGridProps<TFilter> {
    contextMenu: SetContextMenuItems;
    customFilters?: Partial<TFilter>;
    isSearchParams?: boolean;
    itemCount?: number;
    itemType: LibraryItem;
    pageKey: string;
    server: ServerListItem | null;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const useVirtualTable = <TFilter>({
    server,
    tableRef,
    pageKey,
    itemType,
    contextMenu,
    itemCount,
    customFilters,
    isSearchParams,
}: UseAgGridProps<TFilter>) => {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { setTable, setTablePagination } = useListStoreActions();
    const properties = useListStoreByKey({ filter: customFilters, key: pageKey });
    const [searchParams, setSearchParams] = useSearchParams();

    const scrollOffset = searchParams.get('scrollOffset');
    const pagination = useMemo(() => {
        return {
            currentPage: Number(searchParams.get('currentPage')),
            itemsPerPage: Number(searchParams.get('itemsPerPage')),
            totalItems: Number(searchParams.get('totalItems')),
            totalPages: Number(searchParams.get('totalPages')),
        };
    }, [searchParams]);

    const initialTableIndex =
        Number(isSearchParams ? scrollOffset : properties.table.scrollOffset) || 0;

    const isPaginationEnabled = properties.display === ListDisplayType.TABLE_PAGINATED;

    const columnDefs: ColDef[] = useMemo(() => {
        return getColumnDefs(properties.table.columns, true);
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

    const queryKeyFn:
        | ((serverId: string, query: Record<any, any>, pagination: QueryPagination) => QueryKey)
        | null = useMemo(() => {
        if (itemType === LibraryItem.ALBUM) {
            return queryKeys.albums.list;
        }
        if (itemType === LibraryItem.ALBUM_ARTIST) {
            return queryKeys.albumArtists.list;
        }
        if (itemType === LibraryItem.PLAYLIST) {
            return queryKeys.playlists.list;
        }
        if (itemType === LibraryItem.SONG) {
            return queryKeys.songs.list;
        }

        return null;
    }, [itemType]);

    const queryFn: ((args: any) => Promise<BasePaginatedResponse<any> | null | undefined>) | null =
        useMemo(() => {
            if (itemType === LibraryItem.ALBUM) {
                return api.controller.getAlbumList;
            }
            if (itemType === LibraryItem.ALBUM_ARTIST) {
                return api.controller.getAlbumArtistList;
            }
            if (itemType === LibraryItem.PLAYLIST) {
                return api.controller.getPlaylistList;
            }
            if (itemType === LibraryItem.SONG) {
                return api.controller.getSongList;
            }

            return null;
        }, [itemType]);

    const onGridReady = useCallback(
        (params: GridReadyEvent) => {
            const dataSource: IDatasource = {
                getRows: async (params) => {
                    const limit = params.endRow - params.startRow;
                    const startIndex = params.startRow;

                    const queryKey = queryKeyFn!(
                        server?.id || '',
                        {
                            ...(properties.filter as any),
                        },
                        {
                            limit,
                            startIndex,
                        },
                    );

                    const results = (await queryClient.fetchQuery(queryKey, async ({ signal }) => {
                        const res = await queryFn!({
                            apiClientProps: {
                                server,
                                signal,
                            },
                            query: {
                                ...properties.filter,
                                limit,
                                startIndex,
                            },
                        });

                        return res;
                    })) as BasePaginatedResponse<any>;

                    params.successCallback(results?.items || [], results?.totalRecordCount || 0);
                },
                rowCount: undefined,
            };

            params.api.setDatasource(dataSource);
            params.api.ensureIndexVisible(initialTableIndex, 'top');
        },
        [initialTableIndex, queryKeyFn, server, properties.filter, queryClient, queryFn],
    );

    const setParamsTablePagination = useCallback(
        (args: { data: Partial<TablePagination>; key: ListKey }) => {
            const { data } = args;

            setSearchParams(
                {
                    ...(data.currentPage && { currentPage: String(data.currentPage) }),
                    ...(data.itemsPerPage && { itemsPerPage: String(data.itemsPerPage) }),
                    ...(data.totalItems && { totalItems: String(data.totalItems) }),
                    ...(data.totalPages && { totalPages: String(data.totalPages) }),
                },
                { replace: true },
            );
        },
        [setSearchParams],
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

            if (isSearchParams) {
                setSearchParams(
                    {
                        itemsPerPage: String(event.api.paginationGetPageSize()),
                        totalItems: String(event.api.paginationGetRowCount()),
                        totalPages: String(event.api.paginationGetTotalPages() + 1),
                    },
                    { replace: true },
                );
            } else {
                setTablePagination({
                    data: {
                        itemsPerPage: event.api.paginationGetPageSize(),
                        totalItems: event.api.paginationGetRowCount(),
                        totalPages: event.api.paginationGetTotalPages() + 1,
                    },
                    key: pageKey,
                });
            }
        },
        [
            isPaginationEnabled,
            isSearchParams,
            properties.table.pagination.currentPage,
            properties.table.pagination.itemsPerPage,
            setSearchParams,
            setTablePagination,
            pageKey,
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

        if (isSearchParams) {
            setSearchParams({ scrollOffset: String(scrollOffset) }, { replace: true });
        } else {
            setTable({ data: { scrollOffset }, key: pageKey });
        }
    };

    const onCellContextMenu = useHandleTableContextMenu(itemType, contextMenu);

    const context = {
        onCellContextMenu,
    };

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
                      pagination: isSearchParams ? pagination : properties.table.pagination,
                      setPagination: isSearchParams ? setParamsTablePagination : setTablePagination,
                  }
                : undefined,
            rowBuffer: 20,
            rowHeight: properties.table.rowHeight || 40,
            rowModelType: 'infinite' as RowModelType,
            suppressRowDrag: true,
        };
    }, [
        isPaginationEnabled,
        isSearchParams,
        itemCount,
        pageKey,
        pagination,
        properties.table.autoFit,
        properties.table.pagination,
        properties.table.rowHeight,
        setParamsTablePagination,
        setTablePagination,
    ]);

    const onRowDoubleClicked = useCallback(
        (e: RowDoubleClickedEvent) => {
            switch (itemType) {
                case LibraryItem.ALBUM:
                    navigate(generatePath(AppRoute.LIBRARY_ALBUMS_DETAIL, { albumId: e.data.id }));
                    break;
                case LibraryItem.ALBUM_ARTIST:
                    navigate(
                        generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                            albumArtistId: e.data.id,
                        }),
                    );
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
        context,
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
