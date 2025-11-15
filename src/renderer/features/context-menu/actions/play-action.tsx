import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { useCurrentServerId } from '/@/renderer/store';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { LibraryItem } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface PlayActionProps {
    ids: string[];
    itemType: LibraryItem;
}

export const PlayAction = ({ ids, itemType }: PlayActionProps) => {
    const { t } = useTranslation();
    const player = usePlayer();
    const serverId = useCurrentServerId();

    const handlePlay = useCallback(
        (playType: Play) => {
            if (ids.length === 0 || !serverId) return;
            player.addToQueueByFetch(serverId, ids, itemType, playType);
        },
        [ids, itemType, player, serverId],
    );

    const handlePlayNow = useCallback(() => {
        handlePlay(Play.NOW);
    }, [handlePlay]);

    const handlePlayNext = useCallback(() => {
        handlePlay(Play.NEXT);
    }, [handlePlay]);

    const handlePlayLast = useCallback(() => {
        handlePlay(Play.LAST);
    }, [handlePlay]);

    const handlePlayShuffled = useCallback(() => {
        handlePlay(Play.SHUFFLE);
    }, [handlePlay]);

    if (ids.length === 0) return null;

    return (
        <ContextMenu.Submenu>
            <ContextMenu.SubmenuTarget>
                <ContextMenu.Item
                    leftIcon="mediaPlay"
                    onSelect={(e) => e.preventDefault()}
                    rightIcon="arrowRightS"
                >
                    {t('player.play', { postProcess: 'sentenceCase' })}
                </ContextMenu.Item>
            </ContextMenu.SubmenuTarget>
            <ContextMenu.SubmenuContent>
                <ContextMenu.Item leftIcon="mediaPlay" onSelect={handlePlayNow}>
                    {t('player.play', { postProcess: 'sentenceCase' })}
                </ContextMenu.Item>
                <ContextMenu.Item leftIcon="mediaPlayNext" onSelect={handlePlayNext}>
                    {t('player.addNext', { postProcess: 'sentenceCase' })}
                </ContextMenu.Item>
                <ContextMenu.Item leftIcon="mediaPlayLast" onSelect={handlePlayLast}>
                    {t('player.addLast', { postProcess: 'sentenceCase' })}
                </ContextMenu.Item>
                <ContextMenu.Item leftIcon="mediaShuffle" onSelect={handlePlayShuffled}>
                    {t('player.shuffle', { postProcess: 'sentenceCase' })}
                </ContextMenu.Item>
            </ContextMenu.SubmenuContent>
        </ContextMenu.Submenu>
    );
};
