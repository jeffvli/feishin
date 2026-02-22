import { t } from 'i18next';
import isElectron from 'is-electron';
import { useCallback, useEffect } from 'react';

import { useIsRadioActive } from '/@/renderer/features/radio/hooks/use-radio-player';
import { usePlayerActions, useVolumeWheelStep } from '/@/renderer/store';
import { toast } from '/@/shared/components/toast/toast';

const mpvPlayer = isElectron() ? window.api.mpvPlayer : null;
const mpvPlayerListener = isElectron() ? window.api.mpvPlayerListener : null;
const ipc = isElectron() ? window.api.ipc : null;

export const useMainPlayerListener = () => {
    const isRadioActive = useIsRadioActive();
    const volumeWheelStep = useVolumeWheelStep();
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
                title: t('error.playbackError', { postProcess: 'sentenceCase' }) as string,
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
            }
        });

        mpvPlayerListener.rendererNext(() => {
            if (!isRadioActive) {
                mediaNext();
            }
        });

        mpvPlayerListener.rendererPrevious(() => {
            if (!isRadioActive) {
                mediaPrevious();
            }
        });

        mpvPlayerListener.rendererPlay(() => {
            if (!isRadioActive) {
                mediaPlay();
            }
        });

        mpvPlayerListener.rendererPause(() => {
            if (!isRadioActive) {
                mediaPause();
            }
        });

        mpvPlayerListener.rendererStop(() => {
            if (!isRadioActive) {
                mediaStop();
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

        mpvPlayerListener.rendererError((_event: any, message: string) => {
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
