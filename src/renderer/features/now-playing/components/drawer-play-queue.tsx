import { useRef, useState } from 'react';

import { ItemListHandle } from '/@/renderer/components/item-list/types';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { PlayQueueListControls } from '/@/renderer/features/now-playing/components/play-queue-list-controls';
import { Flex } from '/@/shared/components/flex/flex';
import { ItemListKey } from '/@/shared/types/types';

export const DrawerPlayQueue = () => {
    const queueRef = useRef<ItemListHandle | null>(null);
    const [search, setSearch] = useState<string | undefined>(undefined);

    return (
        <Flex direction="column" h="100%">
            <div
                style={{
                    backgroundColor: 'var(--theme-colors-background)',
                    borderRadius: '10px',
                }}
            >
                <PlayQueueListControls
                    handleSearch={setSearch}
                    searchTerm={search}
                    tableRef={queueRef}
                    type={ItemListKey.SIDE_QUEUE}
                />
            </div>
            <Flex bg="var(--theme-colors-background)" h="100%" mb="0.6rem">
                <PlayQueue listKey={ItemListKey.SIDE_QUEUE} ref={queueRef} searchTerm={search} />
            </Flex>
        </Flex>
    );
};
