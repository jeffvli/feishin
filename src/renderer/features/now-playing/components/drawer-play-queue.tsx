import { useRef } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Flex } from '@mantine/core';
import { PlayQueueListControls } from './play-queue-list-controls';
import { Song } from '/@/renderer/api/types';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { VirtualGridContainer } from '/@/renderer/components';

export const DrawerPlayQueue = () => {
  const queueRef = useRef<{ grid: AgGridReactType<Song> } | null>(null);

  return (
    <VirtualGridContainer>
      <PlayQueue
        ref={queueRef}
        type="sideQueue"
      />
      <Flex
        bg="var(--main-bg)"
        sx={{ borderTop: '1px solid var(--generic-border-color)' }}
      >
        <PlayQueueListControls
          tableRef={queueRef}
          type="sideQueue"
        />
      </Flex>
    </VirtualGridContainer>
  );
};
