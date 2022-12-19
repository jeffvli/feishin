import { useRef } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Stack } from '@mantine/core';
import { PlayQueueListControls } from './play-queue-list-controls';
import { Song } from '/@/renderer/api/types';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';

export const DrawerPlayQueue = () => {
  const queueRef = useRef<{ grid: AgGridReactType<Song> } | null>(null);

  return (
    <Stack
      pb="1rem"
      sx={{ height: '100%' }}
    >
      <PlayQueue
        ref={queueRef}
        type="sideQueue"
      />
      <PlayQueueListControls
        tableRef={queueRef}
        type="sideQueue"
      />
    </Stack>
  );
};
