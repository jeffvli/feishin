import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { QueueSong } from '/@/shared/types/domain-types';

interface ShuffleItemsActionProps {
    items: QueueSong[];
}

export const ShuffleItemsAction = ({ items }: ShuffleItemsActionProps) => {
    const { t } = useTranslation();
    const player = usePlayer();

    const handleShuffleSelected = useCallback(() => {
        player.shuffleSelected(items);
    }, [items, player]);

    const handleShuffleAll = useCallback(() => {
        player.shuffleAll();
    }, [player]);

    return (
        <ContextMenu.Submenu>
            <ContextMenu.SubmenuTarget>
                <ContextMenu.Item
                    leftIcon="mediaShuffle"
                    onSelect={(e) => e.preventDefault()}
                    rightIcon="arrowRightS"
                >
                    {t('action.shuffle', { postProcess: 'sentenceCase' })}
                </ContextMenu.Item>
            </ContextMenu.SubmenuTarget>
            <ContextMenu.SubmenuContent>
                <ContextMenu.Item onSelect={handleShuffleSelected}>
                    {t('action.shuffleSelected', { postProcess: 'sentenceCase' })}
                </ContextMenu.Item>
                <ContextMenu.Item onSelect={handleShuffleAll}>
                    {t('action.shuffleAll', { postProcess: 'sentenceCase' })}
                </ContextMenu.Item>
            </ContextMenu.SubmenuContent>
        </ContextMenu.Submenu>
    );
};
