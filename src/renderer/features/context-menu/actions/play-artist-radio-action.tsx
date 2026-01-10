import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { queryKeys } from '/@/renderer/api/query-keys';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { useArtistRadioCount, useCurrentServerId, usePlayButtonBehavior } from '/@/renderer/store';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { AlbumArtist, Artist } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface PlayArtistRadioActionProps {
    artist: AlbumArtist | Artist;
    disabled?: boolean;
}

export const PlayArtistRadioAction = ({ artist, disabled }: PlayArtistRadioActionProps) => {
    const artistRadioCount = useArtistRadioCount();
    const { t } = useTranslation();
    const player = usePlayer();
    const serverId = useCurrentServerId();
    const queryClient = useQueryClient();
    const playButtonBehavior = usePlayButtonBehavior();

    const handlePlayArtistRadio = useCallback(
        async (playType: Play) => {
            if (!serverId || !artist) return;

            try {
                const artistRadioSongs = await queryClient.fetchQuery({
                    ...songsQueries.artistRadio({
                        query: {
                            artistId: artist.id,
                            count: artistRadioCount,
                        },
                        serverId: serverId,
                    }),
                    queryKey: queryKeys.player.fetch({ artistId: artist.id }),
                });
                if (artistRadioSongs && artistRadioSongs.length > 0) {
                    player.addToQueueByData(artistRadioSongs, playType);
                }
            } catch (error) {
                console.error('Failed to load track radio:', error);
            }
        },
        [artist, artistRadioCount, player, queryClient, serverId],
    );

    const handlePlayArtistRadioNow = useCallback(() => {
        handlePlayArtistRadio(Play.NOW);
    }, [handlePlayArtistRadio]);

    const handlePlayArtistRadioNext = useCallback(() => {
        handlePlayArtistRadio(Play.NEXT);
    }, [handlePlayArtistRadio]);

    const handlePlayArtistRadioLast = useCallback(() => {
        handlePlayArtistRadio(Play.LAST);
    }, [handlePlayArtistRadio]);

    const defaultPlayArtistRadioAction = useCallback(() => {
        handlePlayArtistRadio(playButtonBehavior);
    }, [handlePlayArtistRadio, playButtonBehavior]);

    return (
        <ContextMenu.Submenu>
            <ContextMenu.SubmenuTarget>
                <ContextMenu.Item
                    disabled={disabled}
                    leftIcon="radio"
                    onSelect={defaultPlayArtistRadioAction}
                    rightIcon="arrowRightS"
                >
                    {t('player.artistRadio', { postProcess: 'sentenceCase' })}
                </ContextMenu.Item>
            </ContextMenu.SubmenuTarget>
            <ContextMenu.SubmenuContent>
                <ContextMenu.Item leftIcon="mediaPlay" onSelect={handlePlayArtistRadioNow}>
                    {t('player.play', { postProcess: 'sentenceCase' })}
                </ContextMenu.Item>
                <ContextMenu.Item leftIcon="mediaPlayNext" onSelect={handlePlayArtistRadioNext}>
                    {t('player.addNext', { postProcess: 'sentenceCase' })}
                </ContextMenu.Item>
                <ContextMenu.Item leftIcon="mediaPlayLast" onSelect={handlePlayArtistRadioLast}>
                    {t('player.addLast', { postProcess: 'sentenceCase' })}
                </ContextMenu.Item>
            </ContextMenu.SubmenuContent>
        </ContextMenu.Submenu>
    );
};
