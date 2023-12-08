import type {
    BodyScrollEvent,
    ColDef,
    GridReadyEvent,
    PaginationChangedEvent,
    RowDoubleClickedEvent,
} from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { AnimatePresence } from 'framer-motion';
import debounce from 'lodash/debounce';
import { MutableRefObject, useCallback, useMemo } from 'react';
import { useParams } from 'react-router';
import { LibraryItem, QueueSong, Song } from '/@/renderer/api/types';
import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid';
import { TablePagination, VirtualTable, getColumnDefs } from '/@/renderer/components/virtual-table';
import { useCurrentSongRowStyles } from '/@/renderer/components/virtual-table/hooks/use-current-song-row-styles';
import { useHandleTableContextMenu } from '/@/renderer/features/context-menu';
import {
    PLAYLIST_SONG_CONTEXT_MENU_ITEMS,
    SMART_PLAYLIST_SONG_CONTEXT_MENU_ITEMS,
} from '/@/renderer/features/context-menu/context-menu-items';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { usePlaylistDetail } from '/@/renderer/features/playlists/queries/playlist-detail-query';
import { useAppFocus } from '/@/renderer/hooks';
import {
    useCurrentServer,
    useCurrentSong,
    useCurrentStatus,
    usePlaylistDetailStore,
    usePlaylistDetailTablePagination,
    useSetPlaylistDetailTable,
    useSetPlaylistDetailTablePagination,
} from '/@/renderer/store';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { ListDisplayType } from '/@/renderer/types';

interface PlaylistDetailContentProps {
    songs: Song[];
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const PlaylistDetailSongListContent = ({ songs, tableRef }: PlaylistDetailContentProps) => {
    const { playlistId } = useParams() as { playlistId: string };
    const status = useCurrentStatus();
    const isFocused = useAppFocus();
    const currentSong = useCurrentSong();
    const server = useCurrentServer();
    const page = usePlaylistDetailStore();

    const detailQuery = usePlaylistDetail({ query: { id: playlistId }, serverId: server?.id });

    const p = usePlaylistDetailTablePagination(playlistId);
    const pagination = {
        currentPage: p?.currentPage || 0,
        itemsPerPage: p?.itemsPerPage || 100,
        scrollOffset: p?.scrollOffset || 0,
        totalItems: p?.totalItems || 1,
        totalPages: p?.totalPages || 1,
    };

    const setPagination = useSetPlaylistDetailTablePagination();
    const setTable = useSetPlaylistDetailTable();
    const handlePlayQueueAdd = usePlayQueueAdd();
    const playButtonBehavior = usePlayButtonBehavior();

    const isPaginationEnabled = page.display === ListDisplayType.TABLE_PAGINATED;

    const columnDefs: ColDef[] = useMemo(
        () => getColumnDefs(page.table.columns, false, 'generic'),
        [page.table.columns],
    );

    const onGridReady = useCallback(
        (params: GridReadyEvent) => {
            params.api?.ensureIndexVisible(pagination.scrollOffset, 'top');
        },
        [pagination.scrollOffset],
    );

    const handleGridSizeChange = () => {
        if (page.table.autoFit) {
            tableRef?.current?.api.sizeColumnsToFit();
        }
    };

    const onPaginationChanged = useCallback(
        (event: PaginationChangedEvent) => {
            if (!isPaginationEnabled || !event.api) return;

            try {
                // Scroll to top of page on pagination change
                const currentPageStartIndex = pagination.currentPage * pagination.itemsPerPage;
                event.api?.ensureIndexVisible(currentPageStartIndex, 'top');
            } catch (err) {
                console.log(err);
            }

            setPagination(playlistId, {
                itemsPerPage: event.api.paginationGetPageSize(),
                totalItems: event.api.paginationGetRowCount(),
                totalPages: event.api.paginationGetTotalPages() + 1,
            });
        },
        [
            isPaginationEnabled,
            pagination.currentPage,
            pagination.itemsPerPage,
            playlistId,
            setPagination,
        ],
    );

    const handleColumnChange = useCallback(() => {
        const { columnApi } = tableRef?.current || {};
        const columnsOrder = columnApi?.getAllGridColumns();

        if (!columnsOrder) return;

        const columnsInSettings = page.table.columns;
        const updatedColumns = [];
        for (const column of columnsOrder) {
            const columnInSettings = columnsInSettings.find(
                (c) => c.column === column.getColDef().colId,
            );

            if (columnInSettings) {
                updatedColumns.push({
                    ...columnInSettings,
                    ...(!page.table.autoFit && {
                        width: column.getActualWidth(),
                    }),
                });
            }
        }

        setTable({ columns: updatedColumns });
    }, [page.table.autoFit, page.table.columns, setTable, tableRef]);

    const debouncedColumnChange = debounce(handleColumnChange, 200);

    const handleScroll = (e: BodyScrollEvent) => {
        const scrollOffset = Number((e.top / page.table.rowHeight).toFixed(0));
        setPagination(playlistId, { scrollOffset });
    };

    const contextMenuItems = useMemo(() => {
        if (detailQuery?.data?.rules) {
            return SMART_PLAYLIST_SONG_CONTEXT_MENU_ITEMS;
        }

        return PLAYLIST_SONG_CONTEXT_MENU_ITEMS;
    }, [detailQuery?.data?.rules]);

    const handleContextMenu = useHandleTableContextMenu(LibraryItem.SONG, contextMenuItems, {
        playlistId,
        tableRef,
    });

    const handleRowDoubleClick = (e: RowDoubleClickedEvent<QueueSong>) => {
        if (!e.data) return;
        handlePlayQueueAdd?.({
            byItemType: {
                id: [playlistId],
                type: LibraryItem.PLAYLIST,
            },
            initialSongId: e.data.id,
            playType: playButtonBehavior,
        });
    };

    const { rowClassRules } = useCurrentSongRowStyles({ tableRef });

    return (
        <>
            <VirtualGridAutoSizerContainer>
                <VirtualTable
                    // https://github.com/ag-grid/ag-grid/issues/5284
                    // Key is used to force remount of table when display, rowHeight, or server changes
                    key={`table-${page.display}-${page.table.rowHeight}-${server?.id}`}
                    ref={tableRef}
                    alwaysShowHorizontalScroll
                    autoFitColumns={page.table.autoFit}
                    columnDefs={columnDefs}
                    context={{
                        currentSong,
                        isFocused,
                        onCellContextMenu: handleContextMenu,
                        status,
                    }}
                    getRowId={(data) => data.data.uniqueId}
                    pagination={isPaginationEnabled}
                    paginationAutoPageSize={isPaginationEnabled}
                    paginationPageSize={pagination.itemsPerPage || 100}
                    rowClassRules={rowClassRules}
                    rowData={songs}
                    rowHeight={page.table.rowHeight || 40}
                    rowModelType="clientSide"
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
            {isPaginationEnabled && (
                <AnimatePresence
                    presenceAffectsLayout
                    initial={false}
                    mode="wait"
                >
                    {page.display === ListDisplayType.TABLE_PAGINATED && (
                        <TablePagination
                            pageKey={playlistId}
                            pagination={pagination}
                            setIdPagination={setPagination}
                            tableRef={tableRef}
                        />
                    )}
                </AnimatePresence>
            )}
        </>
    );
};
