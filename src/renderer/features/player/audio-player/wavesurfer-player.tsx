import type { Dispatch } from 'react';
import type WaveSurfer from 'wavesurfer.js';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
    WaveSurferPlayerEngine,
    WaveSurferPlayerEngineHandle,
} from '/@/renderer/features/player/audio-player/engine/wavesurfer-player-engine';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { useSongUrl } from '/@/renderer/features/player/audio-player/hooks/use-stream-url';
import { PlayerOnProgressProps } from '/@/renderer/features/player/audio-player/types';
import {
    usePlaybackSettings,
    usePlayerActions,
    usePlayerData,
    usePlayerMuted,
    usePlayerProperties,
    usePlayerVolume,
} from '/@/renderer/store';
import { PlayerStatus, PlayerStyle } from '/@/shared/types/types';

const PLAY_PAUSE_FADE_DURATION = 300;
const PLAY_PAUSE_FADE_INTERVAL = 10;

export function WaveSurferPlayer() {
    const playerRef = useRef<null | WaveSurferPlayerEngineHandle>(null);
    const { num, player1, player2, status } = usePlayerData();
    const { mediaAutoNext, setTimestamp } = usePlayerActions();
    const { crossfadeDuration, speed, transitionType } = usePlayerProperties();
    const isMuted = usePlayerMuted();
    const volume = usePlayerVolume();
    const { transcode } = usePlaybackSettings();

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
                        hasNextSong: Boolean(player2),
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
        [crossfadeDuration, isTransitioning, num, player2, transitionType, volume],
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
                        hasNextSong: Boolean(player1),
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
        [crossfadeDuration, isTransitioning, num, player1, transitionType, volume],
    );

    const handleOnEndedPlayer1 = useCallback(() => {
        const promise = new Promise((resolve) => {
            mediaAutoNext();
            resolve(true);
        });

        promise.then(() => {
            playerRef.current?.player1()?.ref?.pause();
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
            playerRef.current?.player2()?.ref?.pause();
            playerRef.current?.setVolume(volume);
            setIsTransitioning(false);
        });
    }, [mediaAutoNext, volume]);

    usePlayerEvents(
        {
            onPlayerSeekToTimestamp: (properties) => {
                const timestamp = properties.timestamp;
                const activePlayer =
                    num === 1 ? playerRef.current?.player1() : playerRef.current?.player2();
                const wavesurfer = activePlayer?.ref;

                if (wavesurfer) {
                    const duration = wavesurfer.getDuration();
                    if (duration > 0) {
                        // Convert timestamp to ratio (0-1) for wavesurfer
                        const ratio = timestamp / duration;
                        wavesurfer.seekTo(ratio);
                    }
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
            const wavesurfer = activePlayer?.ref;

            if (!wavesurfer) {
                return;
            }

            const currentTime = wavesurfer.getCurrentTime();

            if (
                transitionType === PlayerStyle.CROSSFADE ||
                transitionType === PlayerStyle.GAPLESS
            ) {
                setTimestamp(Number(currentTime.toFixed(0)));
            }
        }, 500);

        return () => clearInterval(interval);
    }, [localPlayerStatus, num, setTimestamp, transitionType]);

    const player1Url = useSongUrl(player1, num === 1, transcode);
    const player2Url = useSongUrl(player2, num === 2, transcode);

    return (
        <WaveSurferPlayerEngine
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
            src1={player1Url}
            src2={player2Url}
            volume={volume}
        />
    );
}

function crossfadeHandler(args: {
    crossfadeDuration: number;
    currentPlayer: {
        ref: null | WaveSurfer;
        setVolume: (volume: number) => void;
    };
    currentPlayerNum: number;
    currentTime: number;
    duration: number;
    hasNextSong: boolean;
    isTransitioning: boolean | string;
    nextPlayer: {
        ref: null | WaveSurfer;
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
        hasNextSong,
        isTransitioning,
        nextPlayer,
        playerNum,
        setIsTransitioning,
        volume,
    } = args;
    const player = `player${playerNum}`;

    // If there is no next song queued, don't begin or continue a transition
    if (!hasNextSong) {
        currentPlayer.setVolume(volume);
        nextPlayer.setVolume(0);
        nextPlayer.ref?.pause();

        if (isTransitioning) {
            setIsTransitioning(false);
        }
        return;
    }

    if (!isTransitioning) {
        if (duration > 0 && currentTime > duration - crossfadeDuration) {
            nextPlayer.setVolume(0);
            nextPlayer.ref?.play();
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
        ref: null | WaveSurfer;
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
        return nextPlayer.ref?.play().catch(() => {});
    }

    return null;
}

function getDuration(ref: null | undefined | WaveSurfer) {
    return ref?.getDuration() || 0;
}

function getDurationPadding(isFlac: boolean) {
    switch (isFlac) {
        case false:
            return 0.116;
        case true:
            return 0.065;
    }
}
