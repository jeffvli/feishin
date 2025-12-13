import type { RefObject } from 'react';

import isElectron from 'is-electron';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';

import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { getSongUrl } from '/@/renderer/features/player/audio-player/hooks/use-stream-url';
import { AudioPlayer, PlayerOnProgressProps } from '/@/renderer/features/player/audio-player/types';
import { getMpvProperties } from '/@/renderer/features/settings/components/playback/mpv-settings';
import {
    usePlaybackSettings,
    usePlayerActions,
    usePlayerStore,
    useSettingsStore,
} from '/@/renderer/store';
import { PlayerStatus } from '/@/shared/types/types';

export interface MpvPlayerEngineHandle extends AudioPlayer {}

interface MpvPlayerEngineProps {
    isMuted: boolean;
    isTransitioning: boolean;
    onEnded: () => void;
    onProgress: (e: PlayerOnProgressProps) => void;
    playerRef: RefObject<MpvPlayerEngineHandle | null>;
    playerStatus: PlayerStatus;
    speed?: number;
    volume: number;
}

const mpvPlayer = isElectron() ? window.api.mpvPlayer : null;
const mpvPlayerListener = isElectron() ? window.api.mpvPlayerListener : null;
const ipc = isElectron() ? window.api.ipc : null;

const PROGRESS_UPDATE_INTERVAL = 250;

