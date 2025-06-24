import clsx from 'clsx';
import isElectron from 'is-electron';
import { useCallback, useEffect, useRef } from 'react';

import styles from './synchronized-lyrics.module.css';
import './synchronized-lyrics.css';

import { LyricLine } from '/@/renderer/features/lyrics/lyric-line';
import { useScrobble } from '/@/renderer/features/player/hooks/use-scrobble';
import { PlayersRef } from '/@/renderer/features/player/ref/players-ref';
import {
    useCurrentPlayer,
    useCurrentStatus,
    useCurrentTime,
    useLyricsSettings,
    usePlaybackType,
    usePlayerData,
    useSeeked,
    useSetCurrentTime,
} from '/@/renderer/store';
import { FullLyricsMetadata, SynchronizedLyricsArray } from '/@/shared/types/domain-types';
import { PlaybackType, PlayerStatus } from '/@/shared/types/types';

const mpvPlayer = isElectron() ? window.api.mpvPlayer : null;
const utils = isElectron() ? window.api.utils : null;
const mpris = isElectron() && utils?.isLinux() ? window.api.mpris : null;

export interface SynchronizedLyricsProps extends Omit<FullLyricsMetadata, 'lyrics'> {
    lyrics: SynchronizedLyricsArray;
    translatedLyrics?: null | string;
}

