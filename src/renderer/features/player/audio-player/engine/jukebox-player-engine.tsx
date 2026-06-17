import type { RefObject } from 'react';

import { useEffect, useImperativeHandle, useRef, useState } from 'react';

import { useJukeboxControl } from '/@/renderer/features/player/audio-player/hooks/use-jukebox-control';
import { AudioPlayer } from '/@/renderer/features/player/audio-player/types';
import { JukeboxControlAction, JukeboxControlQuery } from '/@/shared/types/domain-types';
import { PlayerStatus } from '/@/shared/types/types';

export interface JukeboxPlayerEngineHandle extends AudioPlayer {}

export type JukeboxServerState = {
    gain: number;
    playing: boolean;
    position: number;
    trackId: null | string;
};

interface JukeboxPlayerEngineProps {
    currentTrackId: null | string;
    enabled: boolean;
    isMuted: boolean;
    onEnded: () => void;
    onServerStateSynced?: (state: JukeboxServerState) => void;
    onTick: (positionSeconds: number) => void;
    playerRef: RefObject<JukeboxPlayerEngineHandle | null>;
    playerStatus: PlayerStatus;
    serverId: string;
    volume: number;
}

export const JukeboxPlayerEngine = (props: JukeboxPlayerEngineProps) => {
    const {
        currentTrackId,
        enabled,
        isMuted,
        onEnded,
        onServerStateSynced,
        onTick,
        playerRef,
        playerStatus,
        serverId,
        volume,
    } = props;

    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const lastPositionRef = useRef<number>(-1);
    const lastTrackIdRef = useRef<null | string>(null);
    const isChangingTrackRef = useRef<boolean>(false);
    const serverPlayingRef = useRef<boolean>(false);
    const [gainValue, setGainValue] = useState(volume / 100);
    const [isSyncedFromServer, setIsSyncedFromServer] = useState(false);

    const jukeboxControlMutation = useJukeboxControl();

    const callApi = async (
        action: JukeboxControlAction,
        queryParams: Omit<JukeboxControlQuery, 'action'> = {},
    ) => {
        if (!serverId) return null;
        try {
            return await jukeboxControlMutation.mutateAsync({
                apiClientProps: { serverId },
                query: {
                    action,
                    ...queryParams,
                },
            });
        } catch {
            return null;
        }
    };

    // 0. On startup, read existing server jukebox state before pushing local state
    useEffect(() => {
        if (!enabled) {
            return;
        }

        let cancelled = false;

        const syncFromServer = async () => {
            setIsSyncedFromServer(false);

            const res = await callApi('get');
            if (cancelled) {
                return;
            }

            const playlist = res?.jukeboxPlaylist;
            if (!playlist) {
                serverPlayingRef.current = false;
                setIsSyncedFromServer(true);
                return;
            }

            const currentIndex = playlist.currentIndex ?? 0;
            const serverTrackId = playlist.entry?.[currentIndex]?.id ?? null;
            const { gain, playing, position } = playlist;

            if (serverTrackId) {
                lastTrackIdRef.current = serverTrackId;
            }

            if (position !== undefined && position !== null) {
                lastPositionRef.current = position;
            }

            serverPlayingRef.current = playing;

            if (gain !== undefined) {
                setGainValue(gain);
            }

            onServerStateSynced?.({
                gain: gain ?? gainValue,
                playing,
                position: position ?? 0,
                trackId: serverTrackId,
            });

            if (!cancelled) {
                setIsSyncedFromServer(true);
            }
        };

        syncFromServer();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, serverId]);

    // 1. Safe Track Transitioning
    useEffect(() => {
        if (!isSyncedFromServer) {
            return;
        }

        const syncTrack = async () => {
            if (!currentTrackId) {
                if (!serverPlayingRef.current) {
                    await callApi('stop');
                    lastTrackIdRef.current = null;
                    lastPositionRef.current = -1;
                }
                return;
            }

            if (currentTrackId !== lastTrackIdRef.current) {
                isChangingTrackRef.current = true;
                lastTrackIdRef.current = currentTrackId;
                lastPositionRef.current = -1;

                await callApi('set', { id: currentTrackId });

                if (playerStatus === PlayerStatus.PLAYING) {
                    await callApi('start');
                    serverPlayingRef.current = true;
                } else {
                    serverPlayingRef.current = false;
                }

                setTimeout(() => {
                    isChangingTrackRef.current = false;
                }, 300);
            }
        };

        syncTrack();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTrackId, isSyncedFromServer]);

    // 2. Play/Pause Matcher
    useEffect(() => {
        if (!isSyncedFromServer || isChangingTrackRef.current) {
            return;
        }

        const shouldPlay = playerStatus === PlayerStatus.PLAYING;
        if (serverPlayingRef.current === shouldPlay) {
            return;
        }

        if (shouldPlay) {
            callApi('start');
        } else {
            callApi('stop');
        }

        serverPlayingRef.current = shouldPlay;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerStatus, isSyncedFromServer]);

    // 3. Audio Level Matcher
    useEffect(() => {
        if (!isSyncedFromServer) {
            return;
        }

        const gain = isMuted ? 0 : gainValue;
        callApi('setGain', { gain });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gainValue, isMuted, isSyncedFromServer]);

    // 4. Position Tick Updates
    useEffect(() => {
        if (pollRef.current) clearInterval(pollRef.current);
        if (!isSyncedFromServer || playerStatus !== PlayerStatus.PLAYING) return;

        pollRef.current = setInterval(async () => {
            if (isChangingTrackRef.current) return;

            const res = await callApi('get');
            if (!res?.jukeboxPlaylist) return;

            const { playing, position } = res.jukeboxPlaylist;
            serverPlayingRef.current = playing;

            if (!playing && lastPositionRef.current > 0) {
                lastPositionRef.current = -1;
                onEnded();
                return;
            }

            if (position !== undefined && position !== null) {
                lastPositionRef.current = position;
                onTick(position);
            }
        }, 1000);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSyncedFromServer, playerStatus, onEnded, onTick]);

    useImperativeHandle<JukeboxPlayerEngineHandle, JukeboxPlayerEngineHandle>(playerRef, () => ({
        decreaseVolume(by: number) {
            const next = Math.max(0, gainValue - by / 100);
            setGainValue(next);
        },
        increaseVolume(by: number) {
            const next = Math.min(1, gainValue + by / 100);
            setGainValue(next);
        },
        pause() {
            serverPlayingRef.current = false;
            callApi('stop');
        },
        play() {
            serverPlayingRef.current = true;
            callApi('start');
        },
        seekTo(seconds: number) {
            if (isChangingTrackRef.current) return;
            callApi('skip', { index: 0, offset: Math.floor(seconds) });
        },
        setVolume(vol: number) {
            const gain = vol / 100;
            setGainValue(gain);
            callApi('setGain', { gain });
        },
    }));

    return <div id="jukebox-player-engine" style={{ display: 'none' }} />;
};

JukeboxPlayerEngine.displayName = 'JukeboxPlayerEngine';
