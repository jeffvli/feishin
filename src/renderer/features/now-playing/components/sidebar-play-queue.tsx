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

  return (
    <VirtualGridContainer>
      {windowBarStyle === Platform.WEB && (
        <Stack mr={windowBarStyle === Platform.WEB ? '130px' : undefined}>
          <PageHeader backgroundColor="var(--titlebar-bg)" />
        </Stack>
      )}
      <Paper
        display={windowBarStyle !== Platform.WEB ? 'flex' : undefined}
        h={windowBarStyle !== Platform.WEB ? '65px' : undefined}
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
