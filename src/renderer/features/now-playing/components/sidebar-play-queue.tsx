import { useRef, useState } from 'react';

import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { PlayQueueListControls } from '/@/renderer/features/now-playing/components/play-queue-list-controls';
import { Flex } from '/@/shared/components/flex/flex';
import { ItemListKey } from '/@/shared/types/types';

export const SidebarPlayQueue = () => {
    const tableRef = useRef<null>(null);
    // const queueRef = useRef<null | { grid: AgGridReactType<Song> }>(null);
    const [search, setSearch] = useState<string | undefined>(undefined);

    return (
        <Flex direction="column" h="100%">
            <PlayQueueListControls
                handleSearch={setSearch}
                searchTerm={search}
                tableRef={tableRef}
                type={ItemListKey.SIDE_QUEUE}
            />
            <PlayQueue listKey={ItemListKey.SIDE_QUEUE} searchTerm={search} />
        </Flex>
    );
};
