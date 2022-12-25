import { useEffect } from 'react';
import isElectron from 'is-electron';
import { useMuted, usePlayerControls, useVolume } from '/@/renderer/store';

const mpvPlayer = isElectron() ? window.electron.mpvPlayer : null;

export const useRightControls = () => {
  const { setVolume, setMuted } = usePlayerControls();
  const volume = useVolume();
  const muted = useMuted();

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

  const handleMute = () => {
    setMuted(!muted);
    mpvPlayer.mute();
  };

  return {
    handleMute,
    handleVolumeSlider,
    handleVolumeSliderState,
  };
};
