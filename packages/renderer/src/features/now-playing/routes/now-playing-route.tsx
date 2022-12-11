import { useRef } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Stack } from '@mantine/core';
import { NowPlayingHeader } from '/@/features/now-playing/components/now-playing-header';
import { PlayQueue } from '/@/features/now-playing/components/play-queue';
import { PlayQueueListControls } from '/@/features/now-playing/components/play-queue-list-controls';
import type { Song } from '/@/api/types';
import { AnimatedPage } from '/@/features/shared';

const NowPlayingRoute = () => {
  const queueRef = useRef<{ grid: AgGridReactType<Song> } | null>(null);

  return (
    <AnimatedPage>
      <Stack
        pb="1rem"
        spacing={0}
        sx={{ height: '100%' }}
      >
        <NowPlayingHeader />
        <PlayQueue
          ref={queueRef}
          type="nowPlaying"
        />

        <PlayQueueListControls
          tableRef={queueRef}
          type="nowPlaying"
        />
      </Stack>
    </AnimatedPage>
  );
};

export default NowPlayingRoute;
