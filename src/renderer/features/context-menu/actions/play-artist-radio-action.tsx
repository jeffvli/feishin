import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { queryKeys } from '/@/renderer/api/query-keys';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { useCurrentServerId, useGeneralSettings } from '/@/renderer/store';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { Artist } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface PlayArtistRadioActionProps {
    artist: Artist;
    disabled?: boolean;
}

export const PlayArtistRadioAction = ({ artist, disabled }: PlayArtistRadioActionProps) => {
    const { artistRadioCount } = useGeneralSettings();
    const { t } = useTranslation();
    const player = usePlayer();
    const serverId = useCurrentServerId();
    const queryClient = useQueryClient();
    const handlePlayArtistRadio = useCallback(async () => {
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
                player.addToQueueByData(artistRadioSongs, Play.NOW);
            }
        } catch (error) {
            console.error('Failed to load track radio:', error);
        }
    }, [artist, artistRadioCount, player, queryClient, serverId]);

    return (
        <ContextMenu.Item disabled={disabled} leftIcon="radio" onSelect={handlePlayArtistRadio}>
            {t('player.artistRadio', { postProcess: 'sentenceCase' })}
        </ContextMenu.Item>
    );
};
