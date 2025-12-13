import { t } from 'i18next';
import { useRef, useState } from 'react';

import { ItemListHandle } from '/@/renderer/components/item-list/types';
import { PlayQueue } from '/@/renderer/features/now-playing/components/play-queue';
import { PlayQueueListControls } from '/@/renderer/features/now-playing/components/play-queue-list-controls';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Popover } from '/@/shared/components/popover/popover';
import { Stack } from '/@/shared/components/stack/stack';
import { useDisclosure } from '/@/shared/hooks/use-disclosure';
import { ItemListKey } from '/@/shared/types/types';

export const PopoverPlayQueue = () => {
    const queueRef = useRef<ItemListHandle | null>(null);
    const [search, setSearch] = useState<string | undefined>(undefined);

    const [opened, handlers] = useDisclosure(false);

    return (
        <Popover
            arrowSize={24}
            offset={12}
            onClose={() => handlers.close()}
            opened={opened}
            position="top"
            withArrow
        >
            <Popover.Target>
                <ActionIcon
                    icon="arrowUpToLine"
                    iconProps={{
                        size: 'lg',
                    }}
                    onClick={() => handlers.toggle()}
                    size="sm"
                    tooltip={{
                        label: t('player.viewQueue', { postProcess: 'titleCase' }),
                        openDelay: 0,
                    }}
                    variant="subtle"
                />
            </Popover.Target>
            <Popover.Dropdown h="600px" mah="80dvh" opacity={0.95} p="xs" w="560px">
                <Stack gap={0} h="100%" w="100%">
                    <PlayQueueListControls
                        handleSearch={setSearch}
                        searchTerm={search}
                        type={ItemListKey.SIDE_QUEUE}
                    />
                    <PlayQueue
                        listKey={ItemListKey.SIDE_QUEUE}
                        ref={queueRef}
                        searchTerm={search}
                    />
                </Stack>
            </Popover.Dropdown>
        </Popover>
    );
};
