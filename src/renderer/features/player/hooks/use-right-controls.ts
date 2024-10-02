import { useCallback, useEffect, WheelEvent } from 'react';
import isElectron from 'is-electron';
import {
    useMuted,
    usePlayerControls,
    useSetCurrentSpeed,
    useSpeed,
    useVolume,
} from '/@/renderer/store';
import { useGeneralSettings } from '/@/renderer/store/settings.store';

const mpvPlayer = isElectron() ? window.electron.mpvPlayer : null;
const mpvPlayerListener = isElectron() ? window.electron.mpvPlayerListener : null;
const ipc = isElectron() ? window.electron.ipc : null;
const remote = isElectron() ? window.electron.remote : null;

const calculateVolumeUp = (volume: number, volumeWheelStep: number) => {
    let volumeToSet;
    const newVolumeGreaterThanHundred = volume + volumeWheelStep > 100;
    if (newVolumeGreaterThanHundred) {
        volumeToSet = 100;
    } else {
        volumeToSet = volume + volumeWheelStep;
    }

    return volumeToSet;
};

const calculateVolumeDown = (volume: number, volumeWheelStep: number) => {
    let volumeToSet;
    const newVolumeLessThanZero = volume - volumeWheelStep < 0;
    if (newVolumeLessThanZero) {
        volumeToSet = 0;
    } else {
        volumeToSet = volume - volumeWheelStep;
    }

    return volumeToSet;
};

export const useRightControls = () => {
    const { setVolume, setMuted } = usePlayerControls();
    const volume = useVolume();
    const muted = useMuted();
    const { volumeWheelStep } = useGeneralSettings();
    const speed = useSpeed();
    const setCurrentSpeed = useSetCurrentSpeed();

    // Ensure that the mpv player volume is set on startup
    useEffect(() => {
        remote?.updateVolume(volume);

        if (mpvPlayer) {
            mpvPlayer.volume(volume);
            mpvPlayer.setProperties({ speed });

            if (muted) {
                mpvPlayer.mute(muted);
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSpeed = useCallback(
        (e: number) => {
            setCurrentSpeed(e);
            if (mpvPlayer) {
                mpvPlayer?.setProperties({ speed: e });
            }
        },
        [setCurrentSpeed],
    );

    const handleVolumeSlider = (e: number) => {
        mpvPlayer?.volume(e);
        remote?.updateVolume(e);
        setVolume(e);
    };

    const handleVolumeSliderState = (e: number) => {
        remote?.updateVolume(e);
        setVolume(e);
    };

    const handleVolumeDown = useCallback(() => {
        const volumeToSet = calculateVolumeDown(volume, volumeWheelStep);
        mpvPlayer?.volume(volumeToSet);
        remote?.updateVolume(volumeToSet);
        setVolume(volumeToSet);
    }, [setVolume, volume, volumeWheelStep]);

    const handleVolumeUp = useCallback(() => {
        const volumeToSet = calculateVolumeUp(volume, volumeWheelStep);
        mpvPlayer?.volume(volumeToSet);
        remote?.updateVolume(volumeToSet);
        setVolume(volumeToSet);
    }, [setVolume, volume, volumeWheelStep]);

    const handleVolumeWheel = useCallback(
        (e: WheelEvent<HTMLDivElement | HTMLButtonElement>) => {
            let volumeToSet;
            if (e.deltaY > 0 || e.deltaX > 0) {
                volumeToSet = calculateVolumeDown(volume, volumeWheelStep);
            } else {
                volumeToSet = calculateVolumeUp(volume, volumeWheelStep);
            }

            mpvPlayer?.volume(volumeToSet);
            remote?.updateVolume(volumeToSet);
            setVolume(volumeToSet);
        },
        [setVolume, volume, volumeWheelStep],
    );

    const handleMute = useCallback(() => {
        setMuted(!muted);
        mpvPlayer?.mute(!muted);
    }, [muted, setMuted]);

    useEffect(() => {
        if (isElectron()) {
            mpvPlayerListener?.rendererVolumeMute(() => {
                handleMute();
            });

            mpvPlayerListener?.rendererVolumeUp(() => {
                handleVolumeUp();
            });

            mpvPlayerListener?.rendererVolumeDown(() => {
                handleVolumeDown();
            });
        }

        return () => {
            ipc?.removeAllListeners('renderer-player-volume-mute');
            ipc?.removeAllListeners('renderer-player-volume-up');
            ipc?.removeAllListeners('renderer-player-volume-down');
        };
    }, [handleMute, handleVolumeDown, handleVolumeUp]);

    return {
        handleMute,
        handleSpeed,
        handleVolumeDown,
        handleVolumeSlider,
        handleVolumeSliderState,
        handleVolumeUp,
        handleVolumeWheel,
    };
};
