import { useEffect, useRef, useState } from 'react';

import { ItemListHandle } from '/@/renderer/components/item-list/types';
import { NowPlayingHeader } from '/@/renderer/features/now-playing/components/now-playing-header';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { PlayQueueListControls } from '/@/renderer/features/now-playing/components/play-queue-list-controls';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { PageErrorBoundary } from '/@/renderer/features/shared/components/page-error-boundary';
import { useAppStore, useAppStoreActions } from '/@/renderer/store';
import { ItemListKey } from '/@/shared/types/types';

const NowPlayingRoute = () => {
    const [search, setSearch] = useState<string | undefined>(undefined);
    const { setSideBar } = useAppStoreActions();
    const tableRef = useRef<ItemListHandle | null>(null);

    useEffect(() => {
        const wasExpanded = useAppStore.getState().sidebar.rightExpanded;

        // On page enter, set rightExpanded to false
        setSideBar({ rightExpanded: false });

        return () => {
            if (wasExpanded) {
                // On page exit, set rightExpanded to true if it was previously expanded
                setSideBar({ rightExpanded: true });
            }
        };
    }, [setSideBar]);

    return (
        <AnimatedPage>
            <NowPlayingHeader />
            <PlayQueueListControls
                handleSearch={setSearch}
                searchTerm={search}
                tableRef={tableRef}
                type={ItemListKey.QUEUE_SONG}
            />
            <PlayQueue listKey={ItemListKey.QUEUE_SONG} ref={tableRef} searchTerm={search} />
        </AnimatedPage>
    );
};

const NowPlayingRouteWithBoundary = () => {
    return (
        <PageErrorBoundary>
            <NowPlayingRoute />
        </PageErrorBoundary>
    );
};

export default NowPlayingRouteWithBoundary;
