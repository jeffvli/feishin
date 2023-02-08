import { useRef } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Box, Flex } from '@mantine/core';
import { PlayQueueListControls } from './play-queue-list-controls';
import { Song } from '/@/renderer/api/types';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';

export const DrawerPlayQueue = () => {
  const queueRef = useRef<{ grid: AgGridReactType<Song> } | null>(null);

  return (
    <Flex
      direction="column"
      h="100%"
      m="0.5rem"
      sx={{
        borderTopLeftRadius: '5px',
        borderTopRightRadius: '5px',
        boxShadow: '0px 0px 10px 0px rgba(0, 0, 0, 0.8)',
      }}
    >
      <Box
        bg="var(--main-bg)"
        sx={{ borderTopLeftRadius: '5px', borderTopRightRadius: '5px' }}
      >
        <PlayQueueListControls
          tableRef={queueRef}
          type="sideQueue"
        />
      </Box>
      <Flex h="100%">
        <PlayQueue
          ref={queueRef}
          type="sideQueue"
        />
      </Flex>
    </Flex>
  );
};
