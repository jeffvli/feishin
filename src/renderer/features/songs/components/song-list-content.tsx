import { MutableRefObject, useCallback, useMemo } from 'react';
import type {
    BodyScrollEvent,
    ColDef,
    GridReadyEvent,
    IDatasource,
    PaginationChangedEvent,
    RowDoubleClickedEvent,
} from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Stack } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import {
    useCurrentServer,
    useListStoreActions,
    useSongListFilter,
    useSongListStore,
} from '/@/renderer/store';
import { ListDisplayType } from '/@/renderer/types';
import { AnimatePresence } from 'framer-motion';
import debounce from 'lodash/debounce';
import { useHandleTableContextMenu } from '/@/renderer/features/context-menu';
import { SONG_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { LibraryItem, QueueSong, SongListQuery } from '/@/renderer/api/types';
import { useSongListContext } from '/@/renderer/features/songs/context/song-list-context';
import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid';
import { getColumnDefs, VirtualTable, TablePagination } from '/@/renderer/components/virtual-table';

interface SongListContentProps {
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const SongListContent = ({ itemCount, tableRef }: SongListContentProps) => {
    const queryClient = useQueryClient();
    const server = useCurrentServer();

    const { id, pageKey, handlePlay } = useSongListContext();
    const filter = useSongListFilter({ id, key: pageKey });
    const { display, table } = useSongListStore({ id, key: pageKey });

    const { setTable, setTablePagination } = useListStoreActions();
    const playButtonBehavior = usePlayButtonBehavior();

    const isPaginationEnabled = display === ListDisplayType.TABLE_PAGINATED;

    const columnDefs: ColDef[] = useMemo(() => getColumnDefs(table.columns), [table.columns]);

    const onGridReady = useCallback(
        (params: GridReadyEvent) => {
            const dataSource: IDatasource = {
                getRows: async (params) => {
                    const limit = params.endRow - params.startRow;
                    const startIndex = params.startRow;

                    const query: SongListQuery = {
                        limit,
                        startIndex,
                        ...filter,
                    };

                    const queryKey = queryKeys.songs.list(server?.id || '', query);

                    const songsRes = await queryClient.fetchQuery(
                        queryKey,
                        async ({ signal }) =>
                            api.controller.getSongList({
                                apiClientProps: {
                                    server,
                                    signal,
                                },
                                query,
                            }),
                        { cacheTime: 1000 * 60 * 1 },
                    );

                    params.successCallback(songsRes?.items || [], songsRes?.totalRecordCount || 0);
                },
                rowCount: undefined,
            };
            params.api.setDatasource(dataSource);

            params.api.ensureIndexVisible(table.scrollOffset, 'top');
        },
        [filter, table.scrollOffset, queryClient, server],
    );

    const onPaginationChanged = useCallback(
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
            pageKey,
            setTablePagination,
            table.pagination.currentPage,
            table.pagination.itemsPerPage,
        ],
    );

    const handleGridSizeChange = () => {
        if (table.autoFit) {
            tableRef?.current?.api.sizeColumnsToFit();
        }
    };

    const handleColumnChange = useCallback(() => {
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
                        width: column.getActualWidth(),
                    }),
                });
            }
        }

        setTable({ data: { columns: updatedColumns }, key: pageKey });
    }, [tableRef, table.columns, table.autoFit, setTable, pageKey]);

    const debouncedColumnChange = debounce(handleColumnChange, 200);

    const handleScroll = (e: BodyScrollEvent) => {
        const scrollOffset = Number((e.top / table.rowHeight).toFixed(0));
        setTable({ data: { scrollOffset }, key: pageKey });
    };

    const handleContextMenu = useHandleTableContextMenu(LibraryItem.SONG, SONG_CONTEXT_MENU_ITEMS);

    const handleRowDoubleClick = (e: RowDoubleClickedEvent<QueueSong>) => {
        if (!e.data) return;
        handlePlay?.({ initialSongId: e.data.id, playType: playButtonBehavior });
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
                    rowSelection="multiple"
                    onBodyScrollEnd={handleScroll}
                    onCellContextMenu={handleContextMenu}
                    onColumnMoved={handleColumnChange}
                    onColumnResized={debouncedColumnChange}
                    onGridReady={onGridReady}
                    onGridSizeChanged={handleGridSizeChange}
                    onPaginationChanged={onPaginationChanged}
                    onRowDoubleClicked={handleRowDoubleClick}
                />
            </VirtualGridAutoSizerContainer>
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
        </Stack>
    );
};
