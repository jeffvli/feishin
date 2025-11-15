import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { QueueSong } from '/@/shared/types/domain-types';

interface MoveQueueItemsActionProps {
    items: QueueSong[];
}

export const MoveQueueItemsAction = ({ items }: MoveQueueItemsActionProps) => {
    const { t } = useTranslation();
    const player = usePlayer();

    const handleMoveToTop = useCallback(() => {
        player.moveSelectedToTop(items);
    }, [items, player]);

    const handleMoveToNext = useCallback(() => {
        player.moveSelectedToNext(items);
    }, [items, player]);

    const handleMoveToBottom = useCallback(() => {
        player.moveSelectedToBottom(items);
    }, [items, player]);

    return (
        <ContextMenu.Submenu>
            <ContextMenu.SubmenuTarget>
                <ContextMenu.Item
                    leftIcon="dragVertical"
                    onSelect={(e) => e.preventDefault()}
                    rightIcon="arrowRightS"
                >
                    {t('page.contextMenu.moveItems', { postProcess: 'sentenceCase' })}
                </ContextMenu.Item>
            </ContextMenu.SubmenuTarget>
            <ContextMenu.SubmenuContent>
                <ContextMenu.Item leftIcon="arrowUpToLine" onSelect={handleMoveToTop}>
                    {t('page.contextMenu.moveToTop', { postProcess: 'sentenceCase' })}
                </ContextMenu.Item>
                <ContextMenu.Item leftIcon="mediaPlayNext" onSelect={handleMoveToNext}>
                    {t('page.contextMenu.moveToNext', { postProcess: 'sentenceCase' })}
                </ContextMenu.Item>
                <ContextMenu.Item leftIcon="arrowDownToLine" onSelect={handleMoveToBottom}>
                    {t('page.contextMenu.moveToBottom', { postProcess: 'sentenceCase' })}
                </ContextMenu.Item>
            </ContextMenu.SubmenuContent>
        </ContextMenu.Submenu>
    );
};
