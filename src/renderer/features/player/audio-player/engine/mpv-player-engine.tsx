import type { RefObject } from 'react';

import isElectron from 'is-electron';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';

import { eventEmitter } from '/@/renderer/events/event-emitter';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { getSongUrl } from '/@/renderer/features/player/audio-player/hooks/use-stream-url';
import { AudioPlayer, PlayerOnProgressProps } from '/@/renderer/features/player/audio-player/types';
import { resolveVolumeMax } from '/@/renderer/features/player/audio-player/utils/volume';
import { useRadioStore } from '/@/renderer/features/radio/hooks/use-radio-player';
import { getMpvProperties } from '/@/renderer/features/settings/components/playback/mpv-properties';
import {
    usePlaybackSettings,
    usePlayerActions,
    usePlayerSong,
    usePlayerStore,
    useSettingsStore,
} from '/@/renderer/store';
import { PlayerStatus, PlayerType } from '/@/shared/types/types';

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
    const currentSong = usePlayerSong();

    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const isInitializedRef = useRef<boolean>(false);
    const hasPopulatedQueueRef = useRef<boolean>(false);
    const isMountedRef = useRef<boolean>(true);

    const { mpvAudioDeviceId, transcode } = usePlaybackSettings();
    const mpvExtraParameters = useSettingsStore((store) => store.playback.mpvExtraParameters);
    const mpvProperties = useSettingsStore((store) => store.playback.mpvProperties);
    const [reloadTrigger, setReloadTrigger] = useState(0);

    useEffect(() => {
        const handleMpvReload = () => {
            setReloadTrigger((prev) => prev + 1);
        };

        eventEmitter.on('MPV_RELOAD', handleMpvReload);
        // The main process notifies us after the OS resumes from sleep, since the
        // stream mpv had open is likely on a now-dead connection.
        mpvPlayerListener?.rendererMpvReconnect(handleMpvReload);

        return () => {
            eventEmitter.off('MPV_RELOAD', handleMpvReload);
            ipc?.removeAllListeners('renderer-mpv-reconnect');
        };
    }, []);

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
                volume: volume,
            };

            const extraParameters: string[] = [...mpvExtraParameters];

            const audioDevice = mpvAudioDeviceId?.trim() || 'auto';
            extraParameters.push(`--audio-device=${audioDevice}`);

            await mpvPlayer?.initialize({
                extraParameters,
                properties,
            });

            // Apply EQ and compressor filters after MPV has initialized
            const { compressor, equalizer } = useSettingsStore.getState().playback;
            const { buildMpvAudioFilters } =
                await import('/@/renderer/features/settings/components/playback/mpv-audio-filters');
            const filterStr = buildMpvAudioFilters(equalizer, compressor);
            if (filterStr) {
                mpvPlayer?.setProperties({ af: filterStr });
            }

            // After initialization, populate the queue if currentSrc is available
            // Don't override queue if radio is active
            const radioState = useRadioStore.getState();

            if (!radioState.currentStreamUrl) {
                const playerData = usePlayerStore.getState().getPlayerData();
                const currentSongUrl = playerData.currentSong
                    ? await getSongUrl(playerData.currentSong, transcode, true)
                    : undefined;
                const nextSongUrl = playerData.nextSong
                    ? await getSongUrl(playerData.nextSong, transcode, true)
                    : undefined;

                if (currentSongUrl && nextSongUrl && !hasPopulatedQueueRef.current && mpvPlayer) {
                    mpvPlayer.setQueue(currentSongUrl, nextSongUrl, true);
                    hasPopulatedQueueRef.current = true;
                }
            }

            isInitializedRef.current = true;
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
        // reloadTrigger is included to allow manual reload via MPV_RELOAD event.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mpvExtraParameters, mpvProperties, mpvAudioDeviceId, reloadTrigger]);

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
        } else {
            mpvPlayer.pause();
        }
    }, [playerStatus]);

    const hasCurrentSong = !!currentSong?.id;

    // Set up progress tracking
    useEffect(() => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }

        if (!hasCurrentSong) {
            return;
        }

        if (playerStatus !== PlayerStatus.PLAYING) {
            return;
        }

        const updateProgress = async () => {
            if (!mpvPlayer || !isMountedRef.current) {
                return;
            }

            try {
                const time = await mpvPlayer.getCurrentTime();
                if (time !== undefined && isMountedRef.current) {
                    onProgress({
                        played: time / (time + 10),
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
    }, [hasCurrentSong, isTransitioning, onProgress, playerStatus]);

    const { mediaAutoNext } = usePlayerActions();

    useEffect(() => {
        if (!mpvPlayerListener) {
            return;
        }

        const handleOnAutoNext = () => {
            mediaAutoNext();
            handleMpvAutoNext(transcode);
        };

        const handleTrackEnded = () => {
            const { player } = usePlayerStore.getState();
            // mpv often emits `stopped` before this event, which already set STOPPED
            // via mediaStop. Still run mediaAutoNext so end-of-queue seek/reset runs.
            if (player.status !== PlayerStatus.PLAYING && player.status !== PlayerStatus.STOPPED) {
                return;
            }

            mediaAutoNext();
        };

        mpvPlayerListener.rendererAutoNext(handleOnAutoNext);
        mpvPlayerListener.rendererTrackEnded(handleTrackEnded);

        return () => {
            ipc?.removeAllListeners('renderer-player-auto-next');
            ipc?.removeAllListeners('renderer-player-track-ended');
        };
    }, [mediaAutoNext, onEnded, transcode]);

    usePlayerEvents(
        {
            onMediaNext: () => {
                replaceMpvQueue(transcode);
            },
            onMediaPrev: () => {
                replaceMpvQueue(transcode);
            },
            onNextSongInsertion: async (song) => {
                const radioState = useRadioStore.getState();

                if (radioState.currentStreamUrl) {
                    return;
                }

                const nextSongUrl = song ? await getSongUrl(song, transcode, true) : undefined;
                mpvPlayer?.setQueueNext(nextSongUrl);
            },
            onPlayerPlay: () => {
                replaceMpvQueue(transcode);
            },
            onQueueCleared: () => {},
            onQueueRestored: () => {
                replaceMpvQueue(transcode);
            },
        },
        [transcode],
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
            const maxVol = resolveVolumeMax(PlayerType.LOCAL, mpvExtraParameters) / 100;
            const newVol = Math.min(maxVol, internalVolume + by / 100);
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

async function handleMpvAutoNext(transcode: {
    bitrate?: number | undefined;
    enabled: boolean;
    format?: string | undefined;
}) {
    const playerData = usePlayerStore.getState().getPlayerData();
    const nextSongUrl = playerData.nextSong
        ? await getSongUrl(playerData.nextSong, transcode, true)
        : undefined;
    mpvPlayer?.autoNext(nextSongUrl);
}

async function replaceMpvQueue(transcode: {
    bitrate?: number | undefined;
    enabled: boolean;
    format?: string | undefined;
}) {
    // Don't override queue if radio is active
    const radioState = useRadioStore.getState();

    if (radioState.currentStreamUrl) {
        return;
    }

    const playerData = usePlayerStore.getState().getPlayerData();
    const currentSongUrl = playerData.currentSong
        ? await getSongUrl(playerData.currentSong, transcode, true)
        : undefined;
    const nextSongUrl = playerData.nextSong
        ? await getSongUrl(playerData.nextSong, transcode, true)
        : undefined;
    mpvPlayer?.setQueue(currentSongUrl, nextSongUrl, false);
}
