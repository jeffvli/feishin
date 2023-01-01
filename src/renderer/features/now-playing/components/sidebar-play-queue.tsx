import { useRef } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Flex } from '@mantine/core';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import styled from 'styled-components';
import { PlayQueueListControls } from './play-queue-list-controls';
import { Song } from '/@/renderer/api/types';

const BackgroundImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  z-index: 10;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 30%), var(--background-noise);
`;

export const SidebarPlayQueue = () => {
  const queueRef = useRef<{ grid: AgGridReactType<Song> } | null>(null);

  return (
    <>
      <Flex
        bg="var(--titlebar-bg)"
        h="60px"
        sx={{ position: 'relative' }}
        w="100%"
      >
        <BackgroundImageOverlay />
        <Flex
          h="100%"
          mr="160px"
          sx={{
            WebkitAppRegion: 'drag',
            background: 'var(--titlebar-bg)',
          }}
          w="100%"
        />
      </Flex>
      <Flex
        direction="column"
        h="calc(100% - 60px)"
        sx={{ borderLeft: '2px solid var(--generic-border-color)' }}
        w="100%"
      >
        <PlayQueue
          ref={queueRef}
          type="sideQueue"
        />
        <PlayQueueListControls
          tableRef={queueRef}
          type="sideQueue"
        />
      </Flex>
    </>
  );
};
