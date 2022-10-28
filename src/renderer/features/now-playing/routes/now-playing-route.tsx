import { useEffect, useMemo, useRef, useState } from 'react';
import { ColDef, RowClassRules } from 'ag-grid-community';
import {
  VirtualGridAutoSizerContainer,
  VirtualGridContainer,
} from '@/renderer/components';
import { VirtualTable } from '@/renderer/components/virtual-table';
import { mpvPlayer } from '@/renderer/features/player/utils/mpvPlayer';
import { AnimatedPage } from '@/renderer/features/shared';
import { usePlayerStore } from '@/renderer/store';

const selector = (state: any) => state.queue.default;

export const NowPlayingRoute = () => {
  const gridRef = useRef<any>(null);
  const queue = usePlayerStore(selector);
  const currentPlayerIndex = usePlayerStore((state) => state.current.index);
  const current = usePlayerStore((state) => state.getQueueData().current);
  const previous = usePlayerStore((state) => state.queue.previousNode);
  const setCurrentIndex = usePlayerStore((state) => state.setCurrentIndex);

  const [columnDefs] = useState<ColDef[]>([
    {
      field: 'index',
      headerName: '-',
      initialWidth: 50,
      rowDrag: true,
      suppressSizeToFit: true,
    },
    {
      headerName: '#',
      initialWidth: 50,
      suppressSizeToFit: true,
      valueGetter: 'node.rowIndex + 1',
    },
    { field: 'name' },
    {
      field: 'duration',
      initialWidth: 100,
      suppressSizeToFit: true,
    },
    { field: 'album.id', initialWidth: 100 },
  ]);

  const defaultColumnDefs: ColDef = useMemo(() => {
    return {
      lockPinned: true,
      lockVisible: true,
      resizable: true,
    };
  }, []);

  const rowClassRules = useMemo<RowClassRules>(() => {
    return {
      'current-song': (params) => {
        return params.rowIndex === currentPlayerIndex;
      },
    };
  }, [currentPlayerIndex]);

  useEffect(() => {
    const { api, columnApi } = gridRef.current;
    if (api == null || columnApi == null) {
      return;
    }

    const currentNode = api.getRowNode(current?.uniqueId);
    const previousNode = api.getRowNode(previous?.uniqueId);

    const rowNodes = [currentNode, previousNode];

    if (rowNodes) {
      api.redrawRows({ rowNodes });
      api.ensureNodeVisible(currentNode, 'middle');
    }
  }, [current, previous]);

  const handlePlayByRowClick = (e: any) => {
    const playerData = setCurrentIndex(e.rowIndex);
    mpvPlayer.setQueue(playerData);
  };

  return (
    <AnimatedPage>
      <VirtualGridContainer>
        <VirtualGridAutoSizerContainer>
          <VirtualTable
            ref={gridRef}
            rowDragEntireRow
            rowDragManaged
            rowDragMultiRow
            suppressMoveWhenRowDragging
            suppressScrollOnNewData
            animateRows={false}
            columnDefs={columnDefs}
            defaultColDef={defaultColumnDefs}
            enableCellChangeFlash={false}
            getRowId={(data) => {
              return data.data.uniqueId;
            }}
            rowBuffer={30}
            rowClassRules={rowClassRules}
            rowData={queue}
            rowSelection="multiple"
            onCellClicked={(e) => console.log('clicked', e)}
            onCellContextMenu={(e) => console.log(e)}
            onCellDoubleClicked={handlePlayByRowClick}
            onDragStarted={(e) => {
              console.log('ddrag move', e);
            }}
            onGridSizeChanged={() => {
              console.log('size');
              gridRef.current.api.sizeColumnsToFit();
            }}
            onRowDragEnd={(e) => {
              console.log('dragend', e);
            }}
          />
        </VirtualGridAutoSizerContainer>
      </VirtualGridContainer>
    </AnimatedPage>
  );
};
