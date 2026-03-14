import type { RefObject } from 'react';

import isElectron from 'is-electron';
import { useCallback, useEffect, useImperativeHandle, useRef } from 'react';

import { api } from '/@/renderer/api';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { getSongUrl } from '/@/renderer/features/player/audio-player/hooks/use-stream-url';
import { AudioPlayer } from '/@/renderer/features/player/audio-player/types';
import { usePlaybackSettings, usePlayerActions, usePlayerStore } from '/@/renderer/store';
import { LibraryItem } from '/@/shared/types/domain-types';
import { PlayerStatus } from '/@/shared/types/types';

export interface DlnaPlayerEngineHandle extends AudioPlayer {}

interface DlnaPlayerEngineProps {
    isMuted: boolean;
    onEnded: () => void;
    playerRef: RefObject<DlnaPlayerEngineHandle | null>;
    playerStatus: PlayerStatus;
    volume: number;
}

const dlnaPlayer = isElectron() ? window.api.dlnaPlayer : null;
const dlnaPlayerListener = isElectron() ? window.api.dlnaPlayerListener : null;
const ipc = isElectron() ? window.api.ipc : null;

export const DlnaPlayerEngine = (props: DlnaPlayerEngineProps) => {
    const { isMuted, onEnded, playerRef, playerStatus, volume } = props;

    const { transcode } = usePlaybackSettings();
    const { setTimestamp } = usePlayerActions();
    const hasPlayedRef = useRef(false);
    const skipNextSendRef = useRef(false);

    // Define sendCurrentTrackToDlna BEFORE any effects that reference it
    const sendCurrentTrackToDlna = useCallback(() => {
        if (!dlnaPlayer) return;

        // Skip if the device already auto-transitioned (gapless)
        if (skipNextSendRef.current) {
            skipNextSendRef.current = false;
            return;
        }

        const playerData = usePlayerStore.getState().getPlayerData();
        const song = playerData.currentSong;
        if (!song) return;

        const url = getSongUrl(song, transcode);
        if (!url) return;

        let albumArtUrl: string | undefined;
        try {
            albumArtUrl =
                api.controller.getImageUrl({
                    apiClientProps: { serverId: song._serverId },
                    query: {
                        id: song.albumId || song.id,
                        itemType: LibraryItem.ALBUM,
                        size: 600,
                    },
                }) || undefined;
        } catch {
            // Ignore image URL errors
        }

        dlnaPlayer.playUrl(url, {
            albumArtUrl,
            albumName: song.album || undefined,
            artistName: song.artistName || song.artists?.[0]?.name || undefined,
            duration: song.duration ? song.duration / 1000 : undefined,
            title: song.name,
        });

        hasPlayedRef.current = true;

        // Pre-load the next track for gapless playback
        const nextSong = playerData.nextSong;
        if (nextSong) {
            const nextUrl = getSongUrl(nextSong, transcode);
            if (nextUrl) {
                let nextArtUrl: string | undefined;
                try {
                    nextArtUrl =
                        api.controller.getImageUrl({
                            apiClientProps: { serverId: nextSong._serverId },
                            query: {
                                id: nextSong.albumId || nextSong.id,
                                itemType: LibraryItem.ALBUM,
                                size: 600,
                            },
                        }) || undefined;
                } catch {
                    // Ignore image URL errors
                }

                dlnaPlayer.setNextUrl(nextUrl, {
                    albumArtUrl: nextArtUrl,
                    albumName: nextSong.album || undefined,
                    artistName: nextSong.artistName || nextSong.artists?.[0]?.name || undefined,
                    duration: nextSong.duration ? nextSong.duration / 1000 : undefined,
                    title: nextSong.name,
                });
            }
        }
    }, [transcode]);

    // On mount, if already playing, send the current track to the DLNA device
    useEffect(() => {
        if (playerStatus === PlayerStatus.PLAYING) {
            sendCurrentTrackToDlna();
        }
        // Only run on mount
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Listen for position updates from main process
    useEffect(() => {
        if (!dlnaPlayerListener) return;

        const handleCurrentTime = (_event: any, time: number) => {
            setTimestamp(Math.floor(time));
        };

        dlnaPlayerListener.rendererCurrentTime(handleCurrentTime);

        return () => {
            ipc?.removeAllListeners('renderer-dlna-current-time');
        };
    }, [setTimestamp]);

    // Send just the next track (for after gapless transition)
    const sendNextTrackToDlna = useCallback(() => {
        if (!dlnaPlayer) return;

        const playerData = usePlayerStore.getState().getPlayerData();
        const nextSong = playerData.nextSong;
        if (!nextSong) return;

        const nextUrl = getSongUrl(nextSong, transcode);
        if (!nextUrl) return;

        let nextArtUrl: string | undefined;
        try {
            nextArtUrl =
                api.controller.getImageUrl({
                    apiClientProps: { serverId: nextSong._serverId },
                    query: {
                        id: nextSong.albumId || nextSong.id,
                        itemType: LibraryItem.ALBUM,
                        size: 600,
                    },
                }) || undefined;
        } catch {
            // Ignore image URL errors
        }

        dlnaPlayer.setNextUrl(nextUrl, {
            albumArtUrl: nextArtUrl,
            albumName: nextSong.album || undefined,
            artistName: nextSong.artistName || nextSong.artists?.[0]?.name || undefined,
            duration: nextSong.duration ? nextSong.duration / 1000 : undefined,
            title: nextSong.name,
        });
    }, [transcode]);

    // Listen for track ended events
    useEffect(() => {
        if (!dlnaPlayerListener) return;

        const handleTrackEnded = () => {
            if (hasPlayedRef.current) {
                // The device already auto-transitioned to the next track (gapless).
                // Set flag so the onPlayerPlay event doesn't re-send the track.
                skipNextSendRef.current = true;
                onEnded();
                // Queue up the next-next track after the queue advances.
                setTimeout(() => {
                    sendNextTrackToDlna();
                }, 200);
            }
        };

        dlnaPlayerListener.rendererTrackEnded(handleTrackEnded);

        return () => {
            ipc?.removeAllListeners('renderer-dlna-track-ended');
        };
    }, [onEnded, sendNextTrackToDlna]);

    // Handle play/pause
    useEffect(() => {
        if (!dlnaPlayer) return;

        if (playerStatus === PlayerStatus.PLAYING) {
            if (hasPlayedRef.current) {
                dlnaPlayer.play();
            }
        } else if (playerStatus === PlayerStatus.PAUSED) {
            dlnaPlayer.pause();
        }
    }, [playerStatus]);

    // Handle volume
    useEffect(() => {
        if (!dlnaPlayer) return;
        dlnaPlayer.volume(volume);
    }, [volume]);

    // Handle mute
    useEffect(() => {
        if (!dlnaPlayer) return;
        dlnaPlayer.mute(isMuted);
    }, [isMuted]);

    usePlayerEvents(
        {
            onMediaNext: () => {
                skipNextSendRef.current = false;
                sendCurrentTrackToDlna();
            },
            onMediaPrev: () => {
                skipNextSendRef.current = false;
                sendCurrentTrackToDlna();
            },
            onPlayerPlay: () => {
                skipNextSendRef.current = false;
                sendCurrentTrackToDlna();
            },
            onPlayerSeekToTimestamp: (properties) => {
                dlnaPlayer?.seek(properties.timestamp);
            },
            onPlayerStatus: (properties) => {
                if (properties.status === PlayerStatus.PLAYING) {
                    if (!hasPlayedRef.current) {
                        sendCurrentTrackToDlna();
                    } else {
                        dlnaPlayer?.play();
                    }
                } else if (properties.status === PlayerStatus.PAUSED) {
                    dlnaPlayer?.pause();
                }
            },
            onPlayerVolume: (properties) => {
                dlnaPlayer?.volume(properties.volume);
            },
            onQueueCleared: () => {
                dlnaPlayer?.stop();
                hasPlayedRef.current = false;
            },
            onQueueRestored: () => {
                sendCurrentTrackToDlna();
            },
        },
        [transcode, sendCurrentTrackToDlna],
    );

    useImperativeHandle<DlnaPlayerEngineHandle, DlnaPlayerEngineHandle>(playerRef, () => ({
        decreaseVolume(by: number) {
            const newVol = Math.max(0, volume - by);
            dlnaPlayer?.volume(newVol);
        },
        increaseVolume(by: number) {
            const newVol = Math.min(100, volume + by);
            dlnaPlayer?.volume(newVol);
        },
        pause() {
            dlnaPlayer?.pause();
        },
        play() {
            dlnaPlayer?.play();
        },
        seekTo(seconds: number) {
            dlnaPlayer?.seek(seconds);
        },
        setVolume(vol: number) {
            dlnaPlayer?.volume(vol);
        },
    }));

    return <div id="dlna-player-engine" style={{ display: 'none' }} />;
};

DlnaPlayerEngine.displayName = 'DlnaPlayerEngine';
