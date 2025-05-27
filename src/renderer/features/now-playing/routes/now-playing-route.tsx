import type { Song } from '/@/shared/types/domain-types';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useRef } from 'react';

import { VirtualGridContainer } from '/@/renderer/components/virtual-grid';
import { NowPlayingHeader } from '/@/renderer/features/now-playing/components/now-playing-header';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { PlayQueueListControls } from '/@/renderer/features/now-playing/components/play-queue-list-controls';
import { AnimatedPage } from '/@/renderer/features/shared';
import { Paper } from '/@/shared/components/paper/paper';

const NowPlayingRoute = () => {
    const queueRef = useRef<null | { grid: AgGridReactType<Song> }>(null);

    return (
        <AnimatedPage>
            <VirtualGridContainer>
                <NowPlayingHeader />
                <Paper style={{ borderTop: '1px solid var(--theme-generic-border-color)' }}>
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
