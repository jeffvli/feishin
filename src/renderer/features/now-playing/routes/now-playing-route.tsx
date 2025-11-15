import { useRef, useState } from 'react';

import { ItemListHandle } from '/@/renderer/components/item-list/types';
import { NowPlayingHeader } from '/@/renderer/features/now-playing/components/now-playing-header';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { PlayQueueListControls } from '/@/renderer/features/now-playing/components/play-queue-list-controls';
import { AnimatedPage } from '/@/renderer/features/shared/components/animated-page';
import { ItemListKey } from '/@/shared/types/types';

const NowPlayingRoute = () => {
    const queueRef = useRef<ItemListHandle | null>(null);
    const [search, setSearch] = useState<string | undefined>(undefined);

    return (
        <AnimatedPage>
            <NowPlayingHeader />
            <PlayQueueListControls
                handleSearch={setSearch}
                searchTerm={search}
                tableRef={queueRef}
                type={ItemListKey.QUEUE_SONG}
            />
            <PlayQueue listKey={ItemListKey.QUEUE_SONG} searchTerm={search} />
        </AnimatedPage>
    );
};

export default NowPlayingRoute;
