import { useEffect, useMemo, useRef } from 'react';
import {
  CellDoubleClickedEvent,
  ColDef,
  RowClassRules,
  RowDragEvent,
} from 'ag-grid-community';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import {
  VirtualGridAutoSizerContainer,
  VirtualGridContainer,
  getColumnDefs,
  TableConfigDropdown,
} from '@/renderer/components';
import { useAppStore, usePlayerStore } from '@/renderer/store';
import { useSettingsStore } from '@/renderer/store/settings.store';
import { QueueSong, TableType } from '@/renderer/types';
import { VirtualTable } from '../../../components/virtual-table';
import { mpvPlayer } from '../../player/utils/mpv-player';

type QueueProps = {
  type: TableType;
};

export const PlayQueue = ({ type }: QueueProps) => {
  const gridRef = useRef<any>(null);
  const queue = usePlayerStore((state) => state.queue.default);
  const reorderQueue = usePlayerStore((state) => state.reorderQueue);
  const current = usePlayerStore((state) => state.getQueueData().current);
  const previous = usePlayerStore((state) => state.queue.previousNode);
  const setCurrentTrack = usePlayerStore((state) => state.setCurrentTrack);
  const setSettings = useSettingsStore((state) => state.setSettings);
  const setAppStore = useAppStore((state) => state.setAppStore);
  const tableConfig = useSettingsStore((state) => state.tables[type]);

  const columnDefs = getColumnDefs(tableConfig.columns);

  const defaultColumnDefs: ColDef = useMemo(() => {
    return {
      lockPinned: true,
      lockVisible: true,
      resizable: true,
    };
  }, []);

  const handlePlayByRowClick = (e: CellDoubleClickedEvent) => {
    const playerData = setCurrentTrack(e.data.uniqueId);
    mpvPlayer.setQueue(playerData);
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

    const playerData = reorderQueue(
      selectedUniqueIds as string[],
      e.overNode?.data?.uniqueId
    );
    mpvPlayer.setQueueNext(playerData);

    if (type === 'sideDrawerQueue') {
      setAppStore({ isReorderingQueue: false });
    }

    const { api } = gridRef?.current;
    clearTimeout(timeout);
    timeout = setTimeout(() => api.redrawRows(), 250);
  };

  const handleGridReady = () => {
    if (tableConfig.followCurrentSong) {
      const { api } = gridRef?.current;

      const currentNode = api.getRowNode(current?.uniqueId);
      api.ensureNodeVisible(currentNode, 'middle');
    }
  };

  const handleColumnChange = () => {
    const { columnApi } = gridRef?.current;
    const columnsOrder = columnApi.getAllGridColumns();

    const columnsInSettings = useSettingsStore.getState().tables[type].columns;

    const updatedColumns = [];
    for (const column of columnsOrder) {
      const columnInSettings = columnsInSettings.find(
        (c) => c.column === column.colId
      );

      if (columnInSettings) {
        updatedColumns.push({
          ...columnInSettings,
          ...(!useSettingsStore.getState().tables[type].autoFit && {
            width: column.actualWidth,
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

  const handleGridSizeChange = () => {
    if (tableConfig.autoFit) {
      gridRef.current.api.sizeColumnsToFit();
    }
  };

  const rowClassRules = useMemo<RowClassRules>(() => {
    return {
      'current-song': (params) => {
        return params.data.uniqueId === current?.uniqueId;
      },
    };
  }, [current?.uniqueId]);

  // Redraw the current song row when the previous song changes
  useEffect(() => {
    if (gridRef?.current) {
      const { api, columnApi } = gridRef?.current;
      if (api == null || columnApi == null) {
        return;
      }

      const currentNode = api.getRowNode(current?.uniqueId);
      const previousNode = api.getRowNode(previous?.uniqueId);

      const rowNodes = [currentNode, previousNode];

      if (rowNodes) {
        api.redrawRows({ rowNodes });
        if (tableConfig.followCurrentSong) {
          api.ensureNodeVisible(currentNode, 'middle');
        }
      }
    }
  }, [current, previous, tableConfig.followCurrentSong]);

  // Auto resize the columns when the column config changes
  useEffect(() => {
    if (tableConfig.autoFit) {
      const { api } = gridRef?.current;
      api?.sizeColumnsToFit();
    }
  }, [tableConfig.autoFit, tableConfig.columns]);

  useEffect(() => {
    const { api } = gridRef?.current;
    api?.resetRowHeights();
    api?.redrawRows();
  }, [tableConfig.rowHeight]);

  return (
    <>
      <VirtualGridContainer>
        <VirtualGridAutoSizerContainer>
          <VirtualTable
            ref={gridRef}
            alwaysShowHorizontalScroll
            animateRows
            maintainColumnOrder
            rowDragEntireRow
            rowDragMultiRow
            suppressCopyRowsToClipboard
            suppressMoveWhenRowDragging
            suppressRowDrag
            suppressScrollOnNewData
            columnDefs={columnDefs}
            defaultColDef={defaultColumnDefs}
            enableCellChangeFlash={false}
            getRowId={(data) => data.data.uniqueId}
            rowBuffer={30}
            rowClassRules={rowClassRules}
            rowData={queue}
            rowHeight={tableConfig.rowHeight || 40}
            rowSelection="multiple"
            // onCellClicked={(e) => console.log('clicked', e)}
            // onCellContextMenu={(e) => console.log(e)}
            onCellDoubleClicked={handlePlayByRowClick}
            onColumnMoved={handleColumnChange}
            onColumnResized={handleColumnChange}
            onDragStarted={handleDragStart}
            onGridReady={handleGridReady}
            onGridSizeChanged={handleGridSizeChange}
            onRowDragEnd={handleDragEnd}
          />
        </VirtualGridAutoSizerContainer>
      </VirtualGridContainer>
      <TableConfigDropdown type={type} />
    </>
  );
};
