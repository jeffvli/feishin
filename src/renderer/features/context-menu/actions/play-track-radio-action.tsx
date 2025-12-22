import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { useCurrentServerId, useGeneralSettings } from '/@/renderer/store';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { Song } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';
import { useQueryClient } from '@tanstack/react-query';

interface PlayTrackRadioActionProps {
    song: Song;
}

export const PlayTrackRadioAction = ({ song }: PlayTrackRadioActionProps) => {
    const { t } = useTranslation();
    const player = usePlayer();
    const serverId = useCurrentServerId();
    const queryClient = useQueryClient();
    const { artistRadioCount } = useGeneralSettings();

    const handlePlayTrackRadio = useCallback(async () => {
        if (!serverId || !song) return;

        try {
            const similarSongs = await queryClient.fetchQuery(
                songsQueries.similar({
                    query: {
                        albumArtistIds: song.albumArtists.map((art) => art.id),
                        count: artistRadioCount,
                        songId: song.id,
                    },
                    serverId,
                }),
            );

            if (similarSongs && similarSongs.length > 0) {
                player.addToQueueByData(similarSongs, Play.NOW);
            }
        } catch (error) {
            console.error('Failed to load track radio:', error);
        }
    }, [artistRadioCount, player, queryClient, serverId, song]);

    if (!song) return null;

    return (
        <ContextMenu.Item leftIcon="radio" onSelect={handlePlayTrackRadio}>
            {t('player.trackRadio', { postProcess: 'sentenceCase' })}
        </ContextMenu.Item>
    );
};
