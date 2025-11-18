import { useEffect } from 'react';

import {
    usePlaybackSettings,
    usePlayerSong,
    usePlayerStatus,
    useSettingsStore,
} from '/@/renderer/store';
import { PlayerStatus } from '/@/shared/types/types';

export const useMediaSession = ({
    handleNextTrack,
    handlePause,
    handlePlay,
    handlePrevTrack,
    handleSeekSlider,
    handleSkipBackward,
    handleSkipForward,
    handleStop,
}: {
    handleNextTrack: () => void;
    handlePause: () => void;
    handlePlay: () => void;
    handlePrevTrack: () => void;
    handleSeekSlider: (e: any | number) => void;
    handleSkipBackward: (seconds: number) => void;
    handleSkipForward: (seconds: number) => void;
    handleStop: () => void;
}) => {
    const { mediaSession: mediaSessionEnabled } = usePlaybackSettings();
    const playerStatus = usePlayerStatus();
    const currentSong = usePlayerSong();
    const mediaSession = navigator.mediaSession;
    const skip = useSettingsStore((state) => state.general.skipButtons);

    useEffect(() => {
        if (!mediaSessionEnabled || !mediaSession) {
            return;
        }

        mediaSession.setActionHandler('nexttrack', () => {
            handleNextTrack();
        });

        mediaSession.setActionHandler('pause', () => {
            handlePause();
        });

        mediaSession.setActionHandler('play', () => {
            handlePlay();
        });

        mediaSession.setActionHandler('previoustrack', () => {
            handlePrevTrack();
        });

        mediaSession.setActionHandler('seekto', (e) => {
            handleSeekSlider(e.seekTime);
        });

        mediaSession.setActionHandler('stop', () => {
            handleStop();
        });

        mediaSession.setActionHandler('seekbackward', (e) => {
            handleSkipBackward(e.seekOffset || skip?.skipBackwardSeconds || 5);
        });

        mediaSession.setActionHandler('seekforward', (e) => {
            handleSkipForward(e.seekOffset || skip?.skipForwardSeconds || 5);
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
    }, [
        handleNextTrack,
        handlePause,
        handlePlay,
        handlePrevTrack,
        handleSeekSlider,
        handleSkipBackward,
        handleSkipForward,
        handleStop,
        mediaSession,
        mediaSessionEnabled,
        skip?.skipBackwardSeconds,
        skip?.skipForwardSeconds,
    ]);

    useEffect(() => {
        if (!mediaSessionEnabled || !mediaSession) {
            return;
        }

        const updateMetadata = () => {
            mediaSession.metadata = new MediaMetadata({
                album: currentSong?.album ?? '',
                artist: currentSong?.artistName ?? '',
                artwork: currentSong?.imageUrl
                    ? [{ src: currentSong.imageUrl, type: 'image/png' }]
                    : [],
                title: currentSong?.name ?? '',
            });
        };

        updateMetadata();

        return () => {
            mediaSession.metadata = null;
        };
    }, [currentSong, mediaSession, mediaSessionEnabled]);

    useEffect(() => {
        if (!mediaSessionEnabled || !mediaSession) {
            return;
        }

        if (mediaSession) {
            const status = playerStatus === PlayerStatus.PLAYING ? 'playing' : 'paused';
            mediaSession.playbackState = status;
        }

        return () => {
            mediaSession.playbackState = 'none';
        };
    }, [playerStatus, mediaSession, mediaSessionEnabled]);
};
