import { useCallback, useEffect, WheelEvent } from 'react';
import isElectron from 'is-electron';
import { useMuted, usePlayerControls, useVolume } from '/@/renderer/store';
import { useGeneralSettings } from '/@/renderer/store/settings.store';

const mpvPlayer = isElectron() ? window.electron.mpvPlayer : null;
const mpvPlayerListener = isElectron() ? window.electron.mpvPlayerListener : null;
const ipc = isElectron() ? window.electron.ipc : null;
const utils = isElectron() ? window.electron.utils : null;
const mpris = isElectron() && utils?.isLinux() ? window.electron.mpris : null;

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

    // Ensure that the mpv player volume is set on startup
    useEffect(() => {
        if (isElectron()) {
            mpvPlayer.volume(volume);
            mpris?.updateVolume(volume / 100);

            if (muted) {
                mpvPlayer.mute();
            }
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleVolumeSlider = (e: number) => {
        mpvPlayer?.volume(e);
        mpris?.updateVolume(e / 100);
        setVolume(e);
    };

    const handleVolumeSliderState = (e: number) => {
        mpris?.updateVolume(e / 100);
        setVolume(e);
    };

    const handleVolumeDown = useCallback(() => {
        const volumeToSet = calculateVolumeDown(volume, volumeWheelStep);
        mpvPlayer?.volume(volumeToSet);
        mpris?.updateVolume(volumeToSet / 100);
        setVolume(volumeToSet);
    }, [setVolume, volume, volumeWheelStep]);

    const handleVolumeUp = useCallback(() => {
        const volumeToSet = calculateVolumeUp(volume, volumeWheelStep);
        mpvPlayer?.volume(volumeToSet);
        mpris?.updateVolume(volumeToSet / 100);
        setVolume(volumeToSet);
    }, [setVolume, volume, volumeWheelStep]);

    const handleVolumeWheel = useCallback(
        (e: WheelEvent<HTMLDivElement | HTMLButtonElement>) => {
            let volumeToSet;
            if (e.deltaY > 0) {
                volumeToSet = calculateVolumeDown(volume, volumeWheelStep);
            } else {
                volumeToSet = calculateVolumeUp(volume, volumeWheelStep);
            }

            mpvPlayer?.volume(volumeToSet);
            mpris?.updateVolume(volumeToSet / 100);
            setVolume(volumeToSet);
        },
        [setVolume, volume, volumeWheelStep],
    );

    const handleMute = useCallback(() => {
        setMuted(!muted);
        mpvPlayer?.mute();
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
        handleVolumeDown,
        handleVolumeSlider,
        handleVolumeSliderState,
        handleVolumeUp,
        handleVolumeWheel,
    };
};
