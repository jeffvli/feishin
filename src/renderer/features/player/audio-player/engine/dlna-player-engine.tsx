import type { RefObject } from 'react';

import isElectron from 'is-electron';
import { useCallback, useEffect, useImperativeHandle, useRef } from 'react';

import { playerHandoff } from './player-handoff';

import { api } from '/@/renderer/api';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { getSongUrl } from '/@/renderer/features/player/audio-player/hooks/use-stream-url';
import { AudioPlayer } from '/@/renderer/features/player/audio-player/types';
import {
    TranscodingConfig,
    usePlaybackSettings,
    usePlayerActions,
    usePlayerStore,
    useSettingsStore,
} from '/@/renderer/store';
import { LibraryItem, QueueSong } from '/@/shared/types/domain-types';
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

function extractDlnaId(url: string): string {
    try {
        const u = new URL(url);
        return (
            u.searchParams.get('id') ||
            u.searchParams.get('itemId') ||
            u.searchParams.get('Id') ||
            ''
        );
    } catch {
        return '';
    }
}

async function findQueueMatchForUris(
    deviceCurrentUri: string,
    deviceNextUri: string,
): Promise<null | { index: number; matchedSong: QueueSong; matchedUrl: string }> {
    const state = usePlayerStore.getState();
    const items = state.getQueue().items;
    if (items.length === 0 || !deviceCurrentUri) return null;
    const urls = await Promise.all(
        items.map(async (song) => {
            try {
                return await getSongUrl(song, { enabled: false }, true);
            } catch {
                return undefined;
            }
        }),
    );
    for (let i = 0; i < items.length; i++) {
        const url = urls[i];
        if (!url) continue;
        if (!urisMatch(url, deviceCurrentUri)) continue;
        const hasNextInQueue = i + 1 < items.length;
        if (deviceNextUri && hasNextInQueue) {
            const nextUrl = urls[i + 1];
            if (!nextUrl || !urisMatch(nextUrl, deviceNextUri)) continue;
        }
        if (deviceNextUri && !hasNextInQueue) continue;
        return { index: i, matchedSong: items[i], matchedUrl: url };
    }
    return null;
}

async function getDlnaUrl(
    song: QueueSong,
    transcode: TranscodingConfig,
): Promise<string | undefined> {
    const { contentType, suffix } = song as unknown as SongWithAudioMeta;
    if (isOpusByMetadata({ contentType, suffix })) {
        const mp3Url = await getSongUrl(song, { ...transcode, enabled: true, format: 'mp3' });
        return mp3Url;
    }
    // Detection falls back to a probe of the actual stream if there isn't a positive from the initial metadata/suffix test
    const probeUrl = await getSongUrl(song, { ...transcode, enabled: false }, true);
    if (probeUrl) {
        const isOpus = await probeIsOpusOgg(probeUrl);
        if (isOpus) {
            const mp3Url = await getSongUrl(song, { ...transcode, enabled: true, format: 'mp3' });
            return mp3Url ?? probeUrl;
        }
        if (isOggByMetadata({ contentType, suffix })) {
            const mp3Url = await getSongUrl(song, { ...transcode, enabled: true, format: 'mp3' });
            return mp3Url ?? probeUrl;
        }
    }
    const playbackUrl = await getSongUrl(song, transcode);
    return playbackUrl;
}

