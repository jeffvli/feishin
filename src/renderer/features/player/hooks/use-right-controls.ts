import { useEffect, WheelEvent } from 'react';
import isElectron from 'is-electron';
import { useMuted, usePlayerControls, useVolume } from '/@/renderer/store';
import { useGeneralSettings } from '/@/renderer/store/settings.store';

const mpvPlayer = isElectron() ? window.electron.mpvPlayer : null;

export const useRightControls = () => {
  const { setVolume, setMuted } = usePlayerControls();
  const volume = useVolume();
  const muted = useMuted();
  const { volumeWheelStep } = useGeneralSettings();

  // Ensure that the mpv player volume is set on startup
  useEffect(() => {
    if (isElectron()) {
      mpvPlayer.volume(volume);

      if (muted) {
        mpvPlayer.mute();
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVolumeSlider = (e: number) => {
    mpvPlayer.volume(e);
    setVolume(e);
  };

  const handleVolumeSliderState = (e: number) => {
    setVolume(e);
  };

  const handleVolumeWheel = (e: WheelEvent<HTMLDivElement>) => {
    let newVolume;
    if (e.deltaY > 0) {
      newVolume = volume - volumeWheelStep;
    } else {
      newVolume = volume + volumeWheelStep;
    }

    mpvPlayer.volume(newVolume);
    setVolume(newVolume);
  };

  const handleMute = () => {
    setMuted(!muted);
    mpvPlayer.mute();
  };

  return {
    handleMute,
    handleVolumeSlider,
    handleVolumeSliderState,
    handleVolumeWheel,
  };
};
