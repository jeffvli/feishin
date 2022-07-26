import { useEffect } from 'react';
import { usePlayerStore } from 'renderer/store';
import { mpvPlayer } from '../utils/mpvPlayer';

export const useRightControls = () => {
  const setSettings = usePlayerStore((state) => state.setSettings);
  const volume = usePlayerStore((state) => state.settings.volume);
  const muted = usePlayerStore((state) => state.settings.muted);

  // Ensure that the mpv player volume is set on startup
  useEffect(() => {
    mpvPlayer.volume(volume);
  }, [volume]);

  // Ensure that the mpv player mute status is set on startup
  useEffect(() => {
    if (muted) {
      mpvPlayer.mute();
    }
  }, [muted]);

  const handleVolumeSlider = (e: number) => {
    mpvPlayer.volume(e);
  };

  const handleVolumeSliderState = (e: number) => {
    setSettings({ volume: e });
  };

  const handleMute = () => {
    setSettings({ muted: !muted });
    mpvPlayer.mute();
  };

  return {
    handleMute,
    handleVolumeSlider,
    handleVolumeSliderState,
  };
};
