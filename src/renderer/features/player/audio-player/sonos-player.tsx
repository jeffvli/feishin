import { useEffect, useRef, useState } from 'react';

import {
    SonosPlayerEngine,
    SonosPlayerEngineHandle,
} from '/@/renderer/features/player/audio-player/engine/sonos-player-engine';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { getSongUrl } from '/@/renderer/features/player/audio-player/hooks/use-stream-url';
import {
    usePlaybackSettings,
    usePlayerActions,
    usePlayerData,
} from '/@/renderer/store';
import { PlayerStatus } from '/@/shared/types/types';

function getSonosApi() {
    return (window as any).api?.sonos;
}

function tlog(msg: string) {
    getSonosApi()?.logToTerminal(msg);
}

export function SonosPlayer() {
    const playerRef = useRef<SonosPlayerEngineHandle>(null);
    const { currentSong } = usePlayerData();
    const { mediaAutoNext } = usePlayerActions();
    const { transcode } = usePlaybackSettings();
    const [isConnected, setIsConnected] = useState(false);
    const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const prevSonosStateRef = useRef<string>('IDLE');
    const currentSongRef = useRef(currentSong);
    currentSongRef.current = currentSong;

    const scheduleAdvance = (durationRaw: number) => {
        const durationSec = durationRaw > 3600 ? durationRaw / 1000 : durationRaw;
        if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
        advanceTimerRef.current = setTimeout(() => {
            mediaAutoNext();
        }, (durationSec + 3) * 1000);
    };

    useEffect(() => {
        const check = async () => {
            const connected = await getSonosApi()?.getConnectionStatus();
            setIsConnected(!!connected);

            // Track Sonos playback state transitions
            if (connected) {
                try {
                    const status: string = await getSonosApi()?.getPlaybackStatus();
                    const prev = prevSonosStateRef.current;
                    prevSonosStateRef.current = status;

                    const song = currentSongRef.current;
                    tlog(`state poll: ${prev} → ${status} timer=${!!advanceTimerRef.current} song=${song?.name}`);

                    // Paused or stopped → cancel timer
                    if (status === 'PLAYBACK_STATE_IDLE' || status === 'PLAYBACK_STATE_PAUSED_PLAYBACK') {
                        if (advanceTimerRef.current) {
                            clearTimeout(advanceTimerRef.current);
                            advanceTimerRef.current = null;
                        }
                    }
                    // Resumed from idle/paused → restart timer (user pressed play on Sonos speaker)
                    if ((prev === 'PLAYBACK_STATE_IDLE' || prev === 'PLAYBACK_STATE_PAUSED_PLAYBACK') &&
                        (status === 'PLAYBACK_STATE_PLAYING' || status === 'PLAYBACK_STATE_BUFFERING')) {
                        tlog(`IDLE→PLAYING, restarting timer for ${song?.name}`);
                        if (song?.duration) {
                            scheduleAdvance(song.duration);
                        }
                    }
                } catch {}
            }
        };
        check();
        const interval = setInterval(check, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!currentSong?.id || !isConnected) return;

        // 1. Clear any pending timer from previous song (synchronous)
        if (advanceTimerRef.current) {
            clearTimeout(advanceTimerRef.current);
            advanceTimerRef.current = null;
        }

        // 2. Set auto-advance timer (synchronous)
        if (currentSong.duration && currentSong.duration > 0) {
            scheduleAdvance(currentSong.duration);
        }

        // 3. Load track to Sonos (async, fire-and-forget)
        (async () => {
            try {
                const url = await getSongUrl(currentSong, transcode, true);
                if (!url) return;

                await getSonosApi()?.loadTrack(url, {
                    album: currentSong.album || undefined,
                    artist: currentSong.artistName || undefined,
                    duration: currentSong.duration || undefined,
                    title: currentSong.name || undefined,
                });
            } catch (e) {
                console.error('[sonos] Failed to load track:', e);
            }
        })();

        return () => {
            if (advanceTimerRef.current) {
                clearTimeout(advanceTimerRef.current);
                advanceTimerRef.current = null;
            }
        };
    }, [currentSong?.id, isConnected]);

    usePlayerEvents(
        {
            onPlayerSeekToTimestamp: (properties) => {
                playerRef.current?.seekTo(properties.timestamp);
            },
            onPlayerStatus: (properties) => {
                if (properties.status === PlayerStatus.PLAYING) {
                    getSonosApi()?.play();
                    const song = currentSongRef.current;
                    if (song?.duration) {
                        scheduleAdvance(song.duration);
                    }
                } else {
                    getSonosApi()?.pause();
                    if (advanceTimerRef.current) {
                        clearTimeout(advanceTimerRef.current);
                        advanceTimerRef.current = null;
                    }
                }
            },
            onPlayerVolume: (properties) => {
                playerRef.current?.setVolume(properties.volume);
            },
            onQueueCleared: () => {
                getSonosApi()?.stop();
                if (advanceTimerRef.current) {
                    clearTimeout(advanceTimerRef.current);
                    advanceTimerRef.current = null;
                }
            },
        },
        [],
    );

    return <SonosPlayerEngine playerRef={playerRef} />;
}

SonosPlayer.displayName = 'SonosPlayer';
