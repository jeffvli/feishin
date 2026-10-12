import isElectron from 'is-electron';
import { useCallback, useEffect, useRef, useState } from 'react';

import { MpvPlayerEngine, MpvPlayerEngineHandle } from './engine/mpv-player-engine';

import { eventEmitter } from '/@/renderer/events/event-emitter';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import {
    captureCrossfadeTransitionSettings,
    getCrossfadeEasing,
} from '/@/renderer/features/player/audio-player/utils/crossfade-transition';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import {
    usePlaybackSettings,
    usePlayerActions,
    usePlayerData,
    usePlayerMuted,
    usePlayerProperties,
    usePlayerStore,
    usePlayerVolume,
} from '/@/renderer/store';
import { PlayerStatus } from '/@/shared/types/types';

const PLAY_PAUSE_FADE_DURATION = 300;
const PLAY_PAUSE_FADE_INTERVAL = 10;

const mpvPlayer = isElectron() ? window.api.mpvPlayer : null;

export function MpvPlayer() {
    const playerRef = useRef<MpvPlayerEngineHandle>(null);
    const { currentSong, status } = usePlayerData();
    const { finishFadeToNext, mediaAutoNext, mediaNext, setTimestamp } = usePlayerActions();
    const { crossfadeDuration, crossfadeStyle, speed } = usePlayerProperties();
    const isMuted = usePlayerMuted();
    const volume = usePlayerVolume();
    const { audioFadeOnStatusChange, preservePitch } = usePlaybackSettings();

    const [localPlayerStatus, setLocalPlayerStatus] = useState<PlayerStatus>(status);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const manualCrossfadeActiveRef = useRef(false);
    const manualCrossfadeAdvancingRef = useRef(false);

    const fadeAndSetStatus = useCallback(
        async (startVolume: number, endVolume: number, duration: number, status: PlayerStatus) => {
            // Cancel any in-progress fade
            if (fadeIntervalRef.current) {
                clearInterval(fadeIntervalRef.current);
                fadeIntervalRef.current = null;
            }

            // Set initial volume immediately to ensure we start from the correct position
            // This is especially important when cancelling a previous fade
            playerRef.current?.setVolume(startVolume);

            const steps = duration / PLAY_PAUSE_FADE_INTERVAL;
            const volumeStep = (endVolume - startVolume) / steps;
            let currentStep = 0;

            const promise = new Promise<void>((resolve) => {
                fadeIntervalRef.current = setInterval(() => {
                    currentStep++;
                    const newVolume = startVolume + volumeStep * currentStep;

                    playerRef.current?.setVolume(newVolume);

                    if (currentStep >= steps) {
                        if (fadeIntervalRef.current) {
                            clearInterval(fadeIntervalRef.current);
                            fadeIntervalRef.current = null;
                        }
                        // Ensure final volume is exactly the target
                        playerRef.current?.setVolume(endVolume);
                        resolve();
                    }
                }, PLAY_PAUSE_FADE_INTERVAL);
            });

            if (status === PlayerStatus.PLAYING) {
                setLocalPlayerStatus(status);
                await promise;
            } else {
                await promise;
                setLocalPlayerStatus(status);
            }
        },
        [],
    );

    const onProgress = useCallback(() => {
        // Progress callback is now only used for transition logic
        // Timestamp updates are handled separately in useEffect
    }, []);

    const handleOnEnded = useCallback(() => {
        // When mpv auto-advances to the next song (position 1 becomes position 0),
        // we need to update the player store first, then update the mpv queue with the new next song
        // This follows the same pattern as the old useCenterControls implementation
        const playerData = mediaAutoNext();

        // Update the mpv queue with the new next song
        // The engine will handle the queue update through the useEffect when nextSong changes
        playerRef.current?.setVolume(volume);
        setIsTransitioning(false);

        return playerData;
    }, [mediaAutoNext, volume, setIsTransitioning]);

    const cancelManualCrossfade = useCallback(() => {
        if (!manualCrossfadeActiveRef.current) {
            return;
        }

        manualCrossfadeActiveRef.current = false;
        manualCrossfadeAdvancingRef.current = false;
        playerRef.current?.setVolume(volume);
        setIsTransitioning(false);
        finishFadeToNext();
    }, [finishFadeToNext, volume]);

    const animateManualVolume = useCallback(
        async (getVolume: (progress: number) => number, durationMs: number) => {
            const startedAt = performance.now();

            while (manualCrossfadeActiveRef.current) {
                const now = await new Promise<number>((resolve) => requestAnimationFrame(resolve));
                if (!manualCrossfadeActiveRef.current) {
                    return false;
                }

                const progress = Math.min(1, (now - startedAt) / durationMs);
                playerRef.current?.setVolume(getVolume(progress));
                if (progress >= 1) {
                    return true;
                }
            }

            return false;
        },
        [],
    );

    const startManualCrossfade = useCallback(async () => {
        if (manualCrossfadeActiveRef.current) {
            return;
        }

        const playerData = usePlayerStore.getState().getPlayerData();
        if (playerData.status !== PlayerStatus.PLAYING || !playerData.nextSong) {
            finishFadeToNext();
            return;
        }

        manualCrossfadeActiveRef.current = true;
        setIsTransitioning(true);
        const transitionSettings = captureCrossfadeTransitionSettings(
            crossfadeDuration,
            crossfadeStyle,
        );
        const { easeIn, easeOut } = getCrossfadeEasing(transitionSettings.style);
        const phaseDurationMs = Math.max(50, (transitionSettings.duration * 1000) / 2);

        const fadedOut = await animateManualVolume(
            (progress) => (1 - easeOut(progress)) * volume,
            phaseDurationMs,
        );
        if (!fadedOut || !manualCrossfadeActiveRef.current) {
            return;
        }

        manualCrossfadeAdvancingRef.current = true;
        mediaNext(false);
        manualCrossfadeAdvancingRef.current = false;
        playerRef.current?.setVolume(0);

        const fadedIn = await animateManualVolume(
            (progress) => easeIn(progress) * volume,
            phaseDurationMs,
        );
        if (!fadedIn || !manualCrossfadeActiveRef.current) {
            return;
        }

        manualCrossfadeActiveRef.current = false;
        playerRef.current?.setVolume(volume);
        setIsTransitioning(false);
        finishFadeToNext();
    }, [
        animateManualVolume,
        crossfadeDuration,
        crossfadeStyle,
        finishFadeToNext,
        mediaNext,
        volume,
    ]);

    useEffect(() => {
        const handleFadeToNext = () => {
            void startManualCrossfade();
        };

        eventEmitter.on('MEDIA_FADE_NEXT', handleFadeToNext);
        return () => {
            eventEmitter.off('MEDIA_FADE_NEXT', handleFadeToNext);
        };
    }, [startManualCrossfade]);

    const player = usePlayer();

    usePlayerEvents(
        {
            onCurrentSongChange: () => {
                if (!manualCrossfadeAdvancingRef.current) {
                    cancelManualCrossfade();
                }
            },
            onPlayerSeekToTimestamp: (properties) => {
                cancelManualCrossfade();
                const timestamp = properties.timestamp;
                playerRef.current?.seekTo(timestamp);
            },
            onPlayerStatus: async (properties) => {
                const status = properties.status;
                if (status !== PlayerStatus.PLAYING) {
                    cancelManualCrossfade();
                }
                const volume = usePlayerStore.getState().player.volume;
                if (audioFadeOnStatusChange) {
                    if (status === PlayerStatus.PLAYING) {
                        fadeAndSetStatus(0, volume, PLAY_PAUSE_FADE_DURATION, PlayerStatus.PLAYING);
                    } else {
                        fadeAndSetStatus(volume, 0, PLAY_PAUSE_FADE_DURATION, status);
                    }
                } else {
                    if (status === PlayerStatus.PLAYING) {
                        playerRef.current?.setVolume(volume);
                        setLocalPlayerStatus(PlayerStatus.PLAYING);
                    } else {
                        playerRef.current?.setVolume(0);
                        setLocalPlayerStatus(status);
                    }
                }
            },
            onPlayerVolume: (properties) => {
                const volume = properties.volume;
                playerRef.current?.setVolume(volume);
            },
            onQueueCleared: () => {
                player.mediaStop();
            },
        },
        [volume, fadeAndSetStatus, audioFadeOnStatusChange, cancelManualCrossfade],
    );

    // Cleanup fade interval on unmount
    useEffect(() => {
        return () => {
            if (fadeIntervalRef.current) {
                clearInterval(fadeIntervalRef.current);
                fadeIntervalRef.current = null;
            }
            manualCrossfadeActiveRef.current = false;
            finishFadeToNext();
        };
    }, [finishFadeToNext]);

    const hasCurrentSong = !!currentSong?.id;

    useEffect(() => {
        if (status !== PlayerStatus.PLAYING || !hasCurrentSong) {
            return;
        }

        const interval = setInterval(async () => {
            if (!mpvPlayer) {
                return;
            }

            try {
                const time = await mpvPlayer.getCurrentTime();
                if (time !== undefined) {
                    setTimestamp(time);
                }
            } catch {
                // Do nothing
            }
        }, 500);

        return () => clearInterval(interval);
    }, [hasCurrentSong, status, setTimestamp]);

    useEffect(() => {
        if (status !== PlayerStatus.PLAYING || localPlayerStatus === PlayerStatus.PLAYING) {
            return;
        }
        if (fadeIntervalRef.current) {
            clearInterval(fadeIntervalRef.current);
            fadeIntervalRef.current = null;
        }
        setLocalPlayerStatus(PlayerStatus.PLAYING);
        playerRef.current?.setVolume(volume);
    }, [status, localPlayerStatus, volume]);

    return (
        <MpvPlayerEngine
            isMuted={isMuted}
            isTransitioning={isTransitioning}
            onEnded={handleOnEnded}
            onProgress={onProgress}
            playerRef={playerRef}
            playerStatus={localPlayerStatus}
            preservePitch={preservePitch}
            speed={speed}
            volume={volume}
        />
    );
}
