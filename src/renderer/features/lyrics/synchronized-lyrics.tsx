import { useCallback, useEffect, useRef } from 'react';
import {
  useCurrentStatus,
  useCurrentTime,
  useLyricsSettings,
  usePlayerType,
  useSeeked,
} from '/@/renderer/store';
import { PlaybackType, PlayerStatus } from '/@/renderer/types';
import { LyricLine } from '/@/renderer/features/lyrics/lyric-line';
import isElectron from 'is-electron';
import { PlayersRef } from '/@/renderer/features/player/ref/players-ref';
import { SynchronizedLyricsArray } from '/@/renderer/api/types';

const mpvPlayer = isElectron() ? window.electron.mpvPlayer : null;

interface SynchronizedLyricsProps {
  lyrics: SynchronizedLyricsArray;
}

export const SynchronizedLyrics = ({ lyrics }: SynchronizedLyricsProps) => {
  const playersRef = PlayersRef;
  const status = useCurrentStatus();
  const playerType = usePlayerType();
  const now = useCurrentTime();
  const settings = useLyricsSettings();

  const seeked = useSeeked();

  // A reference to the timeout handler
  const lyricTimer = useRef<ReturnType<typeof setTimeout>>();

  // A reference to the lyrics. This is necessary for the
  // timers, which are not part of react necessarily, to always
  // have the most updated values
  const lyricRef = useRef<SynchronizedLyricsArray>();

  // A constantly increasing value, used to tell timers that may be out of date
  // whether to proceed or stop
  const timerEpoch = useRef(0);

  const delayMsRef = useRef(settings.delayMs);
  const followRef = useRef(settings.follow);

  useEffect(() => {
    delayMsRef.current = settings.delayMs;
  }, [settings.delayMs]);

  useEffect(() => {
    // Copy the follow settings into a ref that can be accessed in the timeout
    followRef.current = settings.follow;
  }, [settings.follow]);

  const getCurrentTime = useCallback(async () => {
    if (isElectron() && playerType !== PlaybackType.WEB) {
      if (mpvPlayer) {
        return mpvPlayer.getCurrentTime();
      }
      return 0;
    }

    if (playersRef.current === undefined) {
      return 0;
    }

    const player = (playersRef.current.player1 ?? playersRef.current.player2).getInternalPlayer();

    // If it is null, this probably means we added a new song while the lyrics tab is open
    // and the queue was previously empty
    if (!player) return 0;

    return player.currentTime;
  }, [playerType, playersRef]);

  const getCurrentLyric = (timeInMs: number) => {
    if (lyricRef.current) {
      const activeLyrics = lyricRef.current;
      for (let idx = 0; idx < activeLyrics.length; idx += 1) {
        if (timeInMs <= activeLyrics[idx][0]) {
          return idx === 0 ? idx : idx - 1;
        }
      }

      return activeLyrics.length - 1;
    }

    return -1;
  };

  const setCurrentLyric = useCallback((timeInMs: number, epoch?: number, targetIndex?: number) => {
    const start = performance.now();
    let nextEpoch: number;

    if (epoch === undefined) {
      timerEpoch.current = (timerEpoch.current + 1) % 10000;
      nextEpoch = timerEpoch.current;
    } else if (epoch !== timerEpoch.current) {
      return;
    } else {
      nextEpoch = epoch;
    }

    let index: number;

    if (targetIndex === undefined) {
      index = getCurrentLyric(timeInMs);
    } else {
      index = targetIndex;
    }

    // Directly modify the dom instead of using react to prevent rerender
    document
      .querySelectorAll('.synchronized-lyrics .active')
      .forEach((node) => node.classList.remove('active'));

    if (index === -1) {
      lyricRef.current = undefined;
      return;
    }

    const currentLyric = document.querySelector(`#lyric-${index}`);
    if (currentLyric === null) {
      lyricRef.current = undefined;
      return;
    }

    currentLyric.classList.add('active');

    if (followRef.current) {
      currentLyric.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    if (index !== lyricRef.current!.length - 1) {
      const nextTime = lyricRef.current![index + 1][0];

      const elapsed = performance.now() - start;

      lyricTimer.current = setTimeout(() => {
        setCurrentLyric(nextTime, nextEpoch, index + 1);
      }, nextTime - timeInMs - elapsed);
    }
  }, []);

  useEffect(() => {
    lyricRef.current = lyrics;

    if (status === PlayerStatus.PLAYING) {
      let rejected = false;

      getCurrentTime()
        .then((timeInSec: number) => {
          if (rejected) {
            return false;
          }

          setCurrentLyric(timeInSec * 1000 + delayMsRef.current);

          return true;
        })
        .catch(console.error);

      return () => {
        // Case 1: cleanup happens before we hear back from
        // the main process. In this case, when the promise resolves, ignore the result
        rejected = true;

        // Case 2: Cleanup happens after we hear back from main process but
        // (potentially) before the next lyric. In this case, clear the timer
        if (lyricTimer.current) clearTimeout(lyricTimer.current);
      };
    }

    return () => {};
  }, [getCurrentTime, lyrics, playerType, setCurrentLyric, status]);

  useEffect(() => {
    if (status !== PlayerStatus.PLAYING) {
      if (lyricTimer.current) {
        clearTimeout(lyricTimer.current);
      }

      return;
    }
    if (!seeked) {
      return;
    }

    if (lyricTimer.current) {
      clearTimeout(lyricTimer.current);
    }

    setCurrentLyric(now * 1000 + delayMsRef.current);
  }, [now, seeked, setCurrentLyric, status]);

  useEffect(() => {
    // Guaranteed cleanup; stop the timer, and just in case also increment
    // the epoch to instruct any dangling timers to stop
    if (lyricTimer.current) {
      clearTimeout(lyricTimer.current);
    }

    timerEpoch.current += 1;
  }, []);

  return (
    <div className="synchronized-lyrics">
      {lyrics.map(([, text], idx) => (
        <LyricLine
          key={idx}
          id={`lyric-${idx}`}
          text={text}
        />
      ))}
    </div>
  );
};
