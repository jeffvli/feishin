import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PopoverPlayQueue } from '/@/renderer/features/now-playing/components/popover-play-queue';
import { useAppStoreActions, useSidebarRightExpanded } from '/@/renderer/store/app.store';
import { useHotkeySettings, useSideQueueType } from '/@/renderer/store/settings.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { useHotkeys } from '/@/shared/hooks/use-hotkeys';

export const QueueButton = () => {
    const { t } = useTranslation();
    const isSidebarRightExpanded = useSidebarRightExpanded();
    const { setSideBar } = useAppStoreActions();
    const sideQueueType = useSideQueueType();
    const { bindings } = useHotkeySettings();
    const [popoverOpened, setPopoverOpened] = useState(false);
    const handleToggleQueue = () => {
        if (sideQueueType === 'sideQueue') setSideBar({ rightExpanded: !isSidebarRightExpanded });
        else setPopoverOpened((prev) => !prev);
    };
    useHotkeys([
        [bindings.toggleQueue.isGlobal ? '' : bindings.toggleQueue.hotkey, handleToggleQueue],
    ]);
    if (sideQueueType === 'sideQueue') {
        return (
            <ActionIcon
                icon={isSidebarRightExpanded ? 'panelRightClose' : 'panelRightOpen'}
                iconProps={{ size: 'lg' }}
                onClick={(e) => {
                    e.stopPropagation();
                    handleToggleQueue();
                }}
                size="sm"
                tooltip={{
                    label: t('player.viewQueue', { postProcess: 'titleCase' }),
                    openDelay: 0,
                }}
                variant="subtle"
            />
        );
    }
    return (
        <PopoverPlayQueue
            onClose={() => setPopoverOpened(false)}
            onToggle={(e) => {
                e.stopPropagation();
                handleToggleQueue();
            }}
            opened={popoverOpened}
        />
    );
};
