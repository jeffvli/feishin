import { useRef, useState } from 'react';

import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { PlayQueueListControls } from '/@/renderer/features/now-playing/components/play-queue-list-controls';
import { Stack } from '/@/shared/components/stack/stack';
import { ItemListKey } from '/@/shared/types/types';

export const SidebarPlayQueue = () => {
    const tableRef = useRef<null>(null);
    const [search, setSearch] = useState<string | undefined>(undefined);

    return (
        <Stack gap={0} h="100%" id="sidebar-play-queue-container" pos="relative" w="100%">
            <PlayQueueListControls
                handleSearch={setSearch}
                searchTerm={search}
                tableRef={tableRef}
                type={ItemListKey.SIDE_QUEUE}
            />
            <PlayQueue listKey={ItemListKey.SIDE_QUEUE} searchTerm={search} />
        </Stack>
    );
};
