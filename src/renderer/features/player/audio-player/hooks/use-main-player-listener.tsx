import { t } from 'i18next';
import isElectron from 'is-electron';
import { useCallback, useEffect, useRef } from 'react';

import { useIsRadioActive, useRadioStore } from '/@/renderer/features/radio/hooks/use-radio-player';
import { useSetFavorite } from '/@/renderer/features/shared/hooks/use-set-favorite';
import { useSetRating } from '/@/renderer/features/shared/hooks/use-set-rating';
import {
    usePlayerActions,
    usePlayerData,
    usePlayerSong,
    useVolumeWheelStep,
} from '/@/renderer/store';
import { toast } from '/@/shared/components/toast/toast';
import { LibraryItem } from '/@/shared/types/domain-types';

const mpvPlayer = isElectron() ? window.api.mpvPlayer : null;
const mpvPlayerListener = isElectron() ? window.api.mpvPlayerListener : null;
const ipc = isElectron() ? window.api.ipc : null;

const toggleRadioPlayPause = () => {
    const radio = useRadioStore.getState();

    if (radio.isPlaying) {
        radio.actions.pause();
    } else if (radio.currentStreamUrl) {
        radio.actions.play();
    }
};

export const useMainPlayerListener = () => {
    const isRadioActive = useIsRadioActive();
    const volumeWheelStep = useVolumeWheelStep();
    const currentSong = usePlayerSong();
    const { previousSong } = usePlayerData();
    const setFavorite = useSetFavorite();
    const setRating = useSetRating();

    const currentSongRef = useRef(currentSong);
    currentSongRef.current = currentSong;
    const previousSongRef = useRef(previousSong);
    previousSongRef.current = previousSong;

    const {
        decreaseVolume,
        increaseVolume,
        mediaAutoNext,
        mediaNext,
        mediaPause,
        mediaPlay,
        mediaPrevious,
        mediaSkipBackward,
        mediaSkipForward,
        mediaStop,
        mediaToggleMute,
        mediaTogglePlayPause,
        toggleRepeat,
        toggleShuffle,
    } = usePlayerActions();

    const handleMpvError = useCallback(
        (message: string) => {
            toast.error({
                id: 'mpv-error',
                message,
                title: t('error.playbackError') as string,
            });
            mediaPause();
            mpvPlayer!.pause();
        },
        [mediaPause],
    );

    useEffect(() => {
        if (!mpvPlayerListener) {
            return;
        }

        mpvPlayerListener.rendererPlayPause(() => {
            if (!isRadioActive) {
                mediaTogglePlayPause();
                return;
            }

            toggleRadioPlayPause();
        });

        mpvPlayerListener.rendererNext(() => {
            if (!isRadioActive) {
                mediaNext(false);
            }
        });

        mpvPlayerListener.rendererNextAlbum(() => {
            if (!isRadioActive) {
                mediaNext(true);
            }
        });

        mpvPlayerListener.rendererPrevious(() => {
            if (!isRadioActive) {
                mediaPrevious(false);
            }
        });

        mpvPlayerListener.rendererPreviousAlbum(() => {
            if (!isRadioActive) {
                mediaPrevious(true);
            }
        });

        mpvPlayerListener.rendererPlay(() => {
            if (!isRadioActive) {
                mediaPlay();
            } else {
                const radio = useRadioStore.getState();
                if (radio.currentStreamUrl) {
                    radio.actions.play();
                }
            }
        });

        mpvPlayerListener.rendererPause(() => {
            if (!isRadioActive) {
                mediaPause();
            } else {
                useRadioStore.getState().actions.pause();
            }
        });

        mpvPlayerListener.rendererStop(() => {
            if (!isRadioActive) {
                mediaStop({ reset: false });
            } else {
                useRadioStore.getState().actions.stop();
            }
        });

        mpvPlayerListener.rendererSkipForward(() => {
            mediaSkipForward();
        });

        mpvPlayerListener.rendererSkipBackward(() => {
            mediaSkipBackward();
        });

        mpvPlayerListener.rendererToggleShuffle(() => {
            toggleShuffle();
        });

        mpvPlayerListener.rendererToggleRepeat(() => {
            toggleRepeat();
        });

        mpvPlayerListener.rendererVolumeMute(() => {
            mediaToggleMute();
        });

        mpvPlayerListener.rendererVolumeUp(() => {
            increaseVolume(volumeWheelStep);
        });

        mpvPlayerListener.rendererVolumeDown(() => {
            decreaseVolume(volumeWheelStep);
        });

        mpvPlayerListener.rendererFavoriteCurrentAdd(() => {
            const song = currentSongRef.current;
            if (!song?.id) return;
            setFavorite(song._serverId || '', [song.id], LibraryItem.SONG, true);
        });

        mpvPlayerListener.rendererFavoriteCurrentRemove(() => {
            const song = currentSongRef.current;
            if (!song?.id) return;
            setFavorite(song._serverId || '', [song.id], LibraryItem.SONG, false);
        });

        mpvPlayerListener.rendererFavoriteCurrentToggle(() => {
            const song = currentSongRef.current;
            if (!song?.id) return;
            setFavorite(song._serverId || '', [song.id], LibraryItem.SONG, !song.userFavorite);
        });

        mpvPlayerListener.rendererFavoritePreviousAdd(() => {
            const song = previousSongRef.current;
            if (!song?.id) return;
            setFavorite(song._serverId || '', [song.id], LibraryItem.SONG, true);
        });

        mpvPlayerListener.rendererFavoritePreviousRemove(() => {
            const song = previousSongRef.current;
            if (!song?.id) return;
            setFavorite(song._serverId || '', [song.id], LibraryItem.SONG, false);
        });

        mpvPlayerListener.rendererFavoritePreviousToggle(() => {
            const song = previousSongRef.current;
            if (!song?.id) return;
            setFavorite(song._serverId || '', [song.id], LibraryItem.SONG, !song.userFavorite);
        });

        mpvPlayerListener.rendererRate((rating: number) => {
            const song = currentSongRef.current;
            if (!song?.id) return;
            setRating(song._serverId || '', [song.id], LibraryItem.SONG, rating);
        });

        mpvPlayerListener.rendererError((message: string) => {
            handleMpvError(message);
        });

        return () => {
            ipc?.removeAllListeners('renderer-player-play-pause');
            ipc?.removeAllListeners('renderer-player-next');
            ipc?.removeAllListeners('renderer-player-previous');
            ipc?.removeAllListeners('renderer-player-play');
            ipc?.removeAllListeners('renderer-player-pause');
            ipc?.removeAllListeners('renderer-player-stop');
            ipc?.removeAllListeners('renderer-player-skip-forward');
            ipc?.removeAllListeners('renderer-player-skip-backward');
            ipc?.removeAllListeners('renderer-player-toggle-shuffle');
            ipc?.removeAllListeners('renderer-player-toggle-repeat');
            ipc?.removeAllListeners('renderer-player-volume-mute');
            ipc?.removeAllListeners('renderer-player-volume-up');
            ipc?.removeAllListeners('renderer-player-volume-down');
            ipc?.removeAllListeners('renderer-player-favorite-current-add');
            ipc?.removeAllListeners('renderer-player-favorite-current-remove');
            ipc?.removeAllListeners('renderer-player-favorite-current-toggle');
            ipc?.removeAllListeners('renderer-player-favorite-previous-add');
            ipc?.removeAllListeners('renderer-player-favorite-previous-remove');
            ipc?.removeAllListeners('renderer-player-favorite-previous-toggle');
            ipc?.removeAllListeners('renderer-player-rate');
            ipc?.removeAllListeners('renderer-player-error');
        };
    }, [
        decreaseVolume,
        handleMpvError,
        increaseVolume,
        isRadioActive,
        mediaAutoNext,
        mediaNext,
        mediaPause,
        mediaPlay,
        mediaPrevious,
        mediaSkipForward,
        mediaSkipBackward,
        mediaStop,
        mediaToggleMute,
        mediaTogglePlayPause,
        setFavorite,
        setRating,
        toggleRepeat,
        toggleShuffle,
        volumeWheelStep,
    ]);
};

const MainPlayerListenerHookInner = () => {
    useMainPlayerListener();
    return null;
};

export const MainPlayerListenerHook = () => {
    const isElectronEnv = isElectron();
    const mpvPlayerListener = isElectronEnv ? window.api.mpvPlayerListener : null;

    if (mpvPlayerListener === null) {
        return null;
    }

    return <MainPlayerListenerHookInner />;
};
