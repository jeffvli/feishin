import type { RefObject } from 'react';

import isElectron from 'is-electron';
import { useCallback, useEffect, useImperativeHandle, useRef } from 'react';

import { playerHandoff } from './player-handoff';

import { api } from '/@/renderer/api';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { getSongUrl } from '/@/renderer/features/player/audio-player/hooks/use-stream-url';
import { AudioPlayer } from '/@/renderer/features/player/audio-player/types';
import {
    usePlaybackSettings,
    usePlayerActions,
    usePlayerStore,
    useSettingsStore,
} from '/@/renderer/store';
import { LibraryItem } from '/@/shared/types/domain-types';
import { PlayerStatus } from '/@/shared/types/types';

export interface DlnaPlayerEngineHandle extends AudioPlayer {}

export const pendingInitialSeek = { value: -1 };

interface DlnaPlayerEngineProps {
    isMuted: boolean;
    onEnded: () => void;
    playerRef: RefObject<DlnaPlayerEngineHandle | null>;
    playerStatus: PlayerStatus;
    volume: number;
}

type SongWithAudioMeta = {
    contentType?: null | string;
    suffix?: null | string;
};

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

function getMimeType(url: string, contentType?: null | string, suffix?: null | string): string {
    const formatMatch = url.match(/[?&]format=([^&]+)/i);
    if (formatMatch) {
        const fmt = formatMatch[1].toLowerCase();
        const mime = FORMAT_MIME_MAP[fmt];
        if (mime) return mime;
        if (mime === '') return 'audio/mpeg';
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
    contentType?: null | string,
    suffix?: null | string,
): Promise<string> {
    const fromMetadata = getMimeType(url, contentType, suffix);
    if (fromMetadata !== 'audio/mpeg') return fromMetadata;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1000);
        const res = await fetch(url, { method: 'HEAD', signal: controller.signal });
        clearTimeout(timeoutId);
        const ct = res.headers.get('content-type');
        if (ct?.startsWith('audio/')) return ct.split(';')[0].trim();
    } catch {
        // Handle
    }
    return 'audio/mpeg';
}

