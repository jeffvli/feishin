import { useRef } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { PlayQueueListControls } from './play-queue-list-controls';
import { Song } from '/@/renderer/api/types';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { Box, Flex } from '/@/renderer/components';

export const DrawerPlayQueue = () => {
    const queueRef = useRef<{ grid: AgGridReactType<Song> } | null>(null);

    return (
        <Flex
            direction="column"
            h="100%"
        >
            <Box
                bg="var(--main-bg)"
                style={{ borderRadius: '10px' }}
            >
                <PlayQueueListControls
                    tableRef={queueRef}
                    type="sideQueue"
                />
            </Box>
            <Flex
                bg="var(--main-bg)"
                h="100%"
                mb="0.6rem"
            >
                <PlayQueue
                    ref={queueRef}
                    type="sideQueue"
                />
            </Flex>
        </Flex>
    );
};
