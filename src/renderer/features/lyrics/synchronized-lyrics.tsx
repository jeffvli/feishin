import { useCallback, useEffect, useRef, useState } from 'react';
import { useCurrentStatus, useCurrentTime } from '/@/renderer/store';
import { PlayerStatus } from '/@/renderer/types';
import { LyricLine } from '/@/renderer/features/lyrics/lyric-line';

export type SynchronizedLyricsArray = Array<[number, string]>;

interface SynchronizedLyricsProps {
  lyrics: SynchronizedLyricsArray;
}

const CLOSE_ENOUGH_TIME_DIFF_SEC = 0.2;

export const SynchronizedLyrics = ({ lyrics }: SynchronizedLyricsProps) => {
  const [index, setIndex] = useState(-1);
  const status = useCurrentStatus();
  const lastTimeUpdate = useRef<number>(Infinity);
  const previousTimestamp = useRef<number>(0);
  const now = useCurrentTime();

  const timeout = useRef<ReturnType<typeof setTimeout>>();

  const estimateElapsedTime = useCallback(() => {
    const now = new Date().getTime();
    return (now - previousTimestamp.current) / 1000;
  }, []);

  const getCurrentLyric = useCallback(
    (timeInMs: number) => {
      for (let idx = 0; idx < lyrics.length; idx += 1) {
        if (timeInMs <= lyrics[idx][0]) {
          return idx === 0 ? idx : idx - 1;
        }
      }
      return lyrics.length - 1;
    },
    [lyrics],
  );

  const doSetNextTimeout = useCallback(
    (idx: number, currentTimeMs: number) => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }

      document
        .querySelector(`#lyric-${idx}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setIndex(idx);

      if (idx !== lyrics.length - 1) {
        const nextTimeMs = lyrics[idx + 1][0];
        const nextTime = nextTimeMs - currentTimeMs;

        timeout.current = setTimeout(() => {
          doSetNextTimeout(idx + 1, nextTimeMs);
        }, nextTime);
      } else {
        timeout.current = undefined;
      }
    },
    [lyrics],
  );

  const handleTimeChange = useCallback(() => {
    const elapsedJs = estimateElapsedTime();
    const elapsedPlayer = now - lastTimeUpdate.current;

    lastTimeUpdate.current = now;
    previousTimestamp.current = new Date().getTime();

    if (Math.abs(elapsedJs - elapsedPlayer) >= CLOSE_ENOUGH_TIME_DIFF_SEC) {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }

      const currentTimeMs = now * 1000;
      const idx = getCurrentLyric(currentTimeMs);
      doSetNextTimeout(idx, currentTimeMs);
    }
  }, [doSetNextTimeout, estimateElapsedTime, getCurrentLyric, now]);

  useEffect(() => {
    if (status !== PlayerStatus.PLAYING) {
      if (timeout.current) {
        clearTimeout(timeout.current);
        timeout.current = undefined;
      }

      return () => {};
    }

    const changeTimeout = setTimeout(() => {
      handleTimeChange();
    }, 100);

    return () => clearTimeout(changeTimeout);
  }, [handleTimeChange, status]);

  return (
    <div>
      {lyrics.map(([, text], idx) => (
        <LyricLine
          key={idx}
          active={idx === index}
          id={`lyric-${idx}`}
          lyric={text}
        />
      ))}
    </div>
  );
};
