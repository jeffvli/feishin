import type { Song } from '/@/shared/types/domain-types';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useRef, useState } from 'react';

import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';

const NowPlayingRoute = () => {
    const queueRef = useRef<null | { grid: AgGridReactType<Song> }>(null);
    const [search, setSearch] = useState<string | undefined>(undefined);

    return (
        <AnimatedPage>
            {/* <VirtualGridContainer>
                <NowPlayingHeader />
                <PlayQueueListControls tableRef={queueRef} type="nowPlaying" />
                <PlayQueue ref={queueRef} type="nowPlaying" />
            </VirtualGridContainer> */}
        </AnimatedPage>
    );
};

export default NowPlayingRoute;
