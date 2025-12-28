import isElectron from 'is-electron';
import { useCallback, useEffect, useRef, useState } from 'react';

import { MpvPlayerEngine, MpvPlayerEngineHandle } from './engine/mpv-player-engine';

import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
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
    const { status } = usePlayerData();
    const { mediaAutoNext, setTimestamp } = usePlayerActions();
    const { speed } = usePlayerProperties();
    const isMuted = usePlayerMuted();
    const volume = usePlayerVolume();
    const { audioFadeOnStatusChange } = usePlaybackSettings();

    const [localPlayerStatus, setLocalPlayerStatus] = useState<PlayerStatus>(status);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

            if (status === PlayerStatus.PAUSED) {
                await promise;
                setLocalPlayerStatus(status);
            } else if (status === PlayerStatus.PLAYING) {
                setLocalPlayerStatus(status);
                await promise;
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

    const player = usePlayer();

    usePlayerEvents(
        {
            onPlayerSeekToTimestamp: (properties) => {
                const timestamp = properties.timestamp;
                playerRef.current?.seekTo(timestamp);
            },
            onPlayerStatus: async (properties) => {
                const status = properties.status;
                const volume = usePlayerStore.getState().player.volume;
                if (audioFadeOnStatusChange) {
                    if (status === PlayerStatus.PAUSED) {
                        fadeAndSetStatus(volume, 0, PLAY_PAUSE_FADE_DURATION, PlayerStatus.PAUSED);
                    } else if (status === PlayerStatus.PLAYING) {
                        fadeAndSetStatus(0, volume, PLAY_PAUSE_FADE_DURATION, PlayerStatus.PLAYING);
                    }
                } else {
                    if (status === PlayerStatus.PAUSED) {
                        playerRef.current?.setVolume(0);
                        setLocalPlayerStatus(PlayerStatus.PAUSED);
                    } else if (status === PlayerStatus.PLAYING) {
                        playerRef.current?.setVolume(volume);
                        setLocalPlayerStatus(PlayerStatus.PLAYING);
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
        [volume, fadeAndSetStatus, audioFadeOnStatusChange],
    );

    // Cleanup fade interval on unmount
    useEffect(() => {
        return () => {
            if (fadeIntervalRef.current) {
                clearInterval(fadeIntervalRef.current);
                fadeIntervalRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (localPlayerStatus !== PlayerStatus.PLAYING) {
            return;
        }

        const interval = setInterval(async () => {
            if (!mpvPlayer) {
                return;
            }

            try {
                const time = await mpvPlayer.getCurrentTime();
                if (time !== undefined) {
                    setTimestamp(Number(time.toFixed(0)));
                }
            } catch {
                // Do nothing
            }
        }, 500);

        return () => clearInterval(interval);
    }, [localPlayerStatus, setTimestamp]);

    return (
        <MpvPlayerEngine
            isMuted={isMuted}
            isTransitioning={isTransitioning}
            onEnded={handleOnEnded}
            onProgress={onProgress}
            playerRef={playerRef}
            playerStatus={localPlayerStatus}
            speed={speed}
            volume={volume}
        />
    );
}
