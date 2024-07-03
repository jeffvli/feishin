import { useCallback, useEffect, useRef } from 'react';
import {
    useCurrentStatus,
    useCurrentTime,
    useLyricsSettings,
    usePlaybackType,
    useSeeked,
} from '/@/renderer/store';
import { PlaybackType, PlayerStatus } from '/@/renderer/types';
import { LyricLine } from '/@/renderer/features/lyrics/lyric-line';
import isElectron from 'is-electron';
import { PlayersRef } from '/@/renderer/features/player/ref/players-ref';
import { FullLyricsMetadata, SynchronizedLyricsArray } from '/@/renderer/api/types';
import styled from 'styled-components';
import { useCenterControls } from '/@/renderer/features/player/hooks/use-center-controls';

const mpvPlayer = isElectron() ? window.electron.mpvPlayer : null;

const SynchronizedLyricsContainer = styled.div<{ $gap: number }>`
    display: flex;
    flex-direction: column;
    gap: ${(props) => props.$gap || 5}px;
    width: 100%;
    height: 100%;
    padding: 10vh 0 50vh;
    overflow: scroll;
    transform: translateY(-2rem);

    -webkit-mask-image: linear-gradient(
        180deg,
        transparent 5%,
        rgb(0 0 0 / 100%) 20%,
        rgb(0 0 0 / 100%) 85%,
        transparent 95%
    );

    mask-image: linear-gradient(
        180deg,
        transparent 5%,
        rgb(0 0 0 / 100%) 20%,
        rgb(0 0 0 / 100%) 85%,
        transparent 95%
    );

    @media screen and (orientation: portrait) {
        padding: 5vh 0;
    }
`;

export interface SynchronizedLyricsProps extends Omit<FullLyricsMetadata, 'lyrics'> {
    lyrics: SynchronizedLyricsArray;
}

export const SynchronizedLyrics = ({
    artist,
    lyrics,
    name,
    remote,
    source,
}: SynchronizedLyricsProps) => {
    const playersRef = PlayersRef;
    const status = useCurrentStatus();
    const playbackType = usePlaybackType();
    const now = useCurrentTime();
    const settings = useLyricsSettings();
    const centerControls = useCenterControls({ playersRef });

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

        const player = (
            playersRef.current.player1 ?? playersRef.current.player2
        ).getInternalPlayer();

        // If it is null, this probably means we added a new song while the lyrics tab is open
        // and the queue was previously empty
        if (!player) return 0;

        return player.currentTime;
    }, [playbackType, playersRef]);

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
                lyricRef.current = undefined;
                return;
            }

            const doc = document.getElementById(
                'sychronized-lyrics-scroll-container',
            ) as HTMLElement;
            const currentLyric = document.querySelector(`#lyric-${index}`) as HTMLElement;
            // eslint-disable-next-line no-unsafe-optional-chaining
            const offsetTop = currentLyric?.offsetTop - doc?.clientHeight / 2 ?? 0;

            if (currentLyric === null) {
                lyricRef.current = undefined;
                return;
            }

            currentLyric.classList.add('active');

            if (followRef.current) {
                doc?.scroll({ behavior: 'smooth', top: offsetTop });
            }

            if (index !== lyricRef.current!.length - 1) {
                const nextTime = lyricRef.current![index + 1][0];

                const elapsed = performance.now() - start;

                lyricTimer.current = setTimeout(() => {
                    setCurrentLyric(nextTime, nextEpoch, index + 1);
                }, nextTime - timeInMs - elapsed);
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
        <SynchronizedLyricsContainer
            $gap={settings.gap}
            className="synchronized-lyrics overlay-scrollbar"
            id="sychronized-lyrics-scroll-container"
            onMouseEnter={showScrollbar}
            onMouseLeave={hideScrollbar}
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
                    key={idx}
                    alignment={settings.alignment}
                    className="lyric-line synchronized"
                    fontSize={settings.fontSize}
                    id={`lyric-${idx}`}
                    text={text}
                    onClick={() => centerControls.handleSeekSlider(time / 1000)}
                />
            ))}
        </SynchronizedLyricsContainer>
    );
};
