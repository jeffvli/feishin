import { useRef } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Box, Stack } from '@mantine/core';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { PlayQueueListControls } from './play-queue-list-controls';
import { Song } from '/@/renderer/api/types';

export const SidebarPlayQueue = () => {
  const queueRef = useRef<{ grid: AgGridReactType<Song> } | null>(null);

  return (
    <Stack
      h="100%"
      spacing={0}
      sx={{ borderLeft: '2px solid var(--generic-border-color)' }}
    >
      <Box
        h="50px"
        mr="160px"
        sx={{
          '-webkit-app-region': 'drag',
          zIndex: -1,
        }}
      />
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
