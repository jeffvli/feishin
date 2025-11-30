import type { Dispatch } from 'react';
import type ReactPlayer from 'react-player';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
    WebPlayerEngine,
    WebPlayerEngineHandle,
} from '/@/renderer/features/player/audio-player/engine/web-player-engine';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { useSongUrl } from '/@/renderer/features/player/audio-player/hooks/use-stream-url';
import { PlayerOnProgressProps } from '/@/renderer/features/player/audio-player/types';
import { useWebAudio } from '/@/renderer/features/player/hooks/use-webaudio';
import {
    useMpvSettings,
    usePlaybackSettings,
    usePlayerActions,
    usePlayerData,
    usePlayerMuted,
    usePlayerProperties,
    usePlayerVolume,
} from '/@/renderer/store';
import { QueueSong } from '/@/shared/types/domain-types';
import { CrossfadeStyle, PlayerStatus, PlayerStyle } from '/@/shared/types/types';

const PLAY_PAUSE_FADE_DURATION = 300;
const PLAY_PAUSE_FADE_INTERVAL = 10;

export function WebPlayer() {
    const playerRef = useRef<null | WebPlayerEngineHandle>(null);
    const { num, player1, player2, status } = usePlayerData();
    const { mediaAutoNext, setTimestamp } = usePlayerActions();
    const playback = useMpvSettings();
    const { webAudio } = useWebAudio();

    const { crossfadeDuration, crossfadeStyle, speed, transitionType } = usePlayerProperties();
    const isMuted = usePlayerMuted();
    const volume = usePlayerVolume();
    const { transcode } = usePlaybackSettings();

    const [localPlayerStatus, setLocalPlayerStatus] = useState<PlayerStatus>(status);
    const [isTransitioning, setIsTransitioning] = useState<boolean | string>(false);

    const [player1Source, setPlayer1Source] = useState<MediaElementAudioSourceNode | null>(null);
    const [player2Source, setPlayer2Source] = useState<MediaElementAudioSourceNode | null>(null);

    const fadeAndSetStatus = useCallback(
        async (startVolume: number, endVolume: number, duration: number, status: PlayerStatus) => {
            if (isTransitioning) {
                return setLocalPlayerStatus(status);
            }

            const steps = duration / PLAY_PAUSE_FADE_INTERVAL;
            const volumeStep = (endVolume - startVolume) / steps;
            let currentStep = 0;

            const promise = new Promise((resolve) => {
                const interval = setInterval(() => {
                    currentStep++;
                    const newVolume = startVolume + volumeStep * currentStep;

                    playerRef.current?.setVolume(newVolume);

                    if (currentStep >= steps) {
                        clearInterval(interval);
                        setIsTransitioning(false);
                        resolve(true);
                    }
                }, PLAY_PAUSE_FADE_INTERVAL);
            });

            if (status === PlayerStatus.PAUSED) {
                await promise;
                setLocalPlayerStatus(status);
            } else if (status === PlayerStatus.PLAYING) {
                setLocalPlayerStatus(status);
                await promise;
            }
        },
        [isTransitioning],
    );

    const onProgressPlayer1 = useCallback(
        (e: PlayerOnProgressProps) => {
            if (!playerRef.current?.player1()) {
                return;
            }

            switch (transitionType) {
                case PlayerStyle.CROSSFADE:
                    crossfadeHandler({
                        crossfadeDuration: crossfadeDuration,
                        crossfadeStyle,
                        currentPlayer: playerRef.current.player1(),
                        currentPlayerNum: num,
                        currentTime: e.playedSeconds,
                        duration: getDuration(playerRef.current.player1().ref),
                        isTransitioning,
                        nextPlayer: playerRef.current.player2(),
                        playerNum: 1,
                        setIsTransitioning,
                        volume,
                    });
                    break;
                case PlayerStyle.GAPLESS:
                    gaplessHandler({
                        currentTime: e.playedSeconds,
                        duration: getDuration(playerRef.current.player1().ref),
                        isFlac: false,
                        isTransitioning,
                        nextPlayer: playerRef.current.player2(),
                        setIsTransitioning,
                    });
                    break;
            }
        },
        [crossfadeDuration, crossfadeStyle, isTransitioning, num, transitionType, volume],
    );

    const onProgressPlayer2 = useCallback(
        (e: PlayerOnProgressProps) => {
            if (!playerRef.current?.player2()) {
                return;
            }

            switch (transitionType) {
                case PlayerStyle.CROSSFADE:
                    crossfadeHandler({
                        crossfadeDuration: crossfadeDuration,
                        crossfadeStyle,
                        currentPlayer: playerRef.current.player2(),
                        currentPlayerNum: num,
                        currentTime: e.playedSeconds,
                        duration: getDuration(playerRef.current.player2().ref),
                        isTransitioning,
                        nextPlayer: playerRef.current.player1(),
                        playerNum: 2,
                        setIsTransitioning,
                        volume,
                    });
                    break;
                case PlayerStyle.GAPLESS:
                    gaplessHandler({
                        currentTime: e.playedSeconds,
                        duration: getDuration(playerRef.current.player2().ref),
                        isFlac: false,
                        isTransitioning,
                        nextPlayer: playerRef.current.player1(),
                        setIsTransitioning,
                    });
                    break;
            }
        },
        [crossfadeDuration, crossfadeStyle, isTransitioning, num, transitionType, volume],
    );

    const handleOnEndedPlayer1 = useCallback(() => {
        const promise = new Promise((resolve) => {
            mediaAutoNext();
            resolve(true);
        });

        promise.then(() => {
            playerRef.current?.player1()?.ref?.getInternalPlayer().pause();
            playerRef.current?.setVolume(volume);
            setIsTransitioning(false);
        });
    }, [mediaAutoNext, volume]);

    const handleOnEndedPlayer2 = useCallback(() => {
        const promise = new Promise((resolve) => {
            mediaAutoNext();
            resolve(true);
        });

        promise.then(() => {
            playerRef.current?.player2()?.ref?.getInternalPlayer().pause();
            playerRef.current?.setVolume(volume);
            setIsTransitioning(false);
        });
    }, [mediaAutoNext, volume]);

    usePlayerEvents(
        {
            onPlayerSeekToTimestamp: (properties) => {
                const timestamp = properties.timestamp;

                // Reset transition state if seeking during a crossfade transition
                if (isTransitioning && transitionType === PlayerStyle.CROSSFADE) {
                    setIsTransitioning(false);

                    if (num === 1) {
                        playerRef.current?.player1()?.setVolume(volume);
                        playerRef.current?.player2()?.setVolume(0);
                        playerRef.current?.player2()?.ref?.getInternalPlayer()?.pause();
                    } else {
                        playerRef.current?.player2()?.setVolume(volume);
                        playerRef.current?.player1()?.setVolume(0);
                        playerRef.current?.player1()?.ref?.getInternalPlayer()?.pause();
                    }
                }

                if (num === 1) {
                    playerRef.current?.player1()?.ref?.seekTo(timestamp);
                } else {
                    playerRef.current?.player2()?.ref?.seekTo(timestamp);
                }
            },
            onPlayerStatus: async (properties) => {
                const status = properties.status;

                // Reset crossfade transition if paused during a crossfade transition
                if (
                    status === PlayerStatus.PAUSED &&
                    isTransitioning &&
                    transitionType === PlayerStyle.CROSSFADE
                ) {
                    setIsTransitioning(false);

                    if (num === 1) {
                        playerRef.current?.player1()?.setVolume(volume);
                        playerRef.current?.player2()?.setVolume(0);
                        playerRef.current?.player2()?.ref?.getInternalPlayer()?.pause();
                    } else {
                        playerRef.current?.player2()?.setVolume(volume);
                        playerRef.current?.player1()?.setVolume(0);
                        playerRef.current?.player1()?.ref?.getInternalPlayer()?.pause();
                    }
                }

                if (status === PlayerStatus.PAUSED) {
                    fadeAndSetStatus(volume, 0, PLAY_PAUSE_FADE_DURATION, PlayerStatus.PAUSED);
                } else if (status === PlayerStatus.PLAYING) {
                    fadeAndSetStatus(0, volume, PLAY_PAUSE_FADE_DURATION, PlayerStatus.PLAYING);
                }
            },
            onPlayerVolume: (properties) => {
                const volume = properties.volume;
                playerRef.current?.setVolume(volume);
            },
        },
        [volume, num, isTransitioning, transitionType],
    );

    useEffect(() => {
        if (localPlayerStatus !== PlayerStatus.PLAYING) {
            return;
        }

        const interval = setInterval(() => {
            const activePlayer =
                num === 1 ? playerRef.current?.player1() : playerRef.current?.player2();
            const internalPlayer =
                activePlayer?.ref?.getInternalPlayer() as HTMLAudioElement | null;

            if (!internalPlayer) {
                return;
            }

            const currentTime = internalPlayer.currentTime;

            if (
                transitionType === PlayerStyle.CROSSFADE ||
                transitionType === PlayerStyle.GAPLESS
            ) {
                setTimestamp(Number(currentTime.toFixed(0)));
            }
        }, 500);

        return () => clearInterval(interval);
    }, [localPlayerStatus, num, setTimestamp, transitionType]);

    const calculateReplayGain = useCallback(
        (song: QueueSong): number => {
            if (playback.replayGainMode === 'no') {
                return 1;
            }

            let gain: number | undefined;
            let peak: number | undefined;

            if (playback.replayGainMode === 'track') {
                gain = song.gain?.track ?? song.gain?.album;
                peak = song.peak?.track ?? song.peak?.album;
            } else {
                gain = song.gain?.album ?? song.gain?.track;
                peak = song.peak?.album ?? song.peak?.track;
            }

            if (gain === undefined) {
                gain = playback.replayGainFallbackDB;

                if (!gain) {
                    return 1;
                }
            }

            if (peak === undefined) {
                peak = 1;
            }

            const preAmp = playback.replayGainPreampDB ?? 0;

            // https://wiki.hydrogenaud.io/index.php?title=ReplayGain_1.0_specification&section=19
            // Normalized to max gain
            let expectedGain = 10 ** ((gain + preAmp) / 20);

            // Nothing in the system should allow this. But, in the case that preAmp is a
            // bad value (not a number, for example), a NaN gain will cause the entire system to panic
            if (isNaN(expectedGain)) {
                expectedGain = 1;
            }

            if (playback.replayGainClip) {
                return Math.min(expectedGain, 1 / peak);
            }
            return expectedGain;
        },
        [
            playback.replayGainClip,
            playback.replayGainFallbackDB,
            playback.replayGainMode,
            playback.replayGainPreampDB,
        ],
    );

    useEffect(() => {
        if (!webAudio) return;

        if (player1 && player1Source && num === 1) {
            const newGain = calculateReplayGain(player1);

            // This error SHOULD never happen, as calculateReplayGain is expected to
            // always return a real value. However, to prevent app crash, check this just in case
            try {
                webAudio.gains[0].gain.setValueAtTime(Math.max(0, newGain), 0);
            } catch (error) {
                console.error('Error setting gain', error);
            }
        }
    }, [calculateReplayGain, num, player1, player1Source, volume, webAudio]);

    useEffect(() => {
        if (!webAudio) return;

        if (player2 && player2Source && num === 2) {
            const newGain = calculateReplayGain(player2);
            try {
                webAudio.gains[1].gain.setValueAtTime(Math.max(0, newGain), 0);
            } catch (error) {
                console.error('Error setting gain', error);
            }
        }
    }, [calculateReplayGain, num, player1, player2Source, player2, volume, webAudio]);

    const player1Url = useSongUrl(player1, num === 1, transcode);
    const player2Url = useSongUrl(player2, num === 2, transcode);

    const handlePlayer1Start = useCallback(
        async (player: ReactPlayer) => {
            if (!webAudio || player1Source) return;
            if (player1Url) {
                // This should fire once, only if the source is real (meaning we
                // saw the dummy source) and the context is not ready
                if (webAudio.context.state !== 'running') {
                    await webAudio.context.resume();
                }
            }

            const internal = player.getInternalPlayer() as HTMLMediaElement | undefined;
            if (internal) {
                const { context, gains } = webAudio;
                const source = context.createMediaElementSource(internal);
                source.connect(gains[0]);
                setPlayer1Source(source);
            }
        },
        [player1Source, player1Url, webAudio],
    );

    const handlePlayer2Start = useCallback(
        async (player: ReactPlayer) => {
            if (!webAudio || player2Source) return;
            if (player2Url) {
                if (webAudio.context.state !== 'running') {
                    await webAudio.context.resume();
                }
            }

            const internal = player.getInternalPlayer() as HTMLMediaElement | undefined;
            if (internal) {
                const { context, gains } = webAudio;
                const source = context.createMediaElementSource(internal);
                source.connect(gains[1]);
                setPlayer2Source(source);
            }
        },
        [player2Source, player2Url, webAudio],
    );

    return (
        <WebPlayerEngine
            isMuted={isMuted}
            isTransitioning={Boolean(isTransitioning)}
            onEndedPlayer1={handleOnEndedPlayer1}
            onEndedPlayer2={handleOnEndedPlayer2}
            onProgressPlayer1={onProgressPlayer1}
            onProgressPlayer2={onProgressPlayer2}
            onStartedPlayer1={handlePlayer1Start}
            onStartedPlayer2={handlePlayer2Start}
            playerNum={num}
            playerRef={playerRef}
            playerStatus={localPlayerStatus}
            speed={speed}
            src1={player1Url}
            src2={player2Url}
            volume={volume}
        />
    );
}

