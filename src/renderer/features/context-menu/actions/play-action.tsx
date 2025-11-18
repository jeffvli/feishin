import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { useCurrentServerId, usePlayButtonBehavior } from '/@/renderer/store';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { LibraryItem, Song } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface PlayActionProps {
    ids: string[];
    itemType: LibraryItem;
    songs?: Song[];
}

export const PlayAction = ({ ids, itemType, songs }: PlayActionProps) => {
    const { t } = useTranslation();
    const player = usePlayer();
    const serverId = useCurrentServerId();

    const handlePlay = useCallback(
        (playType: Play) => {
            if (ids.length === 0 || !serverId) return;

            if (itemType === LibraryItem.SONG) {
                player.addToQueueByData(songs || [], playType);
            } else {
                player.addToQueueByFetch(serverId, ids, itemType, playType);
            }
        },
        [ids, itemType, player, serverId, songs],
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

    const playButtonBehavior = usePlayButtonBehavior();

    const defaultPlayAction = useCallback(() => {
        handlePlay(playButtonBehavior);
    }, [handlePlay, playButtonBehavior]);

    if (ids.length === 0) return null;

    return (
        <ContextMenu.Submenu>
            <ContextMenu.SubmenuTarget>
                <ContextMenu.Item
                    leftIcon="mediaPlay"
                    onSelect={defaultPlayAction}
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
