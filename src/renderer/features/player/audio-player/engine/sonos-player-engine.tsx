import type { RefObject } from 'react';

import { useImperativeHandle, useRef } from 'react';

import { AudioPlayer } from '/@/renderer/features/player/audio-player/types';

export interface SonosPlayerEngineHandle extends AudioPlayer {}

interface SonosPlayerEngineProps {
    playerRef: RefObject<null | SonosPlayerEngineHandle>;
}

export const SonosPlayerEngine = (props: SonosPlayerEngineProps) => {
    const { playerRef } = props;

    const volumeRef = useRef(100);

    useImperativeHandle<SonosPlayerEngineHandle, SonosPlayerEngineHandle>(
        playerRef,
        () => ({
            decreaseVolume(by: number) {
                const newVol = Math.max(0, volumeRef.current - by);
                volumeRef.current = newVol;
                window.api?.sonos?.setVolume(newVol);
            },
            increaseVolume(by: number) {
                const newVol = Math.min(100, volumeRef.current + by);
                volumeRef.current = newVol;
                window.api?.sonos?.setVolume(newVol);
            },
            pause() {
                window.api?.sonos?.pause();
            },
            play() {
                window.api?.sonos?.play();
            },
            seekTo(seekTo: number) {
                const positionMillis = seekTo < 1 ? seekTo : seekTo * 1000;
                window.api?.sonos?.seek(Math.round(positionMillis));
            },
            setVolume(volume: number) {
                volumeRef.current = volume;
                window.api?.sonos?.setVolume(volume);
            },
        }),
        [],
    );

    return <div id="sonos-player-engine" style={{ display: 'none' }} />;
};

SonosPlayerEngine.displayName = 'SonosPlayerEngine';
