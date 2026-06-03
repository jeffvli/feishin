import type { RefObject } from 'react';

import { useEffect, useImperativeHandle, useRef, useState } from 'react';

import { AudioPlayer } from '/@/renderer/features/player/audio-player/types';
import { PlayerStatus } from '/@/shared/types/types';

export interface JukeboxPlayerEngineHandle extends AudioPlayer {}

interface JukeboxPlayerEngineProps {
    credential: string;
    currentTrackId: null | string;
    isMuted: boolean;
    onEnded: () => void;
    onTick: (positionSeconds: number) => void;
    playerRef: RefObject<JukeboxPlayerEngineHandle | null>;
    playerStatus: PlayerStatus;
    serverUrl: string;
    volume: number;
}

export const JukeboxPlayerEngine = (props: JukeboxPlayerEngineProps) => {
    const {
        credential,
        currentTrackId,
        isMuted,
        onEnded,
        onTick,
        playerRef,
        playerStatus,
        serverUrl,
        volume,
    } = props;

    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const lastPositionRef = useRef<number>(-1);
    const lastTrackIdRef = useRef<null | string>(null);
    const isChangingTrackRef = useRef<boolean>(false); // 👈 Blocks skip/seek API calls during track setup
    const [gainValue, setGainValue] = useState(volume / 100);

    const callApi = async (action: string, extra = '') => {
        if (!serverUrl || !credential) return null;
        const url = `${serverUrl}/rest/jukeboxControl?${credential}&v=1.16.1&c=Feishin&f=json&action=${action}${extra ? '&' + extra : ''}`;
        try {
            const r = await fetch(url);
            const d = await r.json();
            return d['subsonic-response'];
        } catch {
            return null;
        }
    };

    // 1. Safe Track Transitioning
    useEffect(() => {
        const syncTrack = async () => {
            if (!currentTrackId) {
                await callApi('stop');
                lastTrackIdRef.current = null;
                lastPositionRef.current = -1;
                return;
            }

            if (currentTrackId !== lastTrackIdRef.current) {
                isChangingTrackRef.current = true; // Lock down skip/seek endpoints
                lastTrackIdRef.current = currentTrackId;
                lastPositionRef.current = -1;

                // Let 'set' clear and replace the playlist context simultaneously
                await callApi('set', `id=${currentTrackId}`);

                if (playerStatus === PlayerStatus.PLAYING) {
                    await callApi('start');
                }

                // Small delay to ensure Navidrome registration settles completely
                setTimeout(() => {
                    isChangingTrackRef.current = false;
                }, 300);
            }
        };

        syncTrack();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentTrackId]);

    // 2. Play/Pause Matcher
    useEffect(() => {
        if (isChangingTrackRef.current) return;
        if (playerStatus === PlayerStatus.PLAYING) {
            callApi('start');
        } else if (playerStatus === PlayerStatus.PAUSED) {
            callApi('stop');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerStatus]);

    // 3. Audio Level Matcher
    useEffect(() => {
        const gain = isMuted ? 0 : gainValue;
        callApi('setGain', `gain=${gain.toFixed(2)}`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gainValue, isMuted]);

    // 4. Position Tick Updates
    useEffect(() => {
        if (pollRef.current) clearInterval(pollRef.current);
        if (playerStatus !== PlayerStatus.PLAYING) return;

        pollRef.current = setInterval(async () => {
            if (isChangingTrackRef.current) return; // Prevent checking when track state changes

            const res = await callApi('get');
            if (!res?.jukeboxPlaylist) return;

            const { playing, position } = res.jukeboxPlaylist;

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
    }, [playerStatus, onEnded, onTick]);

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
            callApi('stop');
        },
        play() {
            callApi('start');
        },
        seekTo(seconds: number) {
            // Guard clause: Discard seek requests if Navidrome playlist array length is 0
            if (isChangingTrackRef.current) return;
            callApi('skip', `index=0&offset=${Math.floor(seconds)}`);
        },
        setVolume(vol: number) {
            const gain = vol / 100;
            setGainValue(gain);
            callApi('setGain', `gain=${gain.toFixed(2)}`);
        },
    }));

    return <div id="jukebox-player-engine" style={{ display: 'none' }} />;
};

JukeboxPlayerEngine.displayName = 'JukeboxPlayerEngine';
