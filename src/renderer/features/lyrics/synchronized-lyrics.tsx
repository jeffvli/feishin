import clsx from 'clsx';
import isElectron from 'is-electron';
import { useCallback, useEffect, useRef } from 'react';

import styles from './synchronized-lyrics.module.css';

import { LyricLine } from '/@/renderer/features/lyrics/lyric-line';
import {
    useLyricsSettings,
    usePlaybackType,
    usePlayerActions,
    usePlayerStatus,
} from '/@/renderer/store';
import { usePlayerTimestamp } from '/@/renderer/store/timestamp.store';
import { FullLyricsMetadata, SynchronizedLyricsArray } from '/@/shared/types/domain-types';
import { PlayerStatus, PlayerType } from '/@/shared/types/types';

const mpvPlayer = isElectron() ? window.api.mpvPlayer : null;
const utils = isElectron() ? window.api.utils : null;
const mpris = isElectron() && utils?.isLinux() ? window.api.mpris : null;

export interface SynchronizedLyricsProps extends Omit<FullLyricsMetadata, 'lyrics'> {
    lyrics: SynchronizedLyricsArray;
    offsetMs?: number;
    style?: React.CSSProperties;
    translatedLyrics?: null | string;
}

export const SynchronizedLyrics = ({
    artist,
    lyrics,
    name,
    offsetMs,
    remote,
    source,
    style,
    translatedLyrics,
}: SynchronizedLyricsProps) => {
    const playbackType = usePlaybackType();
    const settings = useLyricsSettings();
    const { mediaSeekToTimestamp } = usePlayerActions();
    const status = usePlayerStatus();
    const timestamp = usePlayerTimestamp();

    const effectiveOffsetMs = offsetMs ?? 0;

    const handleSeek = useCallback(
        (time: number) => {
            if (playbackType === PlayerType.LOCAL && mpvPlayer) {
                mpvPlayer.seekTo(time);
            } else {
                mpris?.updateSeek(time);
                mediaSeekToTimestamp(time);
            }
        },
        [mediaSeekToTimestamp, playbackType],
    );

    // const seeked = useSeeked();

    // A reference to the timeout handler
    const lyricTimer = useRef<null | ReturnType<typeof setTimeout>>(null);

    // A reference to the lyrics. This is necessary for the
    // timers, which are not part of react necessarily, to always
    // have the most updated values
    const lyricRef = useRef<null | SynchronizedLyricsArray>(null);

    // A constantly increasing value, used to tell timers that may be out of date
    // whether to proceed or stop
    const timerEpoch = useRef(0);

    const delayMsRef = useRef(effectiveOffsetMs);
    const followRef = useRef(settings.follow);
    const userScrollingRef = useRef(false);
    const scrollTimeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    const programmaticScrollRef = useRef(false);

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

    const setCurrentLyricRef = useRef<
        (timeInMs: number, epoch?: number, targetIndex?: number) => void
    >(() => {});

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

            if (followRef.current && !userScrollingRef.current) {
                programmaticScrollRef.current = true;
                doc?.scroll({ behavior: 'smooth', top: offsetTop });
                setTimeout(() => {
                    programmaticScrollRef.current = false;
                }, 600);
            }

            if (index !== lyricRef.current!.length - 1) {
                const nextTime = lyricRef.current![index + 1][0];

                const elapsed = performance.now() - start;

                lyricTimer.current = setTimeout(
                    () => {
                        setCurrentLyricRef.current(nextTime, nextEpoch, index + 1);
                    },
                    nextTime - timeInMs - elapsed,
                );
            }
        },
        [],
    );

    // Store the callback in a ref so it can be called recursively
    useEffect(() => {
        setCurrentLyricRef.current = setCurrentLyric;
    }, [setCurrentLyric]);

    useEffect(() => {
        // Copy the follow settings into a ref that can be accessed in the timeout
        followRef.current = settings.follow;
    }, [settings.follow]);

    useEffect(() => {
        // This handler is used to handle when lyrics change. It is in some sense the
        // 'primary' handler for parsing lyrics, as unlike the other callbacks, it will
        // ALSO remove listeners on close.
        lyricRef.current = lyrics;

        if (status === PlayerStatus.PLAYING) {
            // Use the current timestamp from player events
            setCurrentLyric(timestamp * 1000 + delayMsRef.current);

            return () => {
                // Cleanup: clear the timer when lyrics change or component unmounts
                if (lyricTimer.current) clearTimeout(lyricTimer.current);
            };
        }

        return () => {};
    }, [lyrics, setCurrentLyric, status, timestamp]);

    useEffect(() => {
        // This handler is used to deal with changes to the current delay. If the offset
        // changes, we should immediately stop the current listening set and calculate
        // the correct one using the new offset. Afterwards, timing can be calculated like normal
        const newOffset = offsetMs ?? 0;
        const changed = delayMsRef.current !== newOffset;

        if (!changed) {
            return;
        }

        if (lyricTimer.current) {
            clearTimeout(lyricTimer.current);
        }

        delayMsRef.current = newOffset;

        // Use the current timestamp from player events
        setCurrentLyric(timestamp * 1000 + delayMsRef.current);
    }, [setCurrentLyric, offsetMs, timestamp]);

    useEffect(() => {
        // This handler is used specifically for dealing with seeking and progress updates.
        // When the timestamp changes, update the current lyric position.
        if (status !== PlayerStatus.PLAYING) {
            if (lyricTimer.current) {
                clearTimeout(lyricTimer.current);
            }

            return;
        }

        if (lyricTimer.current) {
            clearTimeout(lyricTimer.current);
        }

        setCurrentLyric(timestamp * 1000 + delayMsRef.current);
    }, [timestamp, setCurrentLyric, status]);

    useEffect(() => {
        // Guaranteed cleanup; stop the timer, and just in case also increment
        // the epoch to instruct any dangling timers to stop
        if (lyricTimer.current) {
            clearTimeout(lyricTimer.current);
        }

        timerEpoch.current += 1;
    }, []);

    // Handle manual scrolling - pause auto-scroll when user scrolls
    useEffect(() => {
        const container =
            containerRef.current ||
            (document.getElementById('sychronized-lyrics-scroll-container') as HTMLElement);
        if (!container) return;

        const handleScroll = () => {
            // Ignore programmatic scrolls (auto-scroll)
            if (programmaticScrollRef.current) {
                return;
            }

            userScrollingRef.current = true;

            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }

            // Re-enable auto-scroll after 3 seconds of no scrolling
            scrollTimeoutRef.current = setTimeout(() => {
                userScrollingRef.current = false;
            }, 3000);
        };

        container.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            container.removeEventListener('scroll', handleScroll);
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
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
            ref={containerRef}
            style={{ gap: `${settings.gap}px`, ...style }}
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
                <LyricLine
                    alignment={settings.alignment}
                    className="lyric-line synchronized"
                    fontSize={settings.fontSize}
                    id={`lyric-${idx}`}
                    key={idx}
                    onClick={() => {
                        if (time > 0 && Number.isFinite(time)) {
                            handleSeek(time / 1000);
                        }
                    }}
                    text={
                        text +
                        (translatedLyrics ? `_BREAK_${translatedLyrics.split('\n')[idx]}` : '')
                    }
                />
            ))}
        </div>
    );
};
