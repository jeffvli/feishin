import type { Ref } from 'react';
import { useState, forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import type {
    CellDoubleClickedEvent,
    RowClassRules,
    RowDragEvent,
    RowNode,
} from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import '@ag-grid-community/styles/ag-theme-alpine.css';
import {
    useAppStoreActions,
    useCurrentSong,
    useCurrentStatus,
    useDefaultQueue,
    usePlayerControls,
    usePreviousSong,
    useQueueControls,
    useVolume,
} from '/@/renderer/store';
import {
    usePlaybackType,
    useSettingsStore,
    useSettingsStoreActions,
    useTableSettings,
} from '/@/renderer/store/settings.store';
import { useMergedRef } from '@mantine/hooks';
import isElectron from 'is-electron';
import debounce from 'lodash/debounce';
import { ErrorBoundary } from 'react-error-boundary';
import { getColumnDefs, VirtualTable } from '/@/renderer/components/virtual-table';
import { ErrorFallback } from '/@/renderer/features/action-required';
import { PlaybackType, TableType } from '/@/renderer/types';
import { LibraryItem, QueueSong } from '/@/renderer/api/types';
import { useHandleTableContextMenu } from '/@/renderer/features/context-menu';
import { QUEUE_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid';
import { useAppFocus } from '/@/renderer/hooks';
import { PlayersRef } from '/@/renderer/features/player/ref/players-ref';
import { updateSong } from '/@/renderer/features/player/update-remote-song';
import { setQueue, setQueueNext } from '/@/renderer/utils/set-transcoded-queue-data';

const mpvPlayer = isElectron() ? window.electron.mpvPlayer : null;

type QueueProps = {
    type: TableType;
};

export const PlayQueue = forwardRef(({ type }: QueueProps, ref: Ref<any>) => {
    const tableRef = useRef<AgGridReactType | null>(null);
    const mergedRef = useMergedRef(ref, tableRef);
    const queue = useDefaultQueue();
    const { reorderQueue, setCurrentTrack } = useQueueControls();
    const currentSong = useCurrentSong();
    const previousSong = usePreviousSong();
    const status = useCurrentStatus();
    const { setSettings } = useSettingsStoreActions();
    const { setAppStore } = useAppStoreActions();
    const tableConfig = useTableSettings(type);
    const [gridApi, setGridApi] = useState<AgGridReactType | undefined>();
    const playbackType = usePlaybackType();
    const { play } = usePlayerControls();
    const volume = useVolume();
    const isFocused = useAppFocus();
    const isFocusedRef = useRef<boolean>(isFocused);

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

    const handleDoubleClick = (e: CellDoubleClickedEvent) => {
        const playerData = setCurrentTrack(e.data.uniqueId);
        updateSong(playerData.current.song);

        if (playbackType === PlaybackType.LOCAL) {
            mpvPlayer!.volume(volume);
            setQueue(playerData, false);
        } else {
            const player =
                playerData.current.player === 1
                    ? PlayersRef.current?.player1
                    : PlayersRef.current?.player2;
            const underlying = player?.getInternalPlayer();
            if (underlying) {
                underlying.currentTime = 0;
            }
        }

        play();
    };

    const handleDragStart = () => {
        if (type === 'sideDrawerQueue') {
            setAppStore({ isReorderingQueue: true });
        }
    };

    let timeout: any;
    const handleDragEnd = (e: RowDragEvent<QueueSong>) => {
        if (!e.nodes.length) return;
        const selectedUniqueIds = e.nodes
            .map((node) => node.data?.uniqueId)
            .filter((e) => e !== undefined);

        const playerData = reorderQueue(selectedUniqueIds as string[], e.overNode?.data?.uniqueId);

        if (playbackType === PlaybackType.LOCAL) {
            setQueueNext(playerData);
        }

        if (type === 'sideDrawerQueue') {
            setAppStore({ isReorderingQueue: false });
        }

        const { api } = tableRef?.current || {};
        clearTimeout(timeout);
        timeout = setTimeout(() => api?.redrawRows(), 250);
    };

    const handleGridReady = () => {
        const { api } = tableRef?.current || {};

        if (currentSong?.uniqueId) {
            const currentNode = api?.getRowNode(currentSong?.uniqueId);

            if (!currentNode) return;
            api?.ensureNodeVisible(currentNode, 'middle');
        }
    };

    const handleColumnChange = () => {
        const { columnApi } = tableRef?.current || {};
        const columnsOrder = columnApi?.getAllGridColumns();
        if (!columnsOrder) return;

        const columnsInSettings = useSettingsStore.getState().tables[type].columns;

        const updatedColumns = [];
        for (const column of columnsOrder) {
            const columnInSettings = columnsInSettings.find(
                (c) => c.column === column.getColDef().colId,
            );

            if (columnInSettings) {
                updatedColumns.push({
                    ...columnInSettings,
                    ...(!useSettingsStore.getState().tables[type].autoFit && {
                        width: column.getActualWidth(),
                    }),
                });
            }
        }

        setSettings({
            tables: {
                ...useSettingsStore.getState().tables,
                [type]: {
                    ...useSettingsStore.getState().tables[type],
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
                return params.data.uniqueId === currentSong?.uniqueId;
            },
        };
    }, [currentSong?.uniqueId]);

    // Redraw the current song row when the previous song changes
    useEffect(() => {
        if (tableRef?.current) {
            const { api, columnApi } = tableRef?.current || {};
            if (api == null || columnApi == null) {
                return;
            }

            const currentNode = currentSong?.uniqueId
                ? api.getRowNode(currentSong.uniqueId)
                : undefined;
            const previousNode = previousSong?.uniqueId
                ? api.getRowNode(previousSong?.uniqueId)
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
    }, [currentSong, previousSong, tableConfig.followCurrentSong, status]);

    // As a separate rule, update the current row when focus changes. This is
    // to prevent queue scrolling when the application loses and then gains focus.
    // The body should only fire when focus changes, even though it depends on current song
    useEffect(() => {
        if (isFocused !== isFocusedRef.current && tableRef?.current) {
            const { api, columnApi } = tableRef.current;
            if (api == null || columnApi == null) {
                return;
            }

            const currentNode = currentSong?.uniqueId
                ? api.getRowNode(currentSong.uniqueId)
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
                    ref={mergedRef}
                    alwaysShowHorizontalScroll
                    rowDragEntireRow
                    rowDragMultiRow
                    autoFitColumns={tableConfig.autoFit}
                    columnDefs={columnDefs}
                    context={{
                        currentSong,
                        isFocused,
                        onCellContextMenu,
                        status,
                    }}
                    deselectOnClickOutside={type === 'fullScreen'}
                    getRowId={(data) => data.data.uniqueId}
                    rowBuffer={50}
                    rowClassRules={rowClassRules}
                    rowData={queue}
                    rowHeight={tableConfig.rowHeight || 40}
                    suppressCellFocus={type === 'fullScreen'}
                    onCellContextMenu={onCellContextMenu}
                    onCellDoubleClicked={handleDoubleClick}
                    onColumnMoved={handleColumnChange}
                    onColumnResized={debouncedColumnChange}
                    onDragStarted={handleDragStart}
                    onGridReady={handleGridReady}
                    onGridSizeChanged={handleGridSizeChange}
                    onRowDragEnd={handleDragEnd}
                />
            </VirtualGridAutoSizerContainer>
        </ErrorBoundary>
    );
});
