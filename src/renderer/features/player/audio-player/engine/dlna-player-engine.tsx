import type { RefObject } from 'react';

import isElectron from 'is-electron';
import mime from 'mime';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';

import { getItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { getSongUrl } from '/@/renderer/features/player/audio-player/hooks/use-stream-url';
import { AudioPlayer, PlayerOnProgressProps } from '/@/renderer/features/player/audio-player/types';
import { useRadioStore } from '/@/renderer/features/radio/hooks/use-radio-player';
import {
    usePlaybackSettings,
    usePlayerActions,
    usePlayerStore,
    useSettingsStore,
} from '/@/renderer/store';
import { LibraryItem, QueueSong } from '/@/shared/types/domain-types';
import { DlnaMetadata, DlnaQueueItem, PlayerStatus } from '/@/shared/types/types';

export interface DlnaPlayerEngineHandle extends AudioPlayer {}

interface DlnaPlayerEngineProps {
    isMuted: boolean;
    isTransitioning: boolean;
    onEnded: () => void;
    onProgress?: (e: PlayerOnProgressProps) => void;
    playerRef: RefObject<DlnaPlayerEngineHandle | null>;
    playerStatus: PlayerStatus;
    speed?: number;
    volume: number;
}

const dlnaPlayer = isElectron() ? window.api.dlnaPlayer : null;
const dlnaPlayerListener = isElectron() ? window.api.dlnaPlayerListener : null;
const ipc = isElectron() ? window.api.ipc : null;

const PROGRESS_UPDATE_INTERVAL = 250;

export const DlnaPlayerEngine = (props: DlnaPlayerEngineProps) => {
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

    const { dlnaDevice, transcode } = usePlaybackSettings();

    // Start the mpv instance on startup
    useEffect(() => {
        if (!dlnaDevice) throw new Error('No DLNA device selected');

        isMountedRef.current = true;

        const initializeDlna = async () => {
            // Reset initialization state
            isInitializedRef.current = false;
            hasPopulatedQueueRef.current = false;

            await dlnaPlayer?.initialize({
                deviceUrl: dlnaDevice.url,
                volume: volume,
            });

            // After initialization, populate the queue if currentSrc is available
            // Don't override queue if radio is active
            const radioState = useRadioStore.getState();

            if (!radioState.currentStreamUrl) {
                const playerData = usePlayerStore.getState().getPlayerData();
                const current = playerData.currentSong
                    ? songToDlnaQueueItem(playerData.currentSong, transcode)
                    : undefined;
                const next = playerData.nextSong
                    ? songToDlnaQueueItem(playerData.nextSong, transcode)
                    : undefined;

                if (current && !hasPopulatedQueueRef.current && dlnaPlayer) {
                    const queue = { current, isPaused: true, next };
                    dlnaPlayer?.setQueue(queue);
                    hasPopulatedQueueRef.current = true;
                }
            }

            isInitializedRef.current = true;
        };

        initializeDlna();

        return () => {
            isMountedRef.current = false;
            // Stop dlna playback on unmount
            dlnaPlayer?.stop();
            isInitializedRef.current = false;
            hasPopulatedQueueRef.current = false;
        };
        // Note: volume, speed, and transcode are intentionally not in dependencies.
        // Volume and speed changes are handled by separate useEffects below to avoid
        // reinitializing the entire player. Transcode changes are handled by queue
        // update callbacks in usePlayerEvents.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dlnaDevice]);

    // Update volume
    useEffect(() => {
        if (!dlnaPlayer) {
            return;
        }

        const vol = volume / 100 || 0;
        queueMicrotask(() => {
            setInternalVolume(vol);
        });
        dlnaPlayer.setVolume(volume);
    }, [volume]);

    // Update mute status
    useEffect(() => {
        if (!dlnaPlayer) {
            return;
        }

        dlnaPlayer.setMute(isMuted);
    }, [isMuted]);

    // Handle play/pause status
    useEffect(() => {
        if (!dlnaPlayer) {
            return;
        }

        if (playerStatus === PlayerStatus.PLAYING) {
            dlnaPlayer.play(speed);
        } else if (playerStatus === PlayerStatus.PAUSED) {
            dlnaPlayer.pause();
        }
    }, [playerStatus, speed]);

    // Set up progress tracking
    useEffect(() => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
        }

        const updateProgress = async () => {
            if (!dlnaPlayer || !isMountedRef.current || !onProgress) {
                return;
            }

            try {
                const time = await dlnaPlayer.getCurrentTime();
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
        if (!dlnaPlayerListener) {
            return;
        }

        dlnaPlayerListener.rendererDlnaChangedTrack((_event, { trackUrl }) => {
            const playerData = usePlayerStore.getState().getPlayerData();
            const nextSongUrl = playerData.nextSong
                ? getSongUrl(playerData.nextSong, transcode)
                : undefined;
            if (trackUrl !== nextSongUrl) return;

            mediaAutoNext();
            handleDlnaAutoNext(transcode);
        });

        return () => {
            ipc?.removeAllListeners('renderer-dlna-changed-track');
        };
    }, [mediaAutoNext, onEnded, transcode]);

    usePlayerEvents(
        {
            onMediaNext: () => {
                replaceDlnaQueue(transcode);
            },
            onMediaPrev: () => {
                replaceDlnaQueue(transcode);
            },
            onNextSongInsertion: (song) => {
                const radioState = useRadioStore.getState();
                if (radioState.currentStreamUrl) return;

                const next = song ? songToDlnaQueueItem(song, transcode) : undefined;
                if (!next) return;

                dlnaPlayer?.setQueueNext(next);
            },
            onPlayerPlay: () => {
                replaceDlnaQueue(transcode);
            },
            onQueueCleared: () => {
                console.log('queue cleared');
            },
        },
        [transcode],
    );

    useImperativeHandle<DlnaPlayerEngineHandle, DlnaPlayerEngineHandle>(playerRef, () => ({
        decreaseVolume(by: number) {
            const newVol = Math.max(0, internalVolume - by / 100);
            setInternalVolume(newVol);
            if (dlnaPlayer) {
                dlnaPlayer.setVolume(newVol * 100);
            }
        },
        increaseVolume(by: number) {
            const newVol = Math.min(1, internalVolume + by / 100);
            setInternalVolume(newVol);
            if (dlnaPlayer) {
                dlnaPlayer.setVolume(newVol * 100);
            }
        },
        pause() {
            if (dlnaPlayer) {
                dlnaPlayer.pause();
            }
        },
        play() {
            if (dlnaPlayer) {
                dlnaPlayer.play();
            }
        },
        seekTo(seekTo: number) {
            if (dlnaPlayer) {
                dlnaPlayer.seekTo(seekTo);
            }
        },
        setVolume(vol: number) {
            const volDecimal = vol / 100 || 0;
            setInternalVolume(volDecimal);
            if (dlnaPlayer) {
                dlnaPlayer.setVolume(vol);
            }
        },
    }));

    return <div id="mpv-player-engine" style={{ display: 'none' }} />;
};

DlnaPlayerEngine.displayName = 'DlnaPlayerEngine';

function handleDlnaAutoNext(transcode: {
    bitrate?: number | undefined;
    enabled: boolean;
    format?: string | undefined;
}) {
    const playerData = usePlayerStore.getState().getPlayerData();
    const nextQueueItem = playerData.nextSong
        ? songToDlnaQueueItem(playerData.nextSong, transcode)
        : undefined;
    if (!nextQueueItem) return;

    dlnaPlayer?.setQueueNext(nextQueueItem);
}

function replaceDlnaQueue(transcode: {
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
    const current = playerData.currentSong
        ? songToDlnaQueueItem(playerData.currentSong, transcode)
        : undefined;
    if (!current) return;

    const next = playerData.nextSong
        ? songToDlnaQueueItem(playerData.nextSong, transcode)
        : undefined;

    const queue = { current, isPaused: false, next };
    dlnaPlayer?.setQueue(queue);
}

function songToDlnaQueueItem(
    song: QueueSong,
    transcode: {
        bitrate?: number | undefined;
        enabled: boolean;
        format?: string | undefined;
    },
) {
    if (!song.path) {
        console.error(`Loading song #${song.id}: no path`);
        return;
    }

    const mimeType = mime.getType(song.path);
    if (!mimeType) {
        console.error(`Loading song '${song.path}': cannot infer mime type`);
        return;
    }

    const url = getSongUrl(song, transcode);
    if (!url) {
        console.error(`Loading song '${song.path}': no url`);
        return;
    }

    const imageType = 'itemCard';
    const imageRes = useSettingsStore.getState().general.imageRes;
    const imageSize = imageRes[imageType];
    const imageUrl = getItemImageUrl({
        id: song.id,
        itemType: LibraryItem.SONG,
        serverId: song._serverId,
        size: imageSize,
        type: imageType,
    });

    const metadata: DlnaMetadata = {
        album: song.album ?? undefined,
        albumArtMimeType: 'image/jpeg',
        albumArtSize: imageSize,
        albumArtUrl: imageUrl,
        bitrate: song.bitRate,
        creator: song.artistName,
        date: song.releaseDate ?? undefined,
        discNumber: song.discNumber,
        duration: song.duration,
        genre: song.genres[0]?.name,
        size: song.size,
        title: song.name,
        trackNumber: song.trackNumber,
        type: 'audio',
    };
    const dlnaQueueItem: DlnaQueueItem = { metadata, mimeType, url };
    return dlnaQueueItem;
}
