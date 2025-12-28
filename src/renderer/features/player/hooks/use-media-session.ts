import isElectron from 'is-electron';
import { useEffect, useMemo } from 'react';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import {
    usePlaybackSettings,
    usePlayerSong,
    useSettingsStore,
    useTimestampStoreBase,
} from '/@/renderer/store';
import { LibraryItem } from '/@/shared/types/domain-types';
import { PlayerStatus, PlayerType } from '/@/shared/types/types';

const mediaSession = navigator.mediaSession;

export const useMediaSession = () => {
    const { mediaSession: mediaSessionEnabled } = usePlaybackSettings();
    const player = usePlayer();
    const skip = useSettingsStore((state) => state.general.skipButtons);
    const playbackType = useSettingsStore((state) => state.playback.type);
    const currentSong = usePlayerSong();

    const imageUrl = useItemImageUrl({
        id: currentSong?.imageId || undefined,
        imageUrl: currentSong?.imageUrl,
        itemType: LibraryItem.SONG,
        type: 'itemCard',
    });

    const isMediaSessionEnabled = useMemo(() => {
        // Always enable media session on web
        if (!isElectron()) {
            return true;
        }

        return Boolean(mediaSessionEnabled && playbackType === PlayerType.WEB);
    }, [mediaSessionEnabled, playbackType]);

    useEffect(() => {
        if (!isMediaSessionEnabled) {
            return;
        }

        mediaSession.setActionHandler('nexttrack', () => {
            player.mediaNext();
        });

        mediaSession.setActionHandler('pause', () => {
            player.mediaPause();
        });

        mediaSession.setActionHandler('play', () => {
            player.mediaPlay();
        });

        mediaSession.setActionHandler('previoustrack', () => {
            player.mediaPrevious();
        });

        mediaSession.setActionHandler('seekto', (e) => {
            if (e.seekTime) {
                player.mediaSeekToTimestamp(e.seekTime);
            } else if (e.seekOffset) {
                const currentTimestamp = useTimestampStoreBase.getState().timestamp;
                player.mediaSeekToTimestamp(currentTimestamp + e.seekOffset);
            }
        });

        mediaSession.setActionHandler('stop', () => {
            player.mediaStop();
        });

        mediaSession.setActionHandler('seekbackward', (e) => {
            const currentTimestamp = useTimestampStoreBase.getState().timestamp;
            player.mediaSeekToTimestamp(
                currentTimestamp - (e.seekOffset || skip?.skipBackwardSeconds || 5),
            );
        });

        mediaSession.setActionHandler('seekforward', (e) => {
            const currentTimestamp = useTimestampStoreBase.getState().timestamp;
            player.mediaSeekToTimestamp(
                currentTimestamp + (e.seekOffset || skip?.skipForwardSeconds || 5),
            );
        });

        return () => {
            mediaSession.setActionHandler('nexttrack', null);
            mediaSession.setActionHandler('pause', null);
            mediaSession.setActionHandler('play', null);
            mediaSession.setActionHandler('previoustrack', null);
            mediaSession.setActionHandler('seekto', null);
            mediaSession.setActionHandler('stop', null);
            mediaSession.setActionHandler('seekbackward', null);
            mediaSession.setActionHandler('seekforward', null);
        };
    }, [player, skip?.skipBackwardSeconds, skip?.skipForwardSeconds, isMediaSessionEnabled]);

    usePlayerEvents(
        {
            onCurrentSongChange: (properties) => {
                if (!isMediaSessionEnabled) {
                    return;
                }

                const song = properties.song;
                mediaSession.metadata = new MediaMetadata({
                    album: song?.album ?? '',
                    artist: song?.artistName ?? '',
                    artwork: imageUrl ? [{ src: imageUrl, type: 'image/png' }] : [],
                    title: song?.name ?? '',
                });
            },
            onPlayerStatus: (properties) => {
                if (!isMediaSessionEnabled) {
                    return;
                }

                const status = properties.status;
                mediaSession.playbackState = status === PlayerStatus.PLAYING ? 'playing' : 'paused';
            },
        },
        [isMediaSessionEnabled, mediaSession, imageUrl],
    );
};
