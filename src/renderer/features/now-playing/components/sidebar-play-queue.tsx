import { useRef } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Stack } from '@mantine/core';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { PlayQueueListControls } from './play-queue-list-controls';
import { Song } from '/@/renderer/api/types';
import { PageHeader, Paper } from '/@/renderer/components';
import { useWindowSettings } from '/@/renderer/store/settings.store';
import { Platform } from '/@/renderer/types';
import { VirtualGridContainer } from '/@/renderer/components/virtual-grid';

export const SidebarPlayQueue = () => {
  const queueRef = useRef<{ grid: AgGridReactType<Song> } | null>(null);
  const { windowBarStyle } = useWindowSettings();

  const isWeb = windowBarStyle === Platform.WEB;
  return (
    <VirtualGridContainer>
      {isWeb && (
        <Stack mr={isWeb ? '130px' : undefined}>
          <PageHeader backgroundColor="var(--titlebar-bg)" />
        </Stack>
      )}
      <Paper
        display={!isWeb ? 'flex' : undefined}
        h={!isWeb ? '65px' : undefined}
      >
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
