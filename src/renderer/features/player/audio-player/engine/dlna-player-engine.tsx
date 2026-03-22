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

type SongWithAudioMeta = {
    contentType?: string | null;
    suffix?: string | null;
};

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
const SUFFIX_MIME_MAP: Record<string, string> = {
    aac: 'audio/aac',
    flac: 'audio/flac',
    m4a: 'audio/mp4',
    mp3: 'audio/mpeg',
    mp4: 'audio/mp4',
    ogg: 'audio/ogg',
    opus: 'audio/ogg; codecs=opus',
    wav: 'audio/wav',
    wma: 'audio/x-ms-wma',
};

const FORMAT_MIME_MAP: Record<string, string> = {
    aac: 'audio/aac',
    flac: 'audio/flac',
    mp3: 'audio/mpeg',
    ogg: 'audio/ogg',
    opus: 'audio/ogg; codecs=opus',
    raw: '',
};

function getMimeType(url: string, contentType?: string | null, suffix?: string | null): string {
    const formatMatch = url.match(/[?&]format=([^&]+)/i);
    if (formatMatch) {
        const fmt = formatMatch[1].toLowerCase();
        const mime = FORMAT_MIME_MAP[fmt];
        if (mime) return mime;
        if (mime !== '') return 'audio/mpeg';
    }
    if (contentType?.startsWith('audio/')) return contentType;
    if (suffix) {
        const mapped = SUFFIX_MIME_MAP[suffix.toLowerCase()];
        if (mapped) return mapped;
    }
    const path = url.split('?')[0].toLowerCase();
    for (const [ext, mime] of Object.entries(SUFFIX_MIME_MAP)) {
        if (path.endsWith(`.${ext}`)) return mime;
    }
    return 'audio/mpeg';
}

async function resolveMimeType(
    url: string,
    contentType?: string | null,
    suffix?: string | null,
): Promise<string> {
    const fromMetadata = getMimeType(url, contentType, suffix);
    if (fromMetadata !== 'audio/mpeg') return fromMetadata;
    try {
        const res = await fetch(url, { method: 'HEAD' });
        const ct = res.headers.get('content-type');
        if (ct?.startsWith('audio/')) return ct.split(';')[0].trim();
    } catch {
    }
    return 'audio/mpeg';
}

export const DlnaPlayerEngine = (props: DlnaPlayerEngineProps) => {
    const { isMuted, onEnded, playerRef, playerStatus, volume } = props;
    const { transcode } = usePlaybackSettings();
    const { setTimestamp, mediaPlay, mediaPause, mediaPrevious, setVolume } = usePlayerActions();
    const hasPlayedRef = useRef(false);
    const skipNextSendRef = useRef(false);
    const lastSentUrlRef = useRef<string>('');
    // Define sendCurrentTrackToDlna BEFORE any effects that reference it
    const lastSentAtRef = useRef<number>(0);
    const sendCurrentTrackToDlna = useCallback(async () => {
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
        const now = Date.now();
        if (url === lastSentUrlRef.current && now - lastSentAtRef.current < 500) {
            return;
        }
        lastSentUrlRef.current = url;
        lastSentAtRef.current = now;
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
        const { contentType, suffix } = song as unknown as SongWithAudioMeta;
        const mimeType = await resolveMimeType(url, contentType, suffix);
        dlnaPlayer.playUrl(url, {
            albumArtUrl,
            albumName: song.album || undefined,
            artistName: song.artistName || song.artists?.[0]?.name || undefined,
            duration: song.duration ? song.duration / 1000 : undefined,
            mimeType,
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
                const { contentType: nextContentType, suffix: nextSuffix } =
                    nextSong as unknown as SongWithAudioMeta;
                const nextMimeType = await resolveMimeType(
                    nextUrl,
                    nextContentType,
                    nextSuffix,
                );
                dlnaPlayer.setNextUrl(nextUrl, {
                    albumArtUrl: nextArtUrl,
                    albumName: nextSong.album || undefined,
                    artistName: nextSong.artistName || nextSong.artists?.[0]?.name || undefined,
                    duration: nextSong.duration ? nextSong.duration / 1000 : undefined,
                    mimeType: nextMimeType,
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
    useEffect(() => {
        if (!ipc) return;
        const handler = (_event: any, state: string) => {
            if (state === 'PLAYING') {
                mediaPlay?.();
            } else if (state === 'PAUSED_PLAYBACK') {
                mediaPause?.();
            }
        };
        ipc.on('renderer-dlna-transport-state', handler);
        return () => {
            ipc.removeAllListeners('renderer-dlna-transport-state');
        };
    }, [mediaPlay, mediaPause]);
    useEffect(() => {
        if (!ipc) return;
        const handler = () => {
            skipNextSendRef.current = false;
            mediaPrevious();
        };
        ipc.on('renderer-dlna-prev-track', handler);
        return () => {
            ipc.removeAllListeners('renderer-dlna-prev-track');
        };
    }, [mediaPrevious]);
    useEffect(() => {
        if (!ipc) return;
        const handler = (_event: any, vol: number) => {
            setVolume?.(vol);
        };
        ipc.on('renderer-dlna-volume', handler);
        return () => {
            ipc.removeAllListeners('renderer-dlna-volume');
        };
    }, [setVolume]);
    const sendNextTrackToDlna = useCallback(async () => {
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
        const { contentType: nextContentType, suffix: nextSuffix } =
            nextSong as unknown as SongWithAudioMeta;
        const mimeType = await resolveMimeType(nextUrl, nextContentType, nextSuffix);
        dlnaPlayer.setNextUrl(nextUrl, {
            albumArtUrl: nextArtUrl,
            albumName: nextSong.album || undefined,
            artistName: nextSong.artistName || nextSong.artists?.[0]?.name || undefined,
            duration: nextSong.duration ? nextSong.duration / 1000 : undefined,
            mimeType,
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
    const isInitialMount = useRef(true);
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }
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
            onQueueCleared: () => {
                dlnaPlayer?.stop();
                hasPlayedRef.current = false;
                lastSentUrlRef.current = '';
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
