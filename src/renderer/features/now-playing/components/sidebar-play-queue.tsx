import { useRef } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Stack } from '@mantine/core';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { PlayQueueListControls } from './play-queue-list-controls';
import { Song } from '/@/renderer/api/types';
import { PageHeader, Paper, VirtualGridContainer } from '/@/renderer/components';

export const SidebarPlayQueue = () => {
  const queueRef = useRef<{ grid: AgGridReactType<Song> } | null>(null);

  return (
    <VirtualGridContainer>
      <Stack>
        <PageHeader backgroundColor="var(--titlebar-bg)" />
      </Stack>
      <Paper>
        <PlayQueueListControls
          tableRef={queueRef}
          type="sideQueue"
        />
      </Paper>
      <PlayQueue
        ref={queueRef}
        type="sideQueue"
      />
    </VirtualGridContainer>
  );
};
