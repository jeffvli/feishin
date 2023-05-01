import { useRef } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { NowPlayingHeader } from '/@/renderer/features/now-playing/components/now-playing-header';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import type { Song } from '/@/renderer/api/types';
import { AnimatedPage } from '/@/renderer/features/shared';
import { Paper } from '/@/renderer/components';
import { PlayQueueListControls } from '/@/renderer/features/now-playing/components/play-queue-list-controls';
import { VirtualGridContainer } from '/@/renderer/components/virtual-grid';

const NowPlayingRoute = () => {
  const queueRef = useRef<{ grid: AgGridReactType<Song> } | null>(null);

  return (
    <AnimatedPage>
      <VirtualGridContainer>
        <NowPlayingHeader />
        <Paper sx={{ borderTop: '1px solid var(--generic-border-color)' }}>
          <PlayQueueListControls
            tableRef={queueRef}
            type="nowPlaying"
          />
        </Paper>
        <PlayQueue
          ref={queueRef}
          type="nowPlaying"
        />
      </VirtualGridContainer>
    </AnimatedPage>
  );
};

export default NowPlayingRoute;
