import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { QueueSong } from '/@/shared/types/domain-types';

interface RemoveFromQueueActionProps {
    items: QueueSong[];
}

export const RemoveFromQueueAction = ({ items }: RemoveFromQueueActionProps) => {
    const { t } = useTranslation();
    const player = usePlayer();

    const onSelect = useCallback(() => {
        player.clearSelected(items);
    }, [items, player]);

    return (
        <ContextMenu.Item leftIcon="remove" onSelect={onSelect}>
            {t('action.removeFromQueue', { postProcess: 'sentenceCase' })}
        </ContextMenu.Item>
    );
};
