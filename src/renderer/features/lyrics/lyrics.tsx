import { useEffect, useRef, useState } from 'react';
import isElectron from 'is-electron';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '/@/renderer/features/action-required';
import { useCurrentServer, useCurrentSong } from '/@/renderer/store';
import { SynchronizedLyricsArray, SynchronizedLyrics } from './synchronized-lyrics';
import { UnsynchronizedLyrics } from '/@/renderer/features/lyrics/unsynchronized-lyrics';
import { LyricLine } from '/@/renderer/features/lyrics/lyric-line';

const lyrics = isElectron() ? window.electron.lyrics : null;

const ipc = isElectron() ? window.electron.ipc : null;

// use by https://github.com/ustbhuangyi/lyric-parser
const timeExp = /\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?]([^\n]+)\n/g;

export const Lyrics = () => {
  const currentServer = useCurrentServer();
  const currentSong = useCurrentSong();

  const [override, setOverride] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [songLyrics, setSongLyrics] = useState<SynchronizedLyricsArray | string | null>(null);

  const songRef = useRef<string | null>(null);

  useEffect(() => {
    lyrics?.getLyrics((_event: any, songName: string, lyricSource: string, lyric: string) => {
      if (songName === songRef.current) {
        setSource(lyricSource);
        setOverride(lyric);
      }
    });

    return () => {
      ipc?.removeAllListeners('lyric-get');
    };
  }, []);

  useEffect(() => {
    if (currentSong && !currentSong.lyrics) {
      lyrics?.fetchLyrics(currentSong);
    }

    songRef.current = currentSong?.name ?? null;

    setOverride(null);
    setSource(null);
  }, [currentSong]);

  useEffect(() => {
    let lyrics: string | null = null;

    if (currentSong?.lyrics) {
      lyrics = currentSong.lyrics;

      setSource(currentServer?.name ?? 'music server');
    } else if (override) {
      lyrics = override;
    }

    if (lyrics) {
      const synchronizedLines = lyrics.matchAll(timeExp);

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
        setSongLyrics(lyrics);
      } else {
        setSongLyrics(synchronizedTimes);
      }
    } else {
      setSongLyrics(null);
    }
  }, [currentServer?.name, currentSong, override]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {songLyrics &&
        (Array.isArray(songLyrics) ? (
          <SynchronizedLyrics lyrics={songLyrics} />
        ) : (
          <UnsynchronizedLyrics lyrics={songLyrics} />
        ))}
      {source && (
        <LyricLine
          key="provided-by"
          className="credit"
          text={`Provided by: ${source}`}
        />
      )}
    </ErrorBoundary>
  );
};
