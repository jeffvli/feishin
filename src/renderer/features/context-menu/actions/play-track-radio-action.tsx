import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { queryKeys } from '/@/renderer/api/query-keys';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { useCurrentServerId } from '/@/renderer/store';
import { ContextMenu } from '/@/shared/components/context-menu/context-menu';
import { Song } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

interface PlayTrackRadioActionProps {
    song: Song;
}

export const PlayTrackRadioAction = ({ song }: PlayTrackRadioActionProps) => {
    const { t } = useTranslation();
    const player = usePlayer();
    const serverId = useCurrentServerId();
    const queryClient = useQueryClient();
    const handlePlayTrackRadio = useCallback(async () => {
        if (!serverId || !song) return;

        try {
            const similarSongs = await queryClient.fetchQuery({
                ...songsQueries.similar({
                    query: {
                        songId: song.id,
                    },
                    serverId,
                }),
                queryKey: queryKeys.player.fetch({ similarSongs: song.id }),
            });

            if (similarSongs && similarSongs.length > 0) {
                player.addToQueueByData(similarSongs, Play.NOW);
            }
        } catch (error) {
            console.error('Failed to load track radio:', error);
        }
    }, [player, queryClient, serverId, song]);

    return (
        <ContextMenu.Item leftIcon="radio" onSelect={handlePlayTrackRadio}>
            {t('player.trackRadio', { postProcess: 'sentenceCase' })}
        </ContextMenu.Item>
    );
};
