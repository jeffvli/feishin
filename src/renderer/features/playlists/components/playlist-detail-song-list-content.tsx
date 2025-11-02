import type {
    BodyScrollEvent,
    ColDef,
    GridReadyEvent,
    PaginationChangedEvent,
    RowDoubleClickedEvent,
    RowDragEvent,
} from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { AnimatePresence } from 'motion/react';
import { MutableRefObject, useCallback, useMemo } from 'react';
import { useParams } from 'react-router';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid/virtual-grid-wrapper';
import { getColumnDefs, TablePagination, VirtualTable } from '/@/renderer/components/virtual-table';
import { useCurrentSongRowStyles } from '/@/renderer/components/virtual-table/hooks/use-current-song-row-styles';
import {
    PLAYLIST_SONG_CONTEXT_MENU_ITEMS,
    SMART_PLAYLIST_SONG_CONTEXT_MENU_ITEMS,
} from '/@/renderer/features/context-menu/context-menu-items';
import { useHandleTableContextMenu } from '/@/renderer/features/context-menu/hooks/use-handle-context-menu';
import { usePlayQueueAdd } from '/@/renderer/features/player/hooks/use-playqueue-add';
import { playlistsQueries } from '/@/renderer/features/playlists/api/playlists-api';
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
import { PersistedTableColumn, usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { toast } from '/@/shared/components/toast/toast';
import {
    LibraryItem,
    PlaylistSongListQueryClientSide,
    QueueSong,
    ServerType,
    Song,
    SongListResponse,
    SongListSort,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ListDisplayType } from '/@/shared/types/types';

interface PlaylistDetailContentProps {
    songs?: Song[];
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const PlaylistDetailSongListContent = ({ songs, tableRef }: PlaylistDetailContentProps) => {
    const { playlistId } = useParams() as { playlistId: string };
    const queryClient = useQueryClient();
    const status = useCurrentStatus();
    const isFocused = useAppFocus();
    const currentSong = useCurrentSong();
    const server = useCurrentServer();
    const page = usePlaylistDetailStore();
    const filters: PlaylistSongListQueryClientSide = useMemo(() => {
        return {
            sortBy: page?.table.id[playlistId]?.filter?.sortBy || SongListSort.ID,
            sortOrder: page?.table.id[playlistId]?.filter?.sortOrder || SortOrder.ASC,
        };
    }, [page?.table.id, playlistId]);

    const detailQuery = useQuery(
        playlistsQueries.detail({ query: { id: playlistId }, serverId: server?.id }),
    );

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

    const handleDragEnd = useCallback(
        async (e: RowDragEvent<Song>) => {
            if (!e.nodes.length) return;

            const trackId = e.node.data?.playlistItemId;
            if (trackId && e.node.rowIndex !== null && e.overIndex !== e.node.rowIndex) {
                try {
                    await api.controller.movePlaylistItem({
                        apiClientProps: {
                            server,
                        },
                        query: {
                            endingIndex: e.overIndex,
                            playlistId,
                            startingIndex: e.node.rowIndex + 1,
                            trackId,
                        },
                    });

                    queryClient.setQueryData<SongListResponse>(
                        queryKeys.playlists.songList(server?.id || '', playlistId),
                        (previous) => {
                            if (previous?.items) {
                                const from = e.node.rowIndex!;
                                const to = e.overIndex;

                                const item = previous.items[from];
                                const remaining = previous.items.toSpliced(from, 1);
                                remaining.splice(to, 0, item);

                                return {
                                    error: previous.error,
                                    items: remaining,
                                    startIndex: previous.startIndex,
                                    totalRecordCount: previous.totalRecordCount,
                                };
                            }

                            return previous;
                        },
                    );

                    // Nodes have to be redrawn, otherwise the row indexes will be wrong
                    // Maybe it's possible to only redraw necessary rows to not be as expensive?
                    tableRef.current?.api.redrawRows();
                } catch (error) {
                    toast.error({
                        message: (error as Error).message,
                        title: `Failed to move song ${e.node.data?.name} to ${e.overIndex}`,
                    });
                }
            }
        },
        [playlistId, queryClient, server, tableRef],
    );

    const handleGridSizeChange = () => {
        if (page.table.autoFit) {
            tableRef?.current?.api?.sizeColumnsToFit();
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
                console.error(err);
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
        const updatedColumns: PersistedTableColumn[] = [];
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

    const canDrag =
        filters.sortBy === SongListSort.ID &&
        !detailQuery?.data?.rules &&
        server?.type !== ServerType.SUBSONIC;

    return (
        <>
            <VirtualGridAutoSizerContainer>
                <VirtualTable
                    alwaysShowHorizontalScroll
                    autoFitColumns={page.table.autoFit}
                    columnDefs={columnDefs}
                    context={{
                        currentSong,
                        isFocused,
                        itemType: LibraryItem.SONG,
                        onCellContextMenu: handleContextMenu,
                        status,
                    }}
                    getRowId={(data) => data.data.uniqueId}
                    // https://github.com/ag-grid/ag-grid/issues/5284
                    // Key is used to force remount of table when display, rowHeight, or server changes
                    key={`table-${page.display}-${page.table.rowHeight}-${server?.id}`}
                    onBodyScrollEnd={handleScroll}
                    onCellContextMenu={handleContextMenu}
                    onColumnMoved={handleColumnChange}
                    onColumnResized={debouncedColumnChange}
                    onGridReady={onGridReady}
                    onGridSizeChanged={handleGridSizeChange}
                    onPaginationChanged={onPaginationChanged}
                    onRowDoubleClicked={handleRowDoubleClick}
                    onRowDragEnd={handleDragEnd}
                    pagination={isPaginationEnabled}
                    paginationAutoPageSize={isPaginationEnabled}
                    paginationPageSize={pagination.itemsPerPage || 100}
                    ref={tableRef}
                    rowClassRules={rowClassRules}
                    rowData={songs}
                    rowDragEntireRow={canDrag}
                    rowHeight={page.table.rowHeight || 40}
                    rowModelType="clientSide"
                    shouldUpdateSong
                />
            </VirtualGridAutoSizerContainer>
            {isPaginationEnabled && (
                <AnimatePresence initial={false} mode="wait" presenceAffectsLayout>
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
