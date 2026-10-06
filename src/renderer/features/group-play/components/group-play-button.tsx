import { openModal } from '@mantine/modals';

import { GroupPlayPanel } from '/@/renderer/features/group-play/components/group-play-panel';
import { useGroupPlayStore } from '/@/renderer/features/group-play/store/group-play.store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';

export const GroupPlayButton = () => {
    const code = useGroupPlayStore((state) => state.code);

    return (
        <ActionIcon
            icon="groupPlay"
            iconProps={{ color: code ? 'primary' : undefined, size: 'lg' }}
            onClick={(e) => {
                e.stopPropagation();
                openModal({ children: <GroupPlayPanel />, size: 'md', title: 'Group Play' });
            }}
            size="sm"
            tooltip={{ label: code ? `Group Play (${code})` : 'Group Play', openDelay: 0 }}
            variant="subtle"
        />
    );
};
