import type {
    BodyScrollEvent,
    ColDef,
    GridReadyEvent,
    IDatasource,
    PaginationChangedEvent,
    RowDoubleClickedEvent,
    RowDragEvent,
} from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import debounce from 'lodash/debounce';
import { MutableRefObject, useCallback, useMemo } from 'react';
import { useParams } from 'react-router';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import {
    LibraryItem,
    PlaylistSongListQuery,
    QueueSong,
    Song,
    SongListSort,
    SortOrder,
} from '/@/renderer/api/types';
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
import { usePlaylistSongList } from '/@/renderer/features/playlists/queries/playlist-song-list-query';
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
import { ListDisplayType, ServerType } from '/@/renderer/types';
import { useAppFocus } from '/@/renderer/hooks';
import { toast } from '/@/renderer/components';

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
    const filters: Partial<PlaylistSongListQuery> = useMemo(() => {
        return {
            sortBy: page?.table.id[playlistId]?.filter?.sortBy || SongListSort.ID,
            sortOrder: page?.table.id[playlistId]?.filter?.sortOrder || SortOrder.ASC,
        };
    }, [page?.table.id, playlistId]);

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

    const iSClientSide = server?.type === ServerType.SUBSONIC;

    const checkPlaylistList = usePlaylistSongList({
        options: {
            enabled: !iSClientSide,
        },
        query: {
            id: playlistId,
            limit: 1,
            startIndex: 0,
        },
        serverId: server?.id,
    });

    const columnDefs: ColDef[] = useMemo(
        () => getColumnDefs(page.table.columns, false, 'generic'),
        [page.table.columns],
    );

    const onGridReady = useCallback(
        (params: GridReadyEvent) => {
            if (!iSClientSide) {
                const dataSource: IDatasource = {
                    getRows: async (params) => {
                        const limit = params.endRow - params.startRow;
                        const startIndex = params.startRow;

                        const query: PlaylistSongListQuery = {
                            id: playlistId,
                            limit,
                            startIndex,
                            ...filters,
                        };

                        const queryKey = queryKeys.playlists.songList(
                            server?.id || '',
                            playlistId,
                            query,
                        );

                        if (!server) return;

                        const songsRes = await queryClient.fetchQuery(
                            queryKey,
                            async ({ signal }) =>
                                api.controller.getPlaylistSongList({
                                    apiClientProps: {
                                        server,
                                        signal,
                                    },
                                    query,
                                }),
                        );

                        params.successCallback(
                            songsRes?.items || [],
                            songsRes?.totalRecordCount || 0,
                        );
                    },
                    rowCount: undefined,
                };
                params.api.setDatasource(dataSource);
            }
            params.api?.ensureIndexVisible(pagination.scrollOffset, 'top');
        },
        [filters, iSClientSide, pagination.scrollOffset, playlistId, queryClient, server],
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

                    setTimeout(() => {
                        queryClient.invalidateQueries({
                            queryKey: queryKeys.playlists.songList(server?.id || '', playlistId),
                        });
                        e.api.refreshInfiniteCache();
                    }, 200);
                } catch (error) {
                    toast.error({
                        message: (error as Error).message,
                        title: `Failed to move song ${e.node.data?.name} to ${e.overIndex}`,
                    });
                }
            }
        },
        [playlistId, queryClient, server],
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

    const canDrag =
        filters.sortBy === SongListSort.ID && !detailQuery?.data?.rules && !iSClientSide;

    return (
        <>
            <VirtualGridAutoSizerContainer>
                <VirtualTable
                    // https://github.com/ag-grid/ag-grid/issues/5284
                    // Key is used to force remount of table when display, rowHeight, or server changes
                    key={`table-${page.display}-${page.table.rowHeight}-${server?.id}`}
                    ref={tableRef}
                    alwaysShowHorizontalScroll
                    shouldUpdateSong
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
                    infiniteInitialRowCount={
                        iSClientSide ? undefined : checkPlaylistList.data?.totalRecordCount || 100
                    }
                    pagination={isPaginationEnabled}
                    paginationAutoPageSize={isPaginationEnabled}
                    paginationPageSize={pagination.itemsPerPage || 100}
                    rowClassRules={rowClassRules}
                    rowData={songs}
                    rowDragEntireRow={canDrag}
                    rowHeight={page.table.rowHeight || 40}
                    rowModelType={iSClientSide ? 'clientSide' : 'infinite'}
                    onBodyScrollEnd={handleScroll}
                    onCellContextMenu={handleContextMenu}
                    onColumnMoved={handleColumnChange}
                    onColumnResized={debouncedColumnChange}
                    onGridReady={onGridReady}
                    onGridSizeChanged={handleGridSizeChange}
                    onPaginationChanged={onPaginationChanged}
                    onRowDoubleClicked={handleRowDoubleClick}
                    onRowDragEnd={handleDragEnd}
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
