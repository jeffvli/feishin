import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Stack } from '@mantine/core';
import { PlayQueue } from '/@/features/now-playing/components/play-queue';
import { PlayQueueListControls } from './play-queue-list-controls';
import { useRef } from 'react';
import type { Song } from '/@/api/types';

export const DrawerPlayQueue = () => {
  const queueRef = useRef<{ grid: AgGridReactType<Song> } | null>(null);

  return (
    <Stack
      pb="1rem"
      sx={{ height: '100%' }}
    >
      <PlayQueue type="sideQueue" />
      <PlayQueueListControls
        gridApi={queueRef.current?.grid.api}
        gridColumnApi={queueRef.current?.grid?.columnApi}
        type="sideQueue"
      />
    </Stack>
  );
};
