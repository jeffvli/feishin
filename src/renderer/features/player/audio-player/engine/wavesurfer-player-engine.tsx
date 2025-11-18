import type { RefObject } from 'react';
import type WaveSurfer from 'wavesurfer.js';

import { useWavesurfer } from '@wavesurfer/react';
import { useEffect, useImperativeHandle, useRef, useState } from 'react';

import { AudioPlayer, PlayerOnProgressProps } from '/@/renderer/features/player/audio-player/types';
import { convertToLogVolume } from '/@/renderer/features/player/audio-player/utils/player-utils';
import { PlayerStatus } from '/@/shared/types/types';

export interface WaveSurferPlayerEngineHandle extends AudioPlayer {
    player1(): {
        ref: null | WaveSurfer;
        setVolume: (volume: number) => void;
    };
    player2(): {
        ref: null | WaveSurfer;
        setVolume: (volume: number) => void;
    };
}

interface WaveSurferPlayerEngineProps {
    isMuted: boolean;
    isTransitioning: boolean;
    onEndedPlayer1: () => void;
    onEndedPlayer2: () => void;
    onProgressPlayer1: (e: PlayerOnProgressProps) => void;
    onProgressPlayer2: (e: PlayerOnProgressProps) => void;
    playerNum: number;
    playerRef: RefObject<null | WaveSurferPlayerEngineHandle>;
    playerStatus: PlayerStatus;
    speed?: number;
    src1: string | undefined;
    src2: string | undefined;
    volume: number;
}

// Credits: https://gist.github.com/novwhisky/8a1a0168b94f3b6abfaa?permalink_comment_id=1551393#gistcomment-1551393
// This is used so that the player will always have an <audio> element. This means that
// player1Source and player2Source are connected BEFORE the user presses play for
// the first time. This workaround is important for Safari, which seems to require the
// source to be connected PRIOR to resuming audio context
const EMPTY_SOURCE =
    'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU2LjQxAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV';