function crossfadeHandler(args: {
    crossfadeDuration: number;
    crossfadeStyle: CrossfadeStyle;
    currentPlayer: {
        ref: null | ReactPlayer;
        setVolume: (volume: number) => void;
    };
    currentPlayerNum: number;
    currentTime: number;
    duration: number;
    isTransitioning: boolean | string;
    nextPlayer: {
        ref: null | ReactPlayer;
        setVolume: (volume: number) => void;
    };
    playerNum: number;
    setIsTransitioning: Dispatch<boolean | string>;
    volume: number;
}) {
    const {
        crossfadeDuration,
        crossfadeStyle,
        currentPlayer,
        currentPlayerNum,
        currentTime,
        duration,
        isTransitioning,
        nextPlayer,
        playerNum,
        setIsTransitioning,
        volume,
    } = args;
    const player = `player${playerNum}`;

    if (!isTransitioning) {
        if (currentTime > duration - crossfadeDuration) {
            nextPlayer.setVolume(0);
            nextPlayer.ref?.getInternalPlayer().play();
            return setIsTransitioning(player);
        }

        return;
    }

    if (isTransitioning !== player && currentPlayerNum !== playerNum) {
        return;
    }

    const timeLeft = duration - currentTime;

    const progress = (crossfadeDuration - timeLeft) / crossfadeDuration;

    const { easeIn, easeOut } = getCrossfadeEasing(crossfadeStyle);

    const easedProgressOut = easeOut(progress);
    const easedProgressIn = easeIn(progress);

    const currentPlayerVolume = (1 - easedProgressOut) * volume;
    const nextPlayerVolume = easedProgressIn * volume;

    // Set volumes for both players
    currentPlayer.setVolume(currentPlayerVolume);
    nextPlayer.setVolume(nextPlayerVolume);
}

