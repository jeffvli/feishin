import { useEffect } from 'react';
import { usePlayerStore } from '../../../store';
import { mpvPlayer } from '../utils/mpvPlayer';

export const useRightControls = () => {
  const setSettings = usePlayerStore((state) => state.setSettings);
  const volume = usePlayerStore((state) => state.settings.volume);
  const muted = usePlayerStore((state) => state.settings.muted);

  // Ensure that the mpv player volume is set on startup
  useEffect(() => {
    mpvPlayer.volume(volume);

    if (muted) {
      mpvPlayer.mute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
