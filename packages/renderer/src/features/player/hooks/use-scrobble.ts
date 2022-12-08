import { useState } from 'react';
import { usePlayerStore } from '/@/store';

export const useScrobble = () => {
  const [isScrobbled, setIsScrobbled] = useState(false);

  const currentSongDuration = usePlayerStore((state) => state.current.song?.duration);

  const scrobbleAtPercentage = usePlayerStore((state) => state.settings.scrobbleAtPercentage);

  console.log('currentSongDuration', currentSongDuration);

  const scrobbleAtTime = (currentSongDuration * scrobbleAtPercentage) / 100;

  console.log('scrobbleAtTime', scrobbleAtTime);

  console.log('render');
  const handleScrobble = () => {
    console.log('scrobble complete');
  };

  return { handleScrobble, isScrobbled, setIsScrobbled };
};
