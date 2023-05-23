import { useMemo } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '/@/renderer/features/action-required';
import { useCurrentSong } from '/@/renderer/store';
import { SynchronizedLyricsArray, SynchronizedLyrics } from './synchronized-lyrics';
import { UnsynchronizedLyrics } from '/@/renderer/features/lyrics/unsynchronized-lyrics';

// use by https://github.com/ustbhuangyi/lyric-parser

const timeExp = /\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?]([^\n]+)\n/g;

export const Lyrics = () => {
  const currentSong = useCurrentSong();

  const lyrics = useMemo(() => {
    if (currentSong?.lyrics) {
      const originalText = currentSong.lyrics;
      console.log(originalText);

      const synchronizedLines = originalText.matchAll(timeExp);

      const synchronizedTimes: SynchronizedLyricsArray = [];

      for (const line of synchronizedLines) {
        const [, minute, sec, ms, text] = line;
        const minutes = parseInt(minute, 10);
        const seconds = parseInt(sec, 10);
        const milis = ms.length === 3 ? parseInt(ms, 10) : parseInt(ms, 10) * 10;

        const timeInMilis = (minutes * 60 + seconds) * 1000 + milis;
        synchronizedTimes.push([timeInMilis, text]);
      }

      if (synchronizedTimes.length === 0) {
        return originalText;
      }
      return synchronizedTimes;
    }
    return null;
  }, [currentSong?.lyrics]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {lyrics &&
        (Array.isArray(lyrics) ? (
          <SynchronizedLyrics lyrics={lyrics} />
        ) : (
          <UnsynchronizedLyrics lyrics={lyrics} />
        ))}
    </ErrorBoundary>
  );
};
