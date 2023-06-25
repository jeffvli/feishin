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
  useDefaultQueue,
  usePlayerControls,
  usePreviousSong,
  useQueueControls,
} from '/@/renderer/store';
import {
  usePlayerType,
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
import { PlaybackType, PlayerStatus, TableType } from '/@/renderer/types';
import { LibraryItem, QueueSong } from '/@/renderer/api/types';
import { useHandleTableContextMenu } from '/@/renderer/features/context-menu';
import { QUEUE_CONTEXT_MENU_ITEMS } from '/@/renderer/features/context-menu/context-menu-items';
import { VirtualGridAutoSizerContainer } from '/@/renderer/components/virtual-grid';

const mpvPlayer = isElectron() ? window.electron.mpvPlayer : null;
const remote = isElectron() ? window.electron.remote : null;

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
  const { setSettings } = useSettingsStoreActions();
  const { setAppStore } = useAppStoreActions();
  const tableConfig = useTableSettings(type);
  const [gridApi, setGridApi] = useState<AgGridReactType | undefined>();
  const playerType = usePlayerType();
  const { play } = usePlayerControls();

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

  const columnDefs = useMemo(() => getColumnDefs(tableConfig.columns), [tableConfig.columns]);

  const handleDoubleClick = (e: CellDoubleClickedEvent) => {
    const playerData = setCurrentTrack(e.data.uniqueId);
    remote?.updateSong({
      currentTime: 0,
      song: playerData.current.song,
      status: PlayerStatus.PLAYING,
    });

    if (playerType === PlaybackType.LOCAL) {
      mpvPlayer!.setQueue(playerData);
      mpvPlayer!.play();
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

    if (playerType === PlaybackType.LOCAL) {
      mpvPlayer!.setQueueNext(playerData);
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
      const columnInSettings = columnsInSettings.find((c) => c.column === column.getColDef().colId);

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
      tableRef?.current?.api.sizeColumnsToFit();
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

      const currentNode = currentSong?.uniqueId ? api.getRowNode(currentSong.uniqueId) : undefined;
      const previousNode = previousSong?.uniqueId
        ? api.getRowNode(previousSong?.uniqueId)
        : undefined;

      const rowNodes = [currentNode, previousNode].filter((e) => e !== undefined) as RowNode<any>[];

      if (rowNodes) {
        api.redrawRows({ rowNodes });
        if (tableConfig.followCurrentSong) {
          if (!currentNode) return;
          api.ensureNodeVisible(currentNode, 'middle');
        }
      }
    }
  }, [currentSong, previousSong, tableConfig.followCurrentSong]);

  const handleContextMenu = useHandleTableContextMenu(LibraryItem.SONG, QUEUE_CONTEXT_MENU_ITEMS);

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
          deselectOnClickOutside={type === 'fullScreen'}
          getRowId={(data) => data.data.uniqueId}
          rowBuffer={50}
          rowClassRules={rowClassRules}
          rowData={queue}
          rowHeight={tableConfig.rowHeight || 40}
          suppressCellFocus={type === 'fullScreen'}
          onCellContextMenu={handleContextMenu}
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
