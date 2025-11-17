import type { Dispatch } from 'react';
import type ReactPlayer from 'react-player';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
    WebPlayerEngine,
    WebPlayerEngineHandle,
} from '/@/renderer/features/player/audio-player/engine/web-player-engine';
import { useMainPlayerListener } from '/@/renderer/features/player/audio-player/hooks/use-main-player-listener';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { PlayerOnProgressProps } from '/@/renderer/features/player/audio-player/types';
import {
    usePlayerActions,
    usePlayerData,
    usePlayerMuted,
    usePlayerProperties,
    usePlayerVolume,
} from '/@/renderer/store';
import { PlayerStatus, PlayerStyle } from '/@/shared/types/types';

const PLAY_PAUSE_FADE_DURATION = 300;
const PLAY_PAUSE_FADE_INTERVAL = 10;

export function WebPlayer() {
    const playerRef = useRef<null | WebPlayerEngineHandle>(null);
    const { num, player1, player2, status } = usePlayerData();
    const { mediaAutoNext, setTimestamp } = usePlayerActions();
    const { crossfadeDuration, speed, transitionType } = usePlayerProperties();
    const isMuted = usePlayerMuted();
    const volume = usePlayerVolume();

    const [localPlayerStatus, setLocalPlayerStatus] = useState<PlayerStatus>(status);
    const [isTransitioning, setIsTransitioning] = useState<boolean | string>(false);

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
        [crossfadeDuration, isTransitioning, num, transitionType, volume],
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
        [crossfadeDuration, isTransitioning, num, transitionType, volume],
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
                if (num === 1) {
                    playerRef.current?.player1()?.ref?.seekTo(timestamp);
                } else {
                    playerRef.current?.player2()?.ref?.seekTo(timestamp);
                }
            },
            onPlayerStatus: async (properties) => {
                const status = properties.status;
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
        [volume, num, isTransitioning],
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

    useMainPlayerListener();

    return (
        <WebPlayerEngine
            isMuted={isMuted}
            isTransitioning={Boolean(isTransitioning)}
            onEndedPlayer1={handleOnEndedPlayer1}
            onEndedPlayer2={handleOnEndedPlayer2}
            onProgressPlayer1={onProgressPlayer1}
            onProgressPlayer2={onProgressPlayer2}
            playerNum={num}
            playerRef={playerRef}
            playerStatus={localPlayerStatus}
            speed={speed}
            src1={player1?.streamUrl}
            src2={player2?.streamUrl}
            volume={volume}
        />
    );
}

function crossfadeHandler(args: {
    crossfadeDuration: number;
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

    // Calculate the volume levels based on time remaining
    const currentPlayerVolume = (timeLeft / crossfadeDuration) * volume;
    const nextPlayerVolume = ((crossfadeDuration - timeLeft) / crossfadeDuration) * volume;

    // Set volumes for both players
    currentPlayer.setVolume(currentPlayerVolume);
    nextPlayer.setVolume(nextPlayerVolume);
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
