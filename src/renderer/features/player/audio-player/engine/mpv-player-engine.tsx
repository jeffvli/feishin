import type { RefObject } from 'react';

import isElectron from 'is-electron';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';

import { AudioPlayer, PlayerOnProgressProps } from '/@/renderer/features/player/audio-player/types';
import { getMpvProperties } from '/@/renderer/features/settings/components/playback/mpv-settings';
import { useSettingsStore } from '/@/renderer/store';
import { PlayerStatus } from '/@/shared/types/types';

export interface MpvPlayerEngineHandle extends AudioPlayer {}

interface MpvPlayerEngineProps {
    currentSrc: string | undefined;
    isMuted: boolean;
    isTransitioning: boolean;
    nextSrc: string | undefined;
    onEnded: () => void;
    onProgress: (e: PlayerOnProgressProps) => void;
    playerRef: RefObject<MpvPlayerEngineHandle>;
    playerStatus: PlayerStatus;
    speed?: number;
    volume: number;
}

const mpvPlayer = isElectron() ? window.api.mpvPlayer : null;
const mpvPlayerListener = isElectron() ? window.api.mpvPlayerListener : null;
const ipc = isElectron() ? window.api.ipc : null;

const PROGRESS_UPDATE_INTERVAL = 250;
const TRANSITION_PROGRESS_INTERVAL = 10;

export const MpvPlayerEngine = (props: MpvPlayerEngineProps) => {
    const {
        currentSrc,
        isMuted,
        isTransitioning,
        nextSrc,
        onEnded,
        onProgress,
        playerRef,
        playerStatus,
        speed,
        volume,
    } = props;

    const [internalVolume, setInternalVolume] = useState(volume / 100 || 0);
    const [duration] = useState(0);
    const [previousCurrentSrc, setPreviousCurrentSrc] = useState<string | undefined>(currentSrc);

    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isInitializedRef = useRef<boolean>(false);

    const mpvExtraParameters = useSettingsStore((store) => store.playback.mpvExtraParameters);
    const mpvProperties = useSettingsStore((store) => store.playback.mpvProperties);

    // Start the mpv instance on startup
    useEffect(() => {
        const initializeMpv = async () => {
            const isRunning: boolean | undefined = await mpvPlayer?.isRunning();

            mpvPlayer?.stop();

            if (!isRunning) {
                const properties: Record<string, any> = {
                    // speed: usePlayerStore.getState().speed,
                    ...getMpvProperties(mpvProperties),
                };

                await mpvPlayer?.initialize({
                    extraParameters: mpvExtraParameters,
                    properties,
                });

                mpvPlayer?.volume(properties.volume);
                isInitializedRef.current = true;
            } else {
                isInitializedRef.current = true;
            }
        };

        initializeMpv();

        return () => {
            mpvPlayer?.stop();
            mpvPlayer?.cleanup();
            isInitializedRef.current = false;
        };
    }, [mpvExtraParameters, mpvProperties]);

    // Populate mpv queue after initialization
    useEffect(() => {
        if (!mpvPlayer || !isInitializedRef.current) {
            return;
        }

        if (currentSrc) {
            const shouldPause = playerStatus !== PlayerStatus.PLAYING;
            mpvPlayer.setQueue(currentSrc, nextSrc, shouldPause);
        }
    }, [currentSrc, nextSrc, playerStatus]);

    // Update volume
    useEffect(() => {
        if (!mpvPlayer) {
            return;
        }

        const vol = volume / 100 || 0;
        setInternalVolume(vol);
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

    // Handle current song changes - update queue position 0
    // When currentSrc changes, we need to update the queue
    useEffect(() => {
        if (!mpvPlayer) {
            return;
        }

        // If currentSrc changed, update the queue
        if (currentSrc !== previousCurrentSrc) {
            if (currentSrc) {
                // Set current song at position 0 and next song at position 1
                mpvPlayer.setQueue(currentSrc, nextSrc, playerStatus !== PlayerStatus.PLAYING);
                setPreviousCurrentSrc(currentSrc);
            } else {
                // Clear queue if no current song
                mpvPlayer.setQueue(undefined, undefined, true);
                setPreviousCurrentSrc(undefined);
            }
        } else {
            // If currentSrc hasn't changed but nextSrc has, update position 1
            // This happens when the next song changes but current song stays the same
            if (currentSrc) {
                mpvPlayer.setQueueNext(nextSrc);
            }
        }
    }, [currentSrc, previousCurrentSrc, nextSrc, playerStatus]);

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
            if (!mpvPlayer) {
                return;
            }

            try {
                const time = await mpvPlayer.getCurrentTime();
                if (time !== undefined) {
                    onProgress({
                        played: time / (duration || time + 10),
                        playedSeconds: time,
                    });
                }
            } catch {
                // Handle error silently
            }
        };

        if (currentSrc) {
            const interval = isTransitioning
                ? TRANSITION_PROGRESS_INTERVAL
                : PROGRESS_UPDATE_INTERVAL;
            progressIntervalRef.current = setInterval(updateProgress, interval);
            updateProgress();
        }

        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, [currentSrc, isTransitioning, duration, onProgress]);

    useEffect(() => {
        if (!mpvPlayerListener) {
            return;
        }

        const handleOnEnded = () => {
            onEnded();
        };

        mpvPlayerListener.rendererAutoNext(handleOnEnded);

        return () => {
            ipc?.removeAllListeners('renderer-player-auto-next');
        };
    }, [nextSrc, onEnded]);

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
