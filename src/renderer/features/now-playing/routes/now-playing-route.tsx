import { useRef } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Flex, Stack } from '@mantine/core';
import { NowPlayingHeader } from '/@/renderer/features/now-playing/components/now-playing-header';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { PlayQueueListControls } from '/@/renderer/features/now-playing/components/play-queue-list-controls';
import type { Song } from '/@/renderer/api/types';
import { AnimatedPage } from '/@/renderer/features/shared';

const NowPlayingRoute = () => {
  const queueRef = useRef<{ grid: AgGridReactType<Song> } | null>(null);

  return (
    <AnimatedPage>
      <Stack
        h="100%"
        spacing={0}
      >
        <NowPlayingHeader />
        <PlayQueue
          ref={queueRef}
          type="nowPlaying"
        />
        <Flex sx={{ borderTop: '1px solid var(--generic-border-color)' }}>
          <PlayQueueListControls
            tableRef={queueRef}
            type="nowPlaying"
          />
        </Flex>
      </Stack>
    </AnimatedPage>
  );
};

export default NowPlayingRoute;
