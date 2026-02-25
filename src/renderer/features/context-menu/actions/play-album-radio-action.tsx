import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { queryKeys } from '/@/renderer/api/query-keys';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { useArtistRadioCount, useCurrentServerId, usePlayButtonBehavior } from '/@/renderer/store';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { Album } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface PlayAlbumRadioActionProps {
    album: Album;
    disabled?: boolean;
}

export const PlayAlbumRadioAction = ({ album, disabled }: PlayAlbumRadioActionProps) => {
    const albumRadioCount = useArtistRadioCount(); // Reuse the same setting for album radio
    const { t } = useTranslation();
    const player = usePlayer();
    const serverId = useCurrentServerId();
    const queryClient = useQueryClient();
    const playButtonBehavior = usePlayButtonBehavior();

    const handlePlayAlbumRadio = useCallback(
        async (playType: Play) => {
            if (!serverId || !album) return;

            try {
                const albumRadioSongs = await queryClient.fetchQuery({
                    ...songsQueries.albumRadio({
                        query: {
                            albumId: album.id,
                            count: albumRadioCount,
                        },
                        serverId: serverId,
                    }),
                    queryKey: queryKeys.player.fetch({ albumId: album.id }),
                });
                if (albumRadioSongs && albumRadioSongs.length > 0) {
                    player.addToQueueByData(albumRadioSongs, playType);
                }
            } catch (error) {
                console.error('Failed to load album radio:', error);
            }
        },
        [album, albumRadioCount, player, queryClient, serverId],
    );

    const handlePlayAlbumRadioNow = useCallback(() => {
        handlePlayAlbumRadio(Play.NOW);
    }, [handlePlayAlbumRadio]);

    const handlePlayAlbumRadioNext = useCallback(() => {
        handlePlayAlbumRadio(Play.NEXT);
    }, [handlePlayAlbumRadio]);

    const handlePlayAlbumRadioLast = useCallback(() => {
        handlePlayAlbumRadio(Play.LAST);
    }, [handlePlayAlbumRadio]);

    const defaultPlayAlbumRadioAction = useCallback(() => {
        handlePlayAlbumRadio(playButtonBehavior);
    }, [handlePlayAlbumRadio, playButtonBehavior]);

    return (
        <ContextMenu.Submenu>
            <ContextMenu.SubmenuTarget>
                <ContextMenu.Item
                    disabled={disabled}
                    leftIcon="radio"
                    onSelect={defaultPlayAlbumRadioAction}
                    rightIcon="arrowRightS"
                >
                    {t('player.albumRadio', { postProcess: 'sentenceCase' })}
                </ContextMenu.Item>
            </ContextMenu.SubmenuTarget>
            <ContextMenu.SubmenuContent>
                <ContextMenu.Item leftIcon="mediaPlay" onSelect={handlePlayAlbumRadioNow}>
                    {t('player.play', { postProcess: 'sentenceCase' })}
                </ContextMenu.Item>
                <ContextMenu.Item leftIcon="mediaPlayNext" onSelect={handlePlayAlbumRadioNext}>
                    {t('player.addNext', { postProcess: 'sentenceCase' })}
                </ContextMenu.Item>
                <ContextMenu.Item leftIcon="mediaPlayLast" onSelect={handlePlayAlbumRadioLast}>
                    {t('player.addLast', { postProcess: 'sentenceCase' })}
                </ContextMenu.Item>
            </ContextMenu.SubmenuContent>
        </ContextMenu.Submenu>
    );
};
