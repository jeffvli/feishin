import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useRef } from 'react';

import { PlayQueueListControls } from './play-queue-list-controls';

import { PageHeader } from '/@/renderer/components/page-header/page-header';
import { VirtualGridContainer } from '/@/renderer/components/virtual-grid';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { useWindowSettings } from '/@/renderer/store/settings.store';
import { Box } from '/@/shared/components/box/box';
import { Stack } from '/@/shared/components/stack/stack';
import { Song } from '/@/shared/types/domain-types';
import { Platform } from '/@/shared/types/types';

export const SidebarPlayQueue = () => {
    const queueRef = useRef<null | { grid: AgGridReactType<Song> }>(null);
    const { windowBarStyle } = useWindowSettings();

    const isWeb = windowBarStyle === Platform.WEB;
    return (
        <VirtualGridContainer>
            {isWeb && (
                <Stack mr={isWeb ? '130px' : undefined}>
                    <PageHeader />
                </Stack>
            )}
            <Box
                display={!isWeb ? 'flex' : undefined}
                h={!isWeb ? '65px' : undefined}
            >
                <PlayQueueListControls
                    tableRef={queueRef}
                    type="sideQueue"
                />
            </Box>
            <PlayQueue
                ref={queueRef}
                type="sideQueue"
            />
        </VirtualGridContainer>
    );
};
