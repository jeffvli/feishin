import { useEffect } from 'react';
import { mpvPlayer } from '#preload';
import { usePlayerStore } from '../../../store';

export const useRightControls = () => {
  const setVolume = usePlayerStore((state) => state.setVolume);
  const volume = usePlayerStore((state) => state.volume);
  const muted = usePlayerStore((state) => state.muted);
  const setMuted = usePlayerStore((state) => state.setMuted);

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