export const MpvPlayerEngine = (props: MpvPlayerEngineProps) => {
    const {
        isMuted,
        isTransitioning,
        onEnded,
        onProgress,
        playerRef,
        playerStatus,
        speed,
        volume,
    } = props;

    const [internalVolume, setInternalVolume] = useState(volume / 100 || 0);
    const [duration] = useState(0);

    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isInitializedRef = useRef<boolean>(false);
    const hasPopulatedQueueRef = useRef<boolean>(false);
    const isMountedRef = useRef<boolean>(true);

    const { transcode } = usePlaybackSettings();
    const mpvExtraParameters = useSettingsStore((store) => store.playback.mpvExtraParameters);
    const mpvProperties = useSettingsStore((store) => store.playback.mpvProperties);

    // Start the mpv instance on startup
    useEffect(() => {
        isMountedRef.current = true;

        const initializeMpv = async () => {
            // Always quit mpv first to ensure clean state, especially during HMR remounts
            const isRunning: boolean | undefined = await mpvPlayer?.isRunning();
            if (isRunning) {
                mpvPlayer?.quit();

                let attempts = 0;
                const maxAttempts = 20;
                while (attempts < maxAttempts) {
                    await new Promise((resolve) => setTimeout(resolve, 100));
                    const stillRunning = await mpvPlayer?.isRunning();
                    if (!stillRunning) {
                        break;
                    }
                    attempts++;
                }
            }

            // Reset initialization state
            isInitializedRef.current = false;
            hasPopulatedQueueRef.current = false;

            // Initialize mpv with fresh state
            const properties: Record<string, any> = {
                ...getMpvProperties(mpvProperties),
                speed: speed,
            };

            await mpvPlayer?.initialize({
                extraParameters: mpvExtraParameters,
                properties,
            });

            // Set volume from the current app volume
            mpvPlayer?.volume(volume);
            isInitializedRef.current = true;

            // After initialization, populate the queue if currentSrc is available
            const playerData = usePlayerStore.getState().getPlayerData();
            const currentSongUrl = playerData.currentSong
                ? getSongUrl(playerData.currentSong, transcode)
                : undefined;
            const nextSongUrl = playerData.nextSong
                ? getSongUrl(playerData.nextSong, transcode)
                : undefined;

            if (currentSongUrl && nextSongUrl && !hasPopulatedQueueRef.current && mpvPlayer) {
                mpvPlayer.setQueue(currentSongUrl, nextSongUrl, true);
                hasPopulatedQueueRef.current = true;
            }
        };

        initializeMpv();

        return () => {
            isMountedRef.current = false;
            // Quit mpv on unmount
            mpvPlayer?.quit();
            isInitializedRef.current = false;
            hasPopulatedQueueRef.current = false;
        };
        // Note: volume, speed, and transcode are intentionally not in dependencies.
        // Volume and speed changes are handled by separate useEffects below to avoid
        // reinitializing the entire player. Transcode changes are handled by queue
        // update callbacks in usePlayerEvents.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mpvExtraParameters, mpvProperties]);

    // Update volume
    useEffect(() => {
        if (!mpvPlayer) {
            return;
        }

        const vol = volume / 100 || 0;
        queueMicrotask(() => {
            setInternalVolume(vol);
        });
        mpvPlayer.volume(volume);
    }, [volume]);

    // Update mute status
    useEffect(() => {
        if (!mpvPlayer) {
            return;
        }

        mpvPlayer.mute(isMuted);
    }, [isMuted]);

    // Update speed/playback rate
    useEffect(() => {
        if (!mpvPlayer) {
            return;
        }

        if (!speed) {
            return;
        }

        mpvPlayer.setProperties({ speed });
    }, [speed]);

    // Handle play/pause status
    useEffect(() => {
        if (!mpvPlayer) {
            return;
        }

        if (playerStatus === PlayerStatus.PLAYING) {
            mpvPlayer.play();
        } else if (playerStatus === PlayerStatus.PAUSED) {
            mpvPlayer.pause();
        }
    }, [playerStatus]);

    // Set up progress tracking
    useEffect(() => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }

        const updateProgress = async () => {
            if (!mpvPlayer || !isMountedRef.current) {
                return;
            }

            try {
                const time = await mpvPlayer.getCurrentTime();
                if (time !== undefined && isMountedRef.current) {
                    onProgress({
                        played: time / (duration || time + 10),
                        playedSeconds: time,
                    });
                }
            } catch {
                // Handle error silently
            }
        };

        const interval = PROGRESS_UPDATE_INTERVAL;
        progressIntervalRef.current = setInterval(updateProgress, interval);
        updateProgress();

        return () => {
            isMountedRef.current = false;
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
        };
    }, [isTransitioning, duration, onProgress]);

    const { mediaAutoNext } = usePlayerActions();

    useEffect(() => {
        if (!mpvPlayerListener) {
            return;
        }

        const handleOnAutoNext = () => {
            mediaAutoNext();
            const playerData = usePlayerStore.getState().getPlayerData();
            const nextSongUrl = playerData.nextSong
                ? getSongUrl(playerData.nextSong, transcode)
                : undefined;
            mpvPlayer?.setQueueNext(nextSongUrl);
        };

        mpvPlayerListener.rendererAutoNext(handleOnAutoNext);

        return () => {
            ipc?.removeAllListeners('renderer-player-auto-next');
        };
    }, [mediaAutoNext, onEnded, transcode]);

    usePlayerEvents(
        {
            onMediaNext: () => {
                const playerData = usePlayerStore.getState().getPlayerData();
                const currentSongUrl = playerData.currentSong
                    ? getSongUrl(playerData.currentSong, transcode)
                    : undefined;
                const nextSongUrl = playerData.nextSong
                    ? getSongUrl(playerData.nextSong, transcode)
                    : undefined;
                mpvPlayer?.setQueue(currentSongUrl, nextSongUrl, false);
            },
            onMediaPrev: () => {
                const playerData = usePlayerStore.getState().getPlayerData();
                const currentSongUrl = playerData.currentSong
                    ? getSongUrl(playerData.currentSong, transcode)
                    : undefined;
                const nextSongUrl = playerData.nextSong
                    ? getSongUrl(playerData.nextSong, transcode)
                    : undefined;
                mpvPlayer?.setQueue(currentSongUrl, nextSongUrl, false);
            },
            onPlayerPlay: () => {
                const playerData = usePlayerStore.getState().getPlayerData();
                const currentSongUrl = playerData.currentSong
                    ? getSongUrl(playerData.currentSong, transcode)
                    : undefined;
                const nextSongUrl = playerData.nextSong
                    ? getSongUrl(playerData.nextSong, transcode)
                    : undefined;
                mpvPlayer?.setQueue(currentSongUrl, nextSongUrl, false);
            },
        },
        [mpvPlayer, transcode],
    );

    useImperativeHandle<MpvPlayerEngineHandle, MpvPlayerEngineHandle>(playerRef, () => ({
        decreaseVolume(by: number) {
            const newVol = Math.max(0, internalVolume - by / 100);
            setInternalVolume(newVol);
            if (mpvPlayer) {
                mpvPlayer.volume(newVol * 100);
            }
        },
        increaseVolume(by: number) {
            const newVol = Math.min(1, internalVolume + by / 100);
            setInternalVolume(newVol);
            if (mpvPlayer) {
                mpvPlayer.volume(newVol * 100);
            }
        },
        pause() {
            if (mpvPlayer) {
                mpvPlayer.pause();
            }
        },
        play() {
            if (mpvPlayer) {
                mpvPlayer.play();
            }
        },
        seekTo(seekTo: number) {
            if (mpvPlayer) {
                mpvPlayer.seekTo(seekTo);
            }
        },
        setVolume(vol: number) {
            const volDecimal = vol / 100 || 0;
            setInternalVolume(volDecimal);
            if (mpvPlayer) {
                mpvPlayer.volume(vol);
            }
        },
    }));

    return <div id="mpv-player-engine" style={{ display: 'none' }} />;
};

MpvPlayerEngine.displayName = 'MpvPlayerEngine';
