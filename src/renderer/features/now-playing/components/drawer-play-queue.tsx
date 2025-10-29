import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useRef, useState } from 'react';

import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { PlayQueueListControls } from '/@/renderer/features/now-playing/components/play-queue-list-controls';
import { Flex } from '/@/shared/components/flex/flex';
import { Song } from '/@/shared/types/domain-types';

export const DrawerPlayQueue = () => {
    const queueRef = useRef<null | { grid: AgGridReactType<Song> }>(null);
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
                    type="sideQueue"
                />
            </div>
            <Flex bg="var(--theme-colors-background)" h="100%" mb="0.6rem">
                <PlayQueue ref={queueRef} searchTerm={search} type="sideQueue" />
            </Flex>
        </Flex>
    );
};