/**
 * Equal power easing - maintains constant power during crossfade
 * Fade in: sin(π/2 * t)
 * Fade out: 1 - cos(π/2 * t) so that (1 - result) = cos(π/2 * t)
 */
function equalPowerEaseIn(t: number): number {
    const clampedT = Math.max(0, Math.min(1, t));
    return Math.sin((Math.PI / 2) * clampedT);
}

function equalPowerEaseOut(t: number): number {
    const clampedT = Math.max(0, Math.min(1, t));
    return 1 - Math.cos((Math.PI / 2) * clampedT);
}

/**
 * Exponential easing - natural exponential decay/rise
 * Fade in: 1 - exp(-k * t) where k controls the curve steepness
 * Fade out: exp(-k * t) normalized to go from 1 to 0
 */
function exponentialEaseIn(t: number): number {
    const clampedT = Math.max(0, Math.min(1, t));
    const k = 5;
    return 1 - Math.exp(-k * clampedT);
}

function exponentialEaseOut(t: number): number {
    const clampedT = Math.max(0, Math.min(1, t));
    const k = 5;
    // Exponential decay: exp(-k * t) goes from 1 (at t=0) to exp(-k) (at t=1)
    // Normalize to go from 1 to 0
    const startValue = Math.exp(0); // = 1
    const endValue = Math.exp(-k);
    return (Math.exp(-k * clampedT) - endValue) / (startValue - endValue);
}

