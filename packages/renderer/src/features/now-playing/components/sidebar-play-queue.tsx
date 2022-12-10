import { useRef } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Stack } from '@mantine/core';
import { PlayQueue } from '/@/features/now-playing/components/play-queue';
import { PlayQueueListControls } from './play-queue-list-controls';
import type { Song } from '/@/api/types';

export const SidebarPlayQueue = () => {
  const tableRef = useRef<{ grid: AgGridReactType<Song> } | null>(null);

  return (
    <Stack
      pb="1rem"
      pt="2.5rem"
      sx={{ height: '100%' }}
    >
      <PlayQueue
        ref={tableRef}
        type="sideQueue"
      />
      <PlayQueueListControls
        tableRef={tableRef}
        type="sideQueue"
      />
    </Stack>
  );
};