export const WaveSurferPlayerEngine = (props: WaveSurferPlayerEngineProps) => {
    const {
        isMuted,
        isTransitioning,
        onEndedPlayer1,
        onEndedPlayer2,
        onProgressPlayer1,
        onProgressPlayer2,
        playerNum,
        playerRef,
        playerStatus,
        speed,
        src1,
        src2,
        volume,
    } = props;

    const container1Ref = useRef<HTMLDivElement>(null);
    const container2Ref = useRef<HTMLDivElement>(null);

    const [internalVolume1, setInternalVolume1] = useState(volume / 100 || 0);
    const [internalVolume2, setInternalVolume2] = useState(volume / 100 || 0);

    const { wavesurfer: wavesurfer1 } = useWavesurfer({
        barWidth: 0,
        container: container1Ref,
        cursorColor: 'transparent',
        height: 0,
        interact: false,
        normalize: false,
        progressColor: 'transparent',
        url: src1 || EMPTY_SOURCE,
        waveColor: 'transparent',
    });

    const { wavesurfer: wavesurfer2 } = useWavesurfer({
        barWidth: 0,
        container: container2Ref,
        cursorColor: 'transparent',
        height: 0,
        interact: false,
        normalize: false,
        progressColor: 'transparent',
        url: src2 || EMPTY_SOURCE,
        waveColor: 'transparent',
    });

    // Handle volume changes
    useEffect(() => {
        if (wavesurfer1) {
            const logVolume1 = convertToLogVolume(internalVolume1);
            wavesurfer1.setVolume(isMuted ? 0 : logVolume1);
        }
    }, [wavesurfer1, internalVolume1, isMuted]);

    useEffect(() => {
        if (wavesurfer2) {
            const logVolume2 = convertToLogVolume(internalVolume2);
            wavesurfer2.setVolume(isMuted ? 0 : logVolume2);
        }
    }, [wavesurfer2, internalVolume2, isMuted]);

    // Handle playback rate (speed)
    useEffect(() => {
        if (wavesurfer1 && speed) {
            wavesurfer1.setPlaybackRate(speed);
        }
    }, [wavesurfer1, speed]);

    useEffect(() => {
        if (wavesurfer2 && speed) {
            wavesurfer2.setPlaybackRate(speed);
        }
    }, [wavesurfer2, speed]);

    // Handle play/pause based on playerNum and status
    useEffect(() => {
        if (!wavesurfer1 || !wavesurfer2) return;

        if (playerNum === 1 && playerStatus === PlayerStatus.PLAYING) {
            wavesurfer1.play();
        } else {
            wavesurfer1.pause();
        }

        if (playerNum === 2 && playerStatus === PlayerStatus.PLAYING) {
            wavesurfer2.play();
        } else {
            wavesurfer2.pause();
        }
    }, [wavesurfer1, wavesurfer2, playerNum, playerStatus]);

    // Handle progress updates for player1
    useEffect(() => {
        if (!wavesurfer1 || !src1) return;

        const updateProgress = () => {
            const currentTime = wavesurfer1.getCurrentTime();
            const duration = wavesurfer1.getDuration();

            if (duration > 0) {
                onProgressPlayer1({
                    played: currentTime / duration,
                    playedSeconds: currentTime,
                });
            }
        };

        const interval = setInterval(updateProgress, isTransitioning ? 10 : 250);

        return () => clearInterval(interval);
    }, [wavesurfer1, src1, isTransitioning, onProgressPlayer1]);

    // Handle progress updates for player2
    useEffect(() => {
        if (!wavesurfer2 || !src2) return;

        const updateProgress = () => {
            const currentTime = wavesurfer2.getCurrentTime();
            const duration = wavesurfer2.getDuration();

            if (duration > 0) {
                onProgressPlayer2({
                    played: currentTime / duration,
                    playedSeconds: currentTime,
                });
            }
        };

        const interval = setInterval(updateProgress, isTransitioning ? 10 : 250);

        return () => clearInterval(interval);
    }, [wavesurfer2, src2, isTransitioning, onProgressPlayer2]);

    // Handle ended events
    useEffect(() => {
        if (!wavesurfer1 || !src1) return;

        const handleEnded = () => {
            onEndedPlayer1();
        };

        wavesurfer1.on('finish', handleEnded);

        return () => {
            wavesurfer1.un('finish', handleEnded);
        };
    }, [wavesurfer1, src1, onEndedPlayer1]);

    useEffect(() => {
        if (!wavesurfer2 || !src2) return;

        const handleEnded = () => {
            onEndedPlayer2();
        };

        wavesurfer2.on('finish', handleEnded);

        return () => {
            wavesurfer2.un('finish', handleEnded);
        };
    }, [wavesurfer2, src2, onEndedPlayer2]);

    useImperativeHandle<WaveSurferPlayerEngineHandle, WaveSurferPlayerEngineHandle>(
        playerRef,
        () => ({
            decreaseVolume(by: number) {
                setInternalVolume1(Math.max(0, internalVolume1 - by / 100));
                setInternalVolume2(Math.max(0, internalVolume2 - by / 100));
            },
            increaseVolume(by: number) {
                setInternalVolume1(Math.min(1, internalVolume1 + by / 100));
                setInternalVolume2(Math.min(1, internalVolume2 + by / 100));
            },
            pause() {
                wavesurfer1?.pause();
                wavesurfer2?.pause();
            },
            play() {
                if (playerNum === 1) {
                    wavesurfer1?.play();
                } else {
                    wavesurfer2?.play();
                }
            },
            player1() {
                return {
                    ref: wavesurfer1 || null,
                    setVolume: (volume: number) => setInternalVolume1(volume / 100 || 0),
                };
            },
            player2() {
                return {
                    ref: wavesurfer2 || null,
                    setVolume: (volume: number) => setInternalVolume2(volume / 100 || 0),
                };
            },
            seekTo(seekTo: number) {
                if (playerNum === 1) {
                    wavesurfer1?.seekTo(seekTo);
                } else {
                    wavesurfer2?.seekTo(seekTo);
                }
            },
            setVolume(volume: number) {
                setInternalVolume1(volume / 100 || 0);
                setInternalVolume2(volume / 100 || 0);
            },
            setVolume1(volume: number) {
                setInternalVolume1(volume / 100 || 0);
            },
            setVolume2(volume: number) {
                setInternalVolume2(volume / 100 || 0);
            },
        }),
        [wavesurfer1, wavesurfer2, playerNum, internalVolume1, internalVolume2],
    );

    return (
        <div id="wavesurfer-player-engine" style={{ display: 'none' }}>
            {Boolean(src1) && <div id="wavesurfer-player-1" ref={container1Ref} />}
            {Boolean(src2) && <div id="wavesurfer-player-2" ref={container2Ref} />}
        </div>
    );
};

WaveSurferPlayerEngine.displayName = 'WaveSurferPlayerEngine';