export const DlnaPlayerEngine = (props: DlnaPlayerEngineProps) => {
    const { isMuted, onEnded, playerRef, playerStatus, volume } = props;
    const { transcode } = usePlaybackSettings();
    const { mediaPause, mediaPlay, mediaPrevious, setTimestamp, setVolume } = usePlayerActions();
    const hasPlayedRef = useRef(false);
    const skipNextSendRef = useRef(false);
    const lastSentUrlRef = useRef<string>('');
    // Define sendCurrentTrackToDlna BEFORE any effects that reference it
    const lastSentRawUrlRef = useRef<string>('');
    const lastSentAtRef = useRef<number>(0);
    const recentTrackEndedAtRef = useRef<number>(0);
    const TRACK_ENDED_PREV_SUPPRESSION_MS = 4000;
    const sameUriLoopQueuedRef = useRef(false);
    const wasNearEndRef = useRef(false);
    const currentSongDurationRef = useRef<number>(0);
    const preservePitchRef = useRef(useSettingsStore.getState().playback?.preservePitch ?? true);
    const isAutoAdvancingRef = useRef(false);
    useEffect(() => {
        const unsubscribe = useSettingsStore.subscribe(
            (state) => state.playback.preservePitch,
            (newPreservePitch) => {
                preservePitchRef.current = newPreservePitch;
            },
        );
        return () => unsubscribe();
    }, []);
    const sendCurrentTrackToDlna = useCallback(async () => {
        if (!dlnaPlayer) return;
        // Skip if the device already auto-transitioned (gapless)
        if (skipNextSendRef.current) {
            skipNextSendRef.current = false;
            return;
        }
        const wasPlayingAtStart = usePlayerStore.getState().player.status === PlayerStatus.PLAYING;
        const wasAutoAdvancingAtStart = isAutoAdvancingRef.current;
        const playerData = usePlayerStore.getState().getPlayerData();
        const song = playerData.currentSong;
        if (!song) return;
        const currentSpeed = usePlayerStore.getState().player.speed || 1;
        const rawUrl = await getSongUrl(song, transcode);
        if (!rawUrl) return;
        let urlToPlay = rawUrl;
        let isProxy = false;
        if (currentSpeed !== 1) {
            const proxyUrl = await dlnaPlayer.prepareSpeedFile({
                offset: 0,
                preservePitch: preservePitchRef.current,
                speed: currentSpeed,
                url: rawUrl,
            });
            if (proxyUrl) {
                urlToPlay = proxyUrl;
                isProxy = true;
            }
        } else {
            dlnaPlayer.destroySpeedProxy?.();
        }
        const now = Date.now();
        if (urlToPlay === lastSentUrlRef.current && now - lastSentAtRef.current < 500) {
            return;
        }
        lastSentUrlRef.current = urlToPlay;
        lastSentRawUrlRef.current = rawUrl;
        lastSentAtRef.current = now;
        wasNearEndRef.current = false;
        const durationSeconds = song.duration ? song.duration / 1000 : 0;
        currentSongDurationRef.current = isProxy ? durationSeconds / currentSpeed : durationSeconds;
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
        const mimeType = isProxy
            ? 'audio/mpeg'
            : await resolveMimeType(rawUrl, contentType, suffix);
        const isCurrentlyPlaying = usePlayerStore.getState().player.status === PlayerStatus.PLAYING;
        const shouldAutoPlay =
            isAutoAdvancingRef.current ||
            wasAutoAdvancingAtStart ||
            isCurrentlyPlaying ||
            wasPlayingAtStart;
        if (!shouldAutoPlay && !hasPlayedRef.current) {
            return;
        }
        let targetSeek = 0;
        if (playerHandoff.pendingDlnaSeek >= 0) {
            targetSeek = playerHandoff.pendingDlnaSeek;
            playerHandoff.pendingDlnaSeek = -1;
        } else if (pendingInitialSeek.value >= 0) {
            targetSeek = pendingInitialSeek.value;
            pendingInitialSeek.value = -1;
        }
        dlnaPlayer.playUrl(
            urlToPlay,
            {
                albumArtUrl,
                albumName: song.album || undefined,
                artistName: song.artistName || song.artists?.[0]?.name || undefined,
                autoPlay: shouldAutoPlay,
                duration: currentSongDurationRef.current,
                mimeType,
                title: song.name,
            },
            { isMuted: props.isMuted, seekTo: targetSeek },
        );
        hasPlayedRef.current = true;
        isAutoAdvancingRef.current = false;
        setTimeout(async () => {
            const freshState = usePlayerStore.getState().getPlayerData();
            // Pre-load the next track for gapless playback
            const nextSong = freshState.nextSong;
            if (nextSong && currentSpeed === 1) {
                const nextUrl = await getSongUrl(nextSong, transcode);
                if (nextUrl) {
                    sameUriLoopQueuedRef.current = nextUrl === rawUrl;
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
                } else {
                    sameUriLoopQueuedRef.current = false;
                }
            } else {
                sameUriLoopQueuedRef.current = false;
                setTimeout(() => {
                    dlnaPlayer?.clearNextUrl();
                }, 2000);
            }
        }, 1000);
    }, [transcode, props.isMuted]);
    const sendNextTrackToDlna = useCallback(async () => {
        if (!dlnaPlayer) return;
        const currentSpeed = usePlayerStore.getState().player.speed || 1;
        if (currentSpeed !== 1) return;
        const playerData = usePlayerStore.getState().getPlayerData();
        const nextSong = playerData.nextSong;
        if (!nextSong) return;
        const nextUrl = await getSongUrl(nextSong, transcode);
        if (!nextUrl) return;
        sameUriLoopQueuedRef.current = nextUrl === lastSentUrlRef.current;
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
            if (
                !wasNearEndRef.current &&
                currentSongDurationRef.current > 0 &&
                time >= currentSongDurationRef.current * 0.9
            ) {
                wasNearEndRef.current = true;
            }
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
            const timeSinceTrackEnded = Date.now() - recentTrackEndedAtRef.current;
            if (timeSinceTrackEnded < TRACK_ENDED_PREV_SUPPRESSION_MS) {
                return;
            }
            if (sameUriLoopQueuedRef.current && wasNearEndRef.current) {
                sameUriLoopQueuedRef.current = false;
                wasNearEndRef.current = false;
                recentTrackEndedAtRef.current = Date.now();

                const currentSpeed = usePlayerStore.getState().player.speed || 1;
                skipNextSendRef.current = currentSpeed === 1;

                onEnded();
                setTimeout(() => sendNextTrackToDlna(), 200);
                return;
            }
            sameUriLoopQueuedRef.current = false;
            mediaPrevious();
        };
        ipc.on('renderer-dlna-prev-track', handler);
        return () => {
            ipc.removeAllListeners('renderer-dlna-prev-track');
        };
    }, [mediaPrevious, onEnded, sendNextTrackToDlna]);
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
    // Listen for track ended events
    useEffect(() => {
        if (!ipc) return;
        const handleTrackEnded = () => {
            if (!hasPlayedRef.current) return;
            const state = usePlayerStore.getState();
            const playerData = state.getPlayerData();
            const isAtEnd = !playerData.nextSong;
            const isRepeating = state.player.repeat !== 'none';
            if (isAtEnd && !isRepeating) {
                isAutoAdvancingRef.current = false;
                hasPlayedRef.current = false;
                dlnaPlayer?.stop();
                onEnded();
                return;
            }
            recentTrackEndedAtRef.current = Date.now();
            sameUriLoopQueuedRef.current = false;
            wasNearEndRef.current = false;
            const currentSpeed = usePlayerStore.getState().player.speed || 1;
            isAutoAdvancingRef.current = true;
            skipNextSendRef.current = currentSpeed === 1;
            onEnded();
            if (currentSpeed !== 1) {
                setTimeout(() => {
                    sendCurrentTrackToDlna();
                }, 200);
            } else {
                setTimeout(() => sendNextTrackToDlna(), 500);
            }
        };
        ipc.on('renderer-dlna-track-ended', handleTrackEnded);
        return () => {
            ipc.removeAllListeners('renderer-dlna-track-ended');
        };
    }, [onEnded, sendCurrentTrackToDlna, sendNextTrackToDlna]);
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
                const check = async () => {
                    const playerData = usePlayerStore.getState().getPlayerData();
                    const currentUrl = playerData.currentSong
                        ? await getSongUrl(playerData.currentSong, transcode)
                        : undefined;
                    if (currentUrl && currentUrl !== lastSentRawUrlRef.current) {
                        skipNextSendRef.current = false;
                        sendCurrentTrackToDlna();
                    } else {
                        if (Date.now() - lastSentAtRef.current > 2000) {
                            dlnaPlayer.play();
                        }
                    }
                };
                check();
            } else {
                sendCurrentTrackToDlna();
            }
        } else if (playerStatus === PlayerStatus.PAUSED) {
            dlnaPlayer.pause();
        }
    }, [playerStatus, transcode, sendCurrentTrackToDlna]);
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
                sameUriLoopQueuedRef.current = false;
                wasNearEndRef.current = false;
                skipNextSendRef.current = false;
                sendCurrentTrackToDlna();
            },
            onMediaPrev: () => {
                sameUriLoopQueuedRef.current = false;
                wasNearEndRef.current = false;
                skipNextSendRef.current = false;
                sendCurrentTrackToDlna();
            },
            onPlayerPlay: () => {
                sendCurrentTrackToDlna();
            },
            onPlayerSeekToTimestamp: (properties) => {
                dlnaPlayer?.seek(properties.timestamp);
            },
            onQueueCleared: () => {
                dlnaPlayer?.stop();
                hasPlayedRef.current = false;
                lastSentUrlRef.current = '';
                lastSentRawUrlRef.current = '';
                sameUriLoopQueuedRef.current = false;
                wasNearEndRef.current = false;
            },
            onQueueRestored: () => {
                sendCurrentTrackToDlna();
            },
        },
        [transcode, sendCurrentTrackToDlna],
    );
    useEffect(() => {
        return usePlayerStore.subscribe(
            (state) => state.player.repeat,
            () => {
                if (!hasPlayedRef.current || !dlnaPlayer) return;
                const playerData = usePlayerStore.getState().getPlayerData();
                if (playerData.nextSong) {
                    sendNextTrackToDlna();
                } else {
                    dlnaPlayer.clearNextUrl();
                }
            },
        );
    }, [sendNextTrackToDlna]);
    // Handle manual change in playback speed
    useEffect(() => {
        return usePlayerStore.subscribe(
            (state) => state.player.speed,
            async (newSpeed, oldSpeed) => {
                if (newSpeed === oldSpeed) return;
                if (!hasPlayedRef.current || !dlnaPlayer) return;

                try {
                    pendingInitialSeek.value = await dlnaPlayer.getPosition();
                } catch {
                    pendingInitialSeek.value = 0;
                }
                skipNextSendRef.current = false;
                sendCurrentTrackToDlna();
            },
        );
    }, [sendCurrentTrackToDlna]);
    // Handle pitch preservation change
    useEffect(() => {
        return useSettingsStore.subscribe(
            (state) => state.playback.preservePitch,
            async (newPitch, oldPitch) => {
                if (newPitch === oldPitch) return;
                const currentSpeed = usePlayerStore.getState().player.speed || 1;
                if (currentSpeed === 1) return;
                if (!hasPlayedRef.current || !dlnaPlayer) return;

                try {
                    pendingInitialSeek.value = await dlnaPlayer.getPosition();
                } catch {
                    pendingInitialSeek.value = 0;
                }
                skipNextSendRef.current = false;
                sendCurrentTrackToDlna();
            },
        );
    }, [sendCurrentTrackToDlna]);
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
