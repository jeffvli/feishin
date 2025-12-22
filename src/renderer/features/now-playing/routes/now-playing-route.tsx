import { useEffect, useState } from 'react';

import { NowPlayingHeader } from '/@/renderer/features/now-playing/components/now-playing-header';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { PlayQueueListControls } from '/@/renderer/features/now-playing/components/play-queue-list-controls';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { PageErrorBoundary } from '/@/renderer/features/shared/components/page-error-boundary';
import { useAppStoreActions } from '/@/renderer/store';
import { ItemListKey } from '/@/shared/types/types';

const NowPlayingRoute = () => {
    const [search, setSearch] = useState<string | undefined>(undefined);
    const { setSideBar } = useAppStoreActions();

    useEffect(() => {
        // On page enter, set rightExpanded to false
        setSideBar({ rightExpanded: false });

        return () => {
            // On page exit, set rightExpanded to true
            setSideBar({ rightExpanded: true });
        };
    }, [setSideBar]);

    return (
        <AnimatedPage>
            <NowPlayingHeader />
            <PlayQueueListControls
                handleSearch={setSearch}
                searchTerm={search}
                type={ItemListKey.QUEUE_SONG}
            />
            <PlayQueue listKey={ItemListKey.QUEUE_SONG} searchTerm={search} />
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