function getMimeType(url: string, contentType?: null | string, suffix?: null | string): string {
    const formatMatch = url.match(/[?&]format=([^&]+)/i);
    if (formatMatch) {
        const fmt = formatMatch[1].toLowerCase();
        const mime = FORMAT_MIME_MAP[fmt];
        if (mime) return mime;
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

function isOggByMetadata(song: SongWithAudioMeta): boolean {
    if (song.suffix?.toLowerCase() === 'ogg') return true;
    const ct = song.contentType?.toLowerCase();
    if (ct?.includes('ogg') || ct?.includes('vorbis')) return true;
    return false;
}

function isOpusByMetadata(song: SongWithAudioMeta): boolean {
    if (song.suffix?.toLowerCase() === 'opus') return true;
    if (song.contentType?.toLowerCase().includes('opus')) return true;
    return false;
}

// Identification here is by looking at the first 36 bytes in the OGG stream for the OPUS magic header in bytes 28-35
// Obviously, doing this client-side isn't ideal, but this was the only thing that worked with my files.
// I think that all of the providers detect OPUS on their side anyway, so at some point, I'll modify the APIs instead.
async function probeIsOpusOgg(url: string): Promise<boolean> {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 2000);
    try {
        const res = await fetch(url, {
            headers: { Range: 'bytes=0-35' },
            signal: controller.signal,
        });
        if (!res.ok && res.status !== 206) {
            return false;
        }
        if (!res.body) {
            return false;
        }
        const reader = res.body.getReader();
        const bytes = new Uint8Array(36);
        let offset = 0;
        while (offset < 36) {
            const { done, value } = await reader.read();
            if (done || !value) break;
            const copy = Math.min(value.length, 36 - offset);
            bytes.set(value.subarray(0, copy), offset);
            offset += copy;
        }
        reader.cancel();
        if (offset < 36) {
            return false;
        }
        const result =
            bytes[28] === 0x4f &&
            bytes[29] === 0x70 && // 'O' 'p'
            bytes[30] === 0x75 &&
            bytes[31] === 0x73 && // 'u' 's'
            bytes[32] === 0x48 &&
            bytes[33] === 0x65 && // 'H' 'e'
            bytes[34] === 0x61 &&
            bytes[35] === 0x64; // 'a' 'd'
        return result;
    } catch {
        return false;
    } finally {
        clearTimeout(tid);
    }
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

function urisMatch(a: string, b: string): boolean {
    if (!a || !b) return false;
    const aId = extractDlnaId(a);
    const bId = extractDlnaId(b);
    if (aId && bId) return aId === bId;
    try {
        const ua = new URL(a);
        const ub = new URL(b);
        return ua.pathname === ub.pathname;
    } catch {
        return a.split('?')[0] === b.split('?')[0];
    }
}

export const DlnaPlayerEngine = (props: DlnaPlayerEngineProps) => {
    const { isMuted, onEnded, playerRef, playerStatus, volume } = props;
    const { transcode } = usePlaybackSettings();
    const { mediaPause, mediaPlay, mediaPlayByIndex, mediaPrevious, setTimestamp, setVolume } =
        usePlayerActions();
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
    const devicePassiveModeRef = useRef(false);
    const repeatChangedAtRef = useRef(0);
    const speakerSidePlayRef = useRef(false);
    const speakerSidePauseRef = useRef(false);
    const mountHandoffInProgressRef = useRef(false);
    const sendCurrentTrackGenRef = useRef(0);
    const justLoadedTrackRef = useRef(false);
    const suppressDeviceSeekRef = useRef(false);
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
        const generation = ++sendCurrentTrackGenRef.current;
        const wasPlayingAtStart = usePlayerStore.getState().player.status === PlayerStatus.PLAYING;
        const wasAutoAdvancingAtStart = isAutoAdvancingRef.current;
        const playerData = usePlayerStore.getState().getPlayerData();
        const song = playerData.currentSong;
        if (!song) return;
        const currentSpeed = usePlayerStore.getState().player.speed || 1;
        const rawUrl = await getDlnaUrl(song, transcode);
        if (!rawUrl) return;
        let urlToPlay = rawUrl;
        let isProxy = false;
        if (currentSpeed !== 1) {
            await dlnaPlayer.prepareSpeedFile({
                offset: 0,
                preservePitch: preservePitchRef.current,
                speed: currentSpeed,
                url: rawUrl,
            });
            if (generation !== sendCurrentTrackGenRef.current) return;
            const songId = song.id;
            let readyUrl: null | string = null;
            const deadline = Date.now() + 120_000;
            while (!readyUrl && Date.now() < deadline) {
                await new Promise<void>((r) => setTimeout(r, 300));
                if (generation !== sendCurrentTrackGenRef.current) return;
                if (usePlayerStore.getState().getPlayerData().currentSong?.id !== songId) return;
                readyUrl = await dlnaPlayer.checkSpeedFile({
                    preservePitch: preservePitchRef.current,
                    speed: currentSpeed,
                    url: rawUrl,
                });
            }
            if (!readyUrl || generation !== sendCurrentTrackGenRef.current) return;
            urlToPlay = readyUrl;
            isProxy = true;
        } else {
            dlnaPlayer.destroySpeedProxy?.();
        }
        if (skipNextSendRef.current) {
            skipNextSendRef.current = false;
            lastSentUrlRef.current = urlToPlay;
            lastSentRawUrlRef.current = rawUrl;
            lastSentAtRef.current = Date.now();
            return;
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
        justLoadedTrackRef.current = true;
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
                const { contentType: nextContentType, suffix: nextSuffix } =
                    nextSong as unknown as SongWithAudioMeta;
                const nextUrl = await getDlnaUrl(nextSong, transcode);
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
    const sendNextTrackDebounceRef = useRef<null | ReturnType<typeof setTimeout>>(null);
    const sendNextTrackToDlna = useCallback(() => {
        if (sendNextTrackDebounceRef.current !== null) {
            clearTimeout(sendNextTrackDebounceRef.current);
        }
        const msSinceRepeatChange = Date.now() - repeatChangedAtRef.current;
        const debounceMs = msSinceRepeatChange < 2000 ? 2000 - msSinceRepeatChange + 100 : 80;
        sendNextTrackDebounceRef.current = setTimeout(async () => {
            sendNextTrackDebounceRef.current = null;
            if (!dlnaPlayer) return;
            const currentSpeed = usePlayerStore.getState().player.speed || 1;
            if (currentSpeed !== 1) return;
            const playerData = usePlayerStore.getState().getPlayerData();
            const nextSong = playerData.nextSong;
            if (!nextSong) {
                dlnaPlayer.clearNextUrl();
                return;
            }
            const { contentType: nextContentType, suffix: nextSuffix } =
                nextSong as unknown as SongWithAudioMeta;
            const nextUrl = await getDlnaUrl(nextSong, transcode);
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
            const mimeType = await resolveMimeType(nextUrl, nextContentType, nextSuffix);
            dlnaPlayer.setNextUrl(nextUrl, {
                albumArtUrl: nextArtUrl,
                albumName: nextSong.album || undefined,
                artistName: nextSong.artistName || nextSong.artists?.[0]?.name || undefined,
                duration: nextSong.duration ? nextSong.duration / 1000 : undefined,
                mimeType,
                title: nextSong.name,
            });
        }, debounceMs);
    }, [transcode]);

    useEffect(() => {
        if (playerHandoff.deviceAlreadyPlaying) {
            playerHandoff.deviceAlreadyPlaying = false;
            playerHandoff.deviceWasPaused = false;
            mountHandoffInProgressRef.current = true;
            return;
        } else {
            if (playerStatus !== PlayerStatus.PLAYING) {
                pendingInitialSeek.value = -1;
            }
            devicePassiveModeRef.current = true;
        }
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
    useEffect(() => {
        if (!dlnaPlayerListener) return;
        if (!ipc) return;
        const handler = async (
            _event: any,
            info: {
                duration: number;
                nextUri: string;
                position: number;
                transportState: string;
                uri: string;
            },
        ) => {
            mountHandoffInProgressRef.current = true;
            hasPlayedRef.current = true;
            devicePassiveModeRef.current = false;
            const match = info.uri
                ? await findQueueMatchForUris(info.uri, info.nextUri || '')
                : null;

            if (match) {
                const playerData = usePlayerStore.getState().getPlayerData();
                const isAlreadyCurrent =
                    playerData.currentSong?._uniqueId === match.matchedSong._uniqueId;
                let trackedUrl = match.matchedUrl;
                try {
                    const fullUrl = await getDlnaUrl(match.matchedSong, transcode);
                    if (fullUrl) trackedUrl = fullUrl;
                } catch {
                    // Fallback
                }

                if (!isAlreadyCurrent) {
                    mediaPlayByIndex?.(match.index);
                }
                if (info.position > 0) setTimestamp(Math.floor(info.position));
                lastSentRawUrlRef.current = trackedUrl;
                lastSentUrlRef.current = trackedUrl;
                lastSentAtRef.current = Date.now();
                wasNearEndRef.current = false;
                mountHandoffInProgressRef.current = false;
                if (playerStatus === PlayerStatus.PLAYING) {
                    if (pendingInitialSeek.value >= 0) {
                        const seekTarget = pendingInitialSeek.value;
                        pendingInitialSeek.value = -1;
                        dlnaPlayer?.seek(seekTarget);
                    }
                    dlnaPlayer?.play();
                } else if (info.transportState === 'PLAYING') {
                    pendingInitialSeek.value = -1;
                    speakerSidePlayRef.current = true;
                    suppressDeviceSeekRef.current = true;
                    mediaPlay?.();
                } else if (
                    info.transportState === 'PAUSED_PLAYBACK' &&
                    usePlayerStore.getState().player.status !== PlayerStatus.PAUSED
                ) {
                    speakerSidePauseRef.current = true;
                    mediaPause?.();
                }
                sendNextTrackToDlna();
                return;
            }
            await new Promise<void>((resolve) => setTimeout(resolve, 50));
            lastSentRawUrlRef.current = '';
            lastSentUrlRef.current = '';
            mountHandoffInProgressRef.current = false;
            if (playerStatus === PlayerStatus.PLAYING) {
                sendCurrentTrackToDlna();
            }
        };
        dlnaPlayerListener.rendererDlnaConnectPlayback(handler);
        return () => {
            ipc?.removeAllListeners('renderer-dlna-connect-playback');
        };
    }, [
        transcode,
        setTimestamp,
        playerStatus,
        sendCurrentTrackToDlna,
        sendNextTrackToDlna,
        mediaPlay,
        mediaPlayByIndex,
        mediaPause,
    ]);
    // Send just the next track (for after gapless transition)
    useEffect(() => {
        if (!dlnaPlayerListener) return;
        const handler = (_event: any, state: string) => {
            if (devicePassiveModeRef.current) {
                if (state === 'PLAYING') {
                    devicePassiveModeRef.current = false;
                    mediaPlay?.();
                }
                return;
            }
            const msSinceLastSend =
                lastSentAtRef.current === 0 ? Infinity : Date.now() - lastSentAtRef.current;
            if (msSinceLastSend < 2000 && state !== 'PLAYING') return;
            if (state === 'PLAYING') {
                speakerSidePlayRef.current = true;
                mediaPlay?.();
            } else if (state === 'PAUSED_PLAYBACK') {
                speakerSidePauseRef.current = true;
                mediaPause?.();
            } else if (state === 'STOPPED') {
                mediaPause?.();
            }
        };
        dlnaPlayerListener.rendererDlnaTransportState(handler);
        return () => {
            ipc?.removeAllListeners('renderer-dlna-transport-state');
        };
    }, [mediaPlay, mediaPause]);
    useEffect(() => {
        if (!dlnaPlayerListener) return;
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
            mediaPrevious(false);
        };
        dlnaPlayerListener.rendererDlnaPrevTrack(handler);
        return () => {
            ipc?.removeAllListeners('renderer-dlna-prev-track');
        };
    }, [mediaPrevious, onEnded, sendNextTrackToDlna]);
    useEffect(() => {
        if (!dlnaPlayerListener) return;
        const handler = (_event: any, vol: number) => {
            setVolume?.(vol);
        };
        dlnaPlayerListener.rendererDlnaVolume(handler);
        return () => {
            ipc?.removeAllListeners('renderer-dlna-volume');
        };
    }, [setVolume]);
    // Listen for track ended events
    useEffect(() => {
        if (!dlnaPlayerListener) return;
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
        dlnaPlayerListener.rendererDlnaTrackEnded(handleTrackEnded);
        return () => {
            ipc?.removeAllListeners('renderer-dlna-track-ended');
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
        if (devicePassiveModeRef.current) {
            if (playerStatus === PlayerStatus.PAUSED) {
                devicePassiveModeRef.current = false;
                dlnaPlayer.pause();
                return;
            }
            if (playerStatus === PlayerStatus.PLAYING) {
                devicePassiveModeRef.current = false;
            } else {
                return;
            }
        }
        const isSpeakerSidePlay = speakerSidePlayRef.current;
        speakerSidePlayRef.current = false;
        const isSpeakerSidePause = speakerSidePauseRef.current;
        speakerSidePauseRef.current = false;
        if (playerStatus === PlayerStatus.PLAYING) {
            if (hasPlayedRef.current) {
                const check = async () => {
                    if (mountHandoffInProgressRef.current) return;
                    const playerData = usePlayerStore.getState().getPlayerData();
                    const currentSong = playerData.currentSong;
                    const currentUrl = currentSong
                        ? await getDlnaUrl(currentSong, transcode)
                        : undefined;
                    if (currentUrl && currentUrl !== lastSentRawUrlRef.current) {
                        skipNextSendRef.current = false;
                        sendCurrentTrackToDlna();
                    } else if (!isSpeakerSidePlay) {
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
            if (!isSpeakerSidePause) {
                dlnaPlayer.pause();
            }
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
                devicePassiveModeRef.current = false;
                sameUriLoopQueuedRef.current = false;
                wasNearEndRef.current = false;
                skipNextSendRef.current = false;
                sendCurrentTrackToDlna();
            },
            onMediaPrev: () => {
                devicePassiveModeRef.current = false;
                sameUriLoopQueuedRef.current = false;
                wasNearEndRef.current = false;
                skipNextSendRef.current = false;
                sendCurrentTrackToDlna();
            },
            onPlayerPlay: () => {
                if (mountHandoffInProgressRef.current) return;
                if (devicePassiveModeRef.current) return;
                if (justLoadedTrackRef.current) {
                    justLoadedTrackRef.current = false;
                    return;
                }
                skipNextSendRef.current = false;
                sendCurrentTrackToDlna();
            },
            onPlayerSeekToTimestamp: (properties) => {
                if (suppressDeviceSeekRef.current) {
                    suppressDeviceSeekRef.current = false;
                    return;
                }
                dlnaPlayer?.seek(properties.timestamp);
            },
            onQueueCleared: () => {
                devicePassiveModeRef.current = false;
                dlnaPlayer?.stop();
                hasPlayedRef.current = false;
                lastSentUrlRef.current = '';
                lastSentRawUrlRef.current = '';
                sameUriLoopQueuedRef.current = false;
                wasNearEndRef.current = false;
            },
            onQueueRestored: () => {
                devicePassiveModeRef.current = false;
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
                repeatChangedAtRef.current = Date.now();
                sendNextTrackToDlna();
            },
        );
    }, [sendNextTrackToDlna]);
    useEffect(() => {
        return usePlayerStore.subscribe(
            (state) => state.getPlayerData().nextSong?.id ?? null,
            (nextId, prevId) => {
                if (!hasPlayedRef.current || !dlnaPlayer) return;
                if (nextId === prevId) return;
                sendNextTrackToDlna();
            },
        );
    }, [sendNextTrackToDlna]);
    useEffect(() => {
        return usePlayerStore.subscribe(
            (state) => state.getPlayerData().currentSong?.id ?? null,
            (nextId, prevId) => {
                if (nextId !== prevId) {
                    playerHandoff.pendingDlnaSeek = -1;
                }
                if (!hasPlayedRef.current || !dlnaPlayer) return;
                if (nextId === prevId) return;
                if (mountHandoffInProgressRef.current) return;
                sendCurrentTrackToDlna();
            },
        );
    }, [sendCurrentTrackToDlna]);
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
