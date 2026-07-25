import { useRef, useState } from 'react';

import { ItemListHandle } from '/@/renderer/components/item-list/types';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { PlayQueueListControls } from '/@/renderer/features/now-playing/components/play-queue-list-controls';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { PageErrorBoundary } from '/@/renderer/features/shared/components/page-error-boundary';
import { ItemListKey } from '/@/shared/types/types';

const NowPlayingRoute = () => {
    const [search, setSearch] = useState<string | undefined>(undefined);
    const tableRef = useRef<ItemListHandle | null>(null);

    return (
        <AnimatedPage>
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
