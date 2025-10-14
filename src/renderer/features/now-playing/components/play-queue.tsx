import type { RowClassRules, RowDragEvent, RowNode } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import type { Ref } from 'react';

import '@ag-grid-community/styles/ag-theme-alpine.css';
import { useMergedRef } from '@mantine/hooks';
import debounce from 'lodash/debounce';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import { getColumnDefs, VirtualTable } from '/@/renderer/components/virtual-table';
import { ErrorFallback } from '/@/renderer/features/action-required/components/error-fallback';
import { QUEUE_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { useHandleTableContextMenu } from '/@/renderer/features/context-menu/hooks/use-handle-context-menu';
import { useAppFocus } from '/@/renderer/hooks';
import {
    useAppStoreActions,
    usePlayerQueue,
    usePlayerSong,
    usePlayerStatus,
} from '/@/renderer/store';
import {
    useSettingsStore,
    useSettingsStoreActions,
    useTableSettings,
} from '/@/renderer/store/settings.store';
import { searchSongs } from '/@/renderer/utils/search-songs';
import { LibraryItem, QueueSong } from '/@/shared/types/domain-types';
import { ItemListKey } from '/@/shared/types/types';

type QueueProps = {
    type: ItemListKey;
};

export const PlayQueue = forwardRef(({ searchTerm, type }: QueueProps, ref: Ref<any>) => {
    const tableRef = useRef<AgGridReactType | null>(null);
    const mergedRef = useMergedRef(ref, tableRef);
    const queue = usePlayerQueue();
    const currentSong = usePlayerSong();
    const status = usePlayerStatus();
    const { setSettings } = useSettingsStoreActions();
    const { setAppStore } = useAppStoreActions();
    const tableConfig = useTableSettings(type);
    const [gridApi, setGridApi] = useState<AgGridReactType | undefined>();
    const isFocused = useAppFocus();
    const isFocusedRef = useRef<boolean>(isFocused);

    const songs = useMemo(() => {
        if (searchTerm) {
            return searchSongs(queue, searchTerm);
        }

        return queue;
    }, [queue, searchTerm]);

    useEffect(() => {
        if (tableRef.current) {
            setGridApi(tableRef.current);
        }
    }, []);

    useImperativeHandle(ref, () => ({
        get grid() {
            return gridApi;
        },
    }));

    const columnDefs = useMemo(
        () => getColumnDefs(tableConfig.columns, false, 'generic'),
        [tableConfig.columns],
    );

    // const handleDoubleClick = (e: CellDoubleClickedEvent) => {
    //     const playerData = setCurrentTrack(e.data.uniqueId);
    //     updateSong(playerData.current.song);

    //     if (playbackType === PlaybackType.LOCAL) {
    //         mpvPlayer!.volume(volume);
    //         setQueue(playerData, false);
    //     } else {
    //         const player =
    //             playerData.current.player === 1
    //                 ? PlayersRef.current?.player1
    //                 : PlayersRef.current?.player2;
    //         const underlying = player?.getInternalPlayer();
    //         if (underlying) {
    //             underlying.currentTime = 0;
    //         }
    //     }

    //     play();
    // };

    const handleDragStart = () => {
        if (type === 'sideDrawerQueue') {
            setAppStore({ isReorderingQueue: true });
        }
    };

    let timeout: any;
    const handleDragEnd = (e: RowDragEvent<QueueSong>) => {
        if (!e.nodes.length) return;
        const selectedUniqueIds = e.nodes
            .map((node) => node.data?._uniqueId)
            .filter((e) => e !== undefined);

        // const playerData = reorderQueue(selectedUniqueIds as string[], e.overNode?.data?.uniqueId);

        // if (playbackType === PlaybackType.LOCAL) {
        //     setQueueNext(playerData);
        // }

        if (type === 'sideDrawerQueue') {
            setAppStore({ isReorderingQueue: false });
        }

        const { api } = tableRef?.current || {};
        clearTimeout(timeout);
        timeout = setTimeout(() => api?.redrawRows(), 250);
    };

    const handleGridReady = () => {
        const { api } = tableRef?.current || {};

        if (currentSong?._uniqueId) {
            const currentNode = api?.getRowNode(currentSong?._uniqueId);

            if (!currentNode) return;
            api?.ensureNodeVisible(currentNode, 'middle');
        }
    };

    const handleColumnChange = () => {
        const { columnApi } = tableRef?.current || {};
        const columnsOrder = columnApi?.getAllGridColumns();
        if (!columnsOrder) return;

        const columnsInSettings = useSettingsStore.getState().lists[type].columns;

        const updatedColumns: PersistedTableColumn[] = [];
        for (const column of columnsOrder) {
            const columnInSettings = columnsInSettings.find(
                (c) => c.column === column.getColDef().colId,
            );

            if (columnInSettings) {
                updatedColumns.push({
                    ...columnInSettings,
                    ...(!useSettingsStore.getState().lists[type].autoFit && {
                        width: column.getActualWidth(),
                    }),
                });
            }
        }

        setSettings({
            lists: {
                ...useSettingsStore.getState().lists,
                [type]: {
                    ...useSettingsStore.getState().lists[type],
                    columns: updatedColumns,
                },
            },
        });
    };

    const debouncedColumnChange = debounce(handleColumnChange, 250);

    const handleGridSizeChange = () => {
        if (tableConfig.autoFit) {
            tableRef?.current?.api?.sizeColumnsToFit();
        }
    };

    const rowClassRules = useMemo<RowClassRules | undefined>(() => {
        return {
            'current-song': (params) => {
                return params.data.uniqueId === currentSong?._uniqueId;
            },
        };
    }, [currentSong?._uniqueId]);

    const previousSongRef = useRef<QueueSong | undefined>(undefined);

    useEffect(() => {
        if (currentSong) {
            previousSongRef.current = currentSong;
        }
    }, [currentSong]);

    // Redraw the current song row when the previous song changes
    useEffect(() => {
        if (tableRef?.current) {
            const { api, columnApi } = tableRef?.current || {};
            if (api == null || columnApi == null) {
                return;
            }

            const currentNode = currentSong?._uniqueId
                ? api.getRowNode(currentSong._uniqueId)
                : undefined;
            const previousNode = previousSongRef.current?._uniqueId
                ? api.getRowNode(previousSongRef.current?._uniqueId)
                : undefined;

            const rowNodes = [currentNode, previousNode].filter(
                (e) => e !== undefined,
            ) as RowNode<any>[];

            if (rowNodes) {
                api.redrawRows({ rowNodes });
                if (tableConfig.followCurrentSong) {
                    if (!currentNode) return;
                    api.ensureNodeVisible(currentNode, 'middle');
                }
            }
        }
    }, [currentSong, previousSongRef, tableConfig.followCurrentSong, status]);

    // As a separate rule, update the current row when focus changes. This is
    // to prevent queue scrolling when the application loses and then gains focus.
    // The body should only fire when focus changes, even though it depends on current song
    useEffect(() => {
        if (isFocused !== isFocusedRef.current && tableRef?.current) {
            const { api, columnApi } = tableRef.current;
            if (api == null || columnApi == null) {
                return;
            }

            const currentNode = currentSong?._uniqueId
                ? api.getRowNode(currentSong._uniqueId)
                : undefined;

            if (currentNode) {
                api.redrawRows({ rowNodes: [currentNode] });
            }

            isFocusedRef.current = isFocused;
        }
    }, [currentSong, isFocused]);

    const onCellContextMenu = useHandleTableContextMenu(LibraryItem.SONG, QUEUE_CONTEXT_MENU_ITEMS);

    return (
        <ErrorBoundary FallbackComponent={ErrorFallback}>
            <VirtualGridAutoSizerContainer>
                <VirtualTable
                    alwaysShowHorizontalScroll
                    autoFitColumns={tableConfig.autoFit}
                    columnDefs={columnDefs}
                    context={{
                        currentSong,
                        // handleDoubleClick,
                        isFocused,
                        isQueue: true,
                        itemType: LibraryItem.SONG,
                        onCellContextMenu,
                        status,
                    }}
                    deselectOnClickOutside={type === 'fullScreen'}
                    getRowId={(data) => data.data.uniqueId}
                    onCellContextMenu={onCellContextMenu}
                    // onCellDoubleClicked={handleDoubleClick}
                    onColumnMoved={handleColumnChange}
                    onColumnResized={debouncedColumnChange}
                    onDragStarted={handleDragStart}
                    onGridReady={handleGridReady}
                    onGridSizeChanged={handleGridSizeChange}
                    onRowDragEnd={handleDragEnd}
                    ref={mergedRef}
                    rowBuffer={50}
                    rowClassRules={rowClassRules}
                    rowData={songs}
                    rowDragEntireRow
                    rowDragMultiRow
                    rowHeight={tableConfig.rowHeight || 40}
                    suppressCellFocus={type === 'fullScreen'}
                />
            </VirtualGridAutoSizerContainer>
        </ErrorBoundary>
    );
});