function gaplessHandler(args: {
    currentTime: number;
    duration: number;
    isFlac: boolean;
    isTransitioning: boolean | string;
    nextPlayer: {
        ref: null | ReactPlayer;
        setVolume: (volume: number) => void;
    };
    setIsTransitioning: Dispatch<boolean | string>;
}) {
    const { currentTime, duration, isFlac, isTransitioning, nextPlayer, setIsTransitioning } = args;

    if (!isTransitioning) {
        if (currentTime > duration - 2) {
            return setIsTransitioning(true);
        }

        return null;
    }

    const durationPadding = getDurationPadding(isFlac);

    if (currentTime + durationPadding >= duration) {
        return nextPlayer.ref
            ?.getInternalPlayer()
            ?.play()
            .catch(() => {});
    }

    return null;
}

function getCrossfadeEasing(style: CrossfadeStyle): {
    easeIn: (t: number) => number;
    easeOut: (t: number) => number;
} {
    switch (style) {
        case CrossfadeStyle.EQUAL_POWER:
            return {
                easeIn: equalPowerEaseIn,
                easeOut: equalPowerEaseOut,
            };
        case CrossfadeStyle.EXPONENTIAL:
            return {
                easeIn: exponentialEaseIn,
                easeOut: exponentialEaseOut,
            };
        case CrossfadeStyle.LINEAR:
            return {
                easeIn: linearEase,
                easeOut: linearEase,
            };
        case CrossfadeStyle.S_CURVE:
            return {
                easeIn: sCurveEase,
                easeOut: sCurveEase,
            };
        // Default to equal power for other styles
        default:
            return {
                easeIn: equalPowerEaseIn,
                easeOut: equalPowerEaseOut,
            };
    }
}

function getDuration(ref: null | ReactPlayer | undefined) {
    return ref?.getInternalPlayer()?.duration || 0;
}

function getDurationPadding(isFlac: boolean) {
    switch (isFlac) {
        case false:
            return 0.116;
        case true:
            return 0.065;
    }
}

/**
 * Linear easing - simple linear interpolation
 */
function linearEase(t: number): number {
    return Math.max(0, Math.min(1, t));
}

/**
 * S-Curve easing (smoothstep) - smooth S-shaped curve
 * Uses smoothstep function: t²(3 - 2t)
 */
function sCurveEase(t: number): number {
    const clampedT = Math.max(0, Math.min(1, t));
    return clampedT * clampedT * (3 - 2 * clampedT);
}
