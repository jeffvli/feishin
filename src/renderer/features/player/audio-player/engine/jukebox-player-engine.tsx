import type { RefObject } from 'react';

import { useEffect, useImperativeHandle, useRef, useState } from 'react';

import { AudioPlayer } from '/@/renderer/features/player/audio-player/types';
import { PlayerStatus } from '/@/shared/types/types';

export interface JukeboxPlayerEngineHandle extends AudioPlayer {}

interface JukeboxPlayerEngineProps {
    credential: string;
    isMuted: boolean;
    onEnded: () => void;
    onTick: (positionSeconds: number) => void;
    playerRef: RefObject<JukeboxPlayerEngineHandle | null>;
    playerStatus: PlayerStatus;
    serverUrl: string;
    volume: number;
}

export const JukeboxPlayerEngine = (props: JukeboxPlayerEngineProps) => {
    const { credential, isMuted, onEnded, onTick, playerRef, playerStatus, serverUrl, volume } =
        props;

    const pollRef = useRef<NodeJS.Timeout | null>(null);
    const lastPositionRef = useRef<number>(-1);
    const lastIndexRef = useRef<number>(-1);
    const [gainValue, setGainValue] = useState(volume / 100);

    const callApi = async (action: string, extra = '') => {
        if (!serverUrl || !credential) {
            return null;
        }
        const url = `${serverUrl}/rest/jukeboxControl?${credential}&v=1.13.0&c=Feishin&f=json&action=${action}${extra ? '&' + extra : ''}`;

        try {
            const r = await fetch(url);
            const d = await r.json();
            return d['subsonic-response'];
        } catch {
            return null;
        }
    };

    // Play/pause
    useEffect(() => {
        if (playerStatus === PlayerStatus.PLAYING) {
            callApi('start');
        } else {
            callApi('stop');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerStatus]);

    // Volume/mute
    useEffect(() => {
        const gain = isMuted ? 0 : gainValue;
        callApi('setGain', `gain=${gain.toFixed(2)}`);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gainValue, isMuted]);

    // Poll for position + track-end detection
    useEffect(() => {
        if (pollRef.current) clearInterval(pollRef.current);
        if (playerStatus !== PlayerStatus.PLAYING) return;

        pollRef.current = setInterval(async () => {
            const res = await callApi('get');
            if (!res?.jukeboxPlaylist) return;

            const { currentIndex, playing, position } = res.jukeboxPlaylist;

            // Track ended: server stopped on its own
            if (!playing && lastPositionRef.current >= 0) {
                onEnded();
                lastPositionRef.current = -1;
                return;
            }

            // Track changed mid-queue
            if (lastIndexRef.current >= 0 && currentIndex !== lastIndexRef.current) {
                onEnded();
            }

            lastIndexRef.current = currentIndex;
            lastPositionRef.current = position ?? 0;
            onTick(position ?? 0);
        }, 1000);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerStatus]);

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
            const idx = lastIndexRef.current >= 0 ? lastIndexRef.current : 0;
            callApi('skip', `index=${idx}&offset=${Math.floor(seconds)}`);
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