export const SynchronizedLyrics = ({
    artist,
    lyrics,
    name,
    remote,
    source,
    translatedLyrics,
}: SynchronizedLyricsProps) => {
    const playersRef = PlayersRef;
    const status = useCurrentStatus();
    const playbackType = usePlaybackType();
    const playerData = usePlayerData();
    const now = useCurrentTime();
    const settings = useLyricsSettings();
    const currentPlayer = useCurrentPlayer();
    const currentPlayerRef =
        currentPlayer === 1 ? playersRef.current?.player1 : playersRef.current?.player2;
    const setCurrentTime = useSetCurrentTime();
    const { handleScrobbleFromSeek } = useScrobble();

    const handleSeek = useCallback(
        (time: number) => {
            if (playbackType === PlaybackType.LOCAL && mpvPlayer) {
                mpvPlayer.seekTo(time);
                setCurrentTime(time, true);
            } else {
                setCurrentTime(time, true);
                handleScrobbleFromSeek(time);
                mpris?.updateSeek(time);
                currentPlayerRef?.seekTo(time);
            }
        },
        [currentPlayerRef, handleScrobbleFromSeek, playbackType, setCurrentTime],
    );

    const seeked = useSeeked();

    // A reference to the timeout handler
    const lyricTimer = useRef<null | ReturnType<typeof setTimeout>>(null);

    // A reference to the lyrics. This is necessary for the
    // timers, which are not part of react necessarily, to always
    // have the most updated values
    const lyricRef = useRef<null | SynchronizedLyricsArray>(null);

    // A constantly increasing value, used to tell timers that may be out of date
    // whether to proceed or stop
    const timerEpoch = useRef(0);

    const delayMsRef = useRef(settings.delayMs);
    const followRef = useRef(settings.follow);

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

    const getCurrentTime = useCallback(async () => {
        if (isElectron() && playbackType !== PlaybackType.WEB) {
            if (mpvPlayer) {
                return mpvPlayer.getCurrentTime();
            }
            return 0;
        }

        if (playersRef.current === undefined) {
            return 0;
        }

        const player =
            playerData.current.player === 1
                ? playersRef.current.player1
                : playersRef.current.player2;
        const underlying = player?.getInternalPlayer();

        // If it is null, this probably means we added a new song while the lyrics tab is open
        // and the queue was previously empty
        if (!underlying) return 0;

        return underlying.currentTime;
    }, [playbackType, playersRef, playerData]);

    const setCurrentLyric = useCallback(
        (timeInMs: number, epoch?: number, targetIndex?: number) => {
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
                lyricRef.current = null;
                return;
            }

            const doc = document.getElementById(
                'sychronized-lyrics-scroll-container',
            ) as HTMLElement;
            const currentLyric = document.querySelector(`#lyric-${index}`) as HTMLElement;

            const offsetTop = currentLyric?.offsetTop - doc?.clientHeight / 2 || 0;

            if (currentLyric === null) {
                lyricRef.current = null;
                return;
            }

            currentLyric.classList.add('active');

            if (followRef.current) {
                doc?.scroll({ behavior: 'smooth', top: offsetTop });
            }

            if (index !== lyricRef.current!.length - 1) {
                const nextTime = lyricRef.current![index + 1][0];

                const elapsed = performance.now() - start;

                lyricTimer.current = setTimeout(
                    () => {
                        setCurrentLyric(nextTime, nextEpoch, index + 1);
                    },
                    nextTime - timeInMs - elapsed,
                );
            }
        },
        [],
    );

    useEffect(() => {
        // Copy the follow settings into a ref that can be accessed in the timeout
        followRef.current = settings.follow;
    }, [settings.follow]);

    useEffect(() => {
        // This handler is used to handle when lyrics change. It is in some sense the
        // 'primary' handler for parsing lyrics, as unlike the other callbacks, it will
        // ALSO remove listeners on close. Use the promisified getCurrentTime(), because
        // we don't want to be dependent on npw, which may not be precise
        lyricRef.current = lyrics;

        if (status === PlayerStatus.PLAYING) {
            let rejected = false;

            getCurrentTime()
                .then((timeInSec: number) => {
                    if (rejected) {
                        return false;
                    }

                    setCurrentLyric(timeInSec * 1000 - delayMsRef.current);

                    return true;
                })
                .catch(console.error);

            return () => {
                // Case 1: cleanup happens before we hear back from
                // the main process. In this case, when the promise resolves, ignore the result
                rejected = true;

                // Case 2: Cleanup happens after we hear back from main process but
                // (potentially) before the next lyric. In this case, clear the timer.
                // Do NOT do this for other cleanup functions, as it should only be done
                // when switching to a new song (or an empty one)
                if (lyricTimer.current) clearTimeout(lyricTimer.current);
            };
        }

        return () => {};
    }, [getCurrentTime, lyrics, playbackType, setCurrentLyric, status]);

    useEffect(() => {
        // This handler is used to deal with changes to the current delay. If the offset
        // changes, we should immediately stop the current listening set and calculate
        // the correct one using the new offset. Afterwards, timing can be calculated like normal
        const changed = delayMsRef.current !== settings.delayMs;

        if (!changed) {
            return () => {};
        }

        if (lyricTimer.current) {
            clearTimeout(lyricTimer.current);
        }

        let rejected = false;

        delayMsRef.current = settings.delayMs;

        getCurrentTime()
            .then((timeInSec: number) => {
                if (rejected) {
                    return false;
                }

                setCurrentLyric(timeInSec * 1000 - delayMsRef.current);

                return true;
            })
            .catch(console.error);

        return () => {
            // In the event this ends earlier, just kill the promise. Cleanup of
            // timeouts is otherwise handled by another handler
            rejected = true;
        };
    }, [getCurrentTime, setCurrentLyric, settings.delayMs]);

    useEffect(() => {
        // This handler is used specifically for dealing with seeking. In this case,
        // we assume that now is the accurate time
        if (status !== PlayerStatus.PLAYING) {
            if (lyricTimer.current) {
                clearTimeout(lyricTimer.current);
            }

            return;
        }

        // If the time goes back to 0 and we are still playing, this suggests that
        // we may be playing the same track (repeat one). In this case, we also
        // need to restart playback
        const restarted = status === PlayerStatus.PLAYING && now === 0;
        if (!seeked && !restarted) {
            return;
        }

        if (lyricTimer.current) {
            clearTimeout(lyricTimer.current);
        }

        setCurrentLyric(now * 1000 - delayMsRef.current);
    }, [now, seeked, setCurrentLyric, status]);

    useEffect(() => {
        // Guaranteed cleanup; stop the timer, and just in case also increment
        // the epoch to instruct any dangling timers to stop
        if (lyricTimer.current) {
            clearTimeout(lyricTimer.current);
        }

        timerEpoch.current += 1;
    }, []);

    const hideScrollbar = () => {
        const doc = document.getElementById('sychronized-lyrics-scroll-container') as HTMLElement;
        doc.classList.add('hide-scrollbar');
    };

    const showScrollbar = () => {
        const doc = document.getElementById('sychronized-lyrics-scroll-container') as HTMLElement;
        doc.classList.remove('hide-scrollbar');
    };

    return (
        <div
            className={clsx(styles.container, 'synchronized-lyrics overlay-scrollbar')}
            id="sychronized-lyrics-scroll-container"
            onMouseEnter={showScrollbar}
            onMouseLeave={hideScrollbar}
            style={{ gap: `${settings.gap}px` }}
        >
            {settings.showProvider && source && (
                <LyricLine
                    alignment={settings.alignment}
                    className="lyric-credit"
                    fontSize={settings.fontSize}
                    text={`Provided by ${source}`}
                />
            )}
            {settings.showMatch && remote && (
                <LyricLine
                    alignment={settings.alignment}
                    className="lyric-credit"
                    fontSize={settings.fontSize}
                    text={`"${name} by ${artist}"`}
                />
            )}
            {lyrics.map(([time, text], idx) => (
                <div key={idx}>
                    <LyricLine
                        alignment={settings.alignment}
                        className="lyric-line synchronized"
                        fontSize={settings.fontSize}
                        id={`lyric-${idx}`}
                        onClick={() => handleSeek(time / 1000)}
                        text={text}
                    />
                    {translatedLyrics && (
                        <LyricLine
                            alignment={settings.alignment}
                            className="lyric-line synchronized translation"
                            fontSize={settings.fontSize * 0.8}
                            onClick={() => handleSeek(time / 1000)}
                            text={translatedLyrics.split('\n')[idx]}
                        />
                    )}
                </div>
            ))}
        </div>
    );
};
