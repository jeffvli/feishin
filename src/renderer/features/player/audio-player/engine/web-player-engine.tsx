import type { RefObject } from 'react';

import { useImperativeHandle, useRef, useState } from 'react';
import ReactPlayer from 'react-player';

import { AudioPlayer, PlayerOnProgressProps } from '/@/renderer/features/player/audio-player/types';
import { convertToLogVolume } from '/@/renderer/features/player/audio-player/utils/player-utils';
import { PlayerStatus } from '/@/shared/types/types';

export interface WebPlayerEngineHandle extends AudioPlayer {
    player1(): {
        ref: null | ReactPlayer;
        setVolume: (volume: number) => void;
    };
    player2(): {
        ref: null | ReactPlayer;
        setVolume: (volume: number) => void;
    };
}

interface WebPlayerEngineProps {
    isMuted: boolean;
    isTransitioning: boolean;
    onEndedPlayer1: () => void;
    onEndedPlayer2: () => void;
    onProgressPlayer1: (e: PlayerOnProgressProps) => void;
    onProgressPlayer2: (e: PlayerOnProgressProps) => void;
    playerNum: number;
    playerRef: RefObject<null | WebPlayerEngineHandle>;
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

export const WebPlayerEngine = (props: WebPlayerEngineProps) => {
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

    const player1Ref = useRef<null | ReactPlayer>(null);
    const player2Ref = useRef<null | ReactPlayer>(null);

    const [internalVolume1, setInternalVolume1] = useState(volume / 100 || 0);
    const [internalVolume2, setInternalVolume2] = useState(volume / 100 || 0);

    useImperativeHandle<WebPlayerEngineHandle, WebPlayerEngineHandle>(playerRef, () => ({
        decreaseVolume(by: number) {
            setInternalVolume1(Math.max(0, internalVolume1 - by / 100));
            setInternalVolume2(Math.max(0, internalVolume2 - by / 100));
        },
        increaseVolume(by: number) {
            setInternalVolume1(Math.min(1, internalVolume1 + by / 100));
            setInternalVolume2(Math.min(1, internalVolume2 + by / 100));
        },
        pause() {
            player1Ref.current?.getInternalPlayer()?.pause();
            player2Ref.current?.getInternalPlayer()?.pause();
        },
        play() {
            if (playerNum === 1) {
                player1Ref.current?.getInternalPlayer()?.play();
            } else {
                player2Ref.current?.getInternalPlayer()?.play();
            }
        },
        player1() {
            return {
                ref: player1Ref?.current,
                setVolume: (volume: number) => setInternalVolume1(volume / 100 || 0),
            };
        },
        player2() {
            return {
                ref: player2Ref?.current,
                setVolume: (volume: number) => setInternalVolume2(volume / 100 || 0),
            };
        },
        seekTo(seekTo: number) {
            playerNum === 1
                ? player1Ref.current?.seekTo(seekTo)
                : player2Ref.current?.seekTo(seekTo);
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
    }));

    const volume1 = convertToLogVolume(internalVolume1);
    const volume2 = convertToLogVolume(internalVolume2);

    return (
        <div id="web-player-engine" style={{ display: 'none' }}>
            {Boolean(src1) && (
                <ReactPlayer
                    config={{
                        file: { attributes: { crossOrigin: 'anonymous' }, forceAudio: true },
                    }}
                    controls={false}
                    height={0}
                    id="web-player-1"
                    muted={isMuted}
                    onEnded={src1 ? () => onEndedPlayer1() : undefined}
                    onProgress={onProgressPlayer1}
                    playbackRate={speed || 1}
                    playing={playerNum === 1 && playerStatus === PlayerStatus.PLAYING}
                    progressInterval={isTransitioning ? 10 : 250}
                    ref={player1Ref}
                    url={src1 || EMPTY_SOURCE}
                    volume={volume1}
                    width={0}
                />
            )}
            {Boolean(src2) && (
                <ReactPlayer
                    config={{
                        file: { attributes: { crossOrigin: 'anonymous' }, forceAudio: true },
                    }}
                    controls={false}
                    height={0}
                    id="web-player-2"
                    muted={isMuted}
                    onEnded={src2 ? () => onEndedPlayer2() : undefined}
                    onProgress={onProgressPlayer2}
                    playbackRate={speed || 1}
                    playing={playerNum === 2 && playerStatus === PlayerStatus.PLAYING}
                    progressInterval={isTransitioning ? 10 : 250}
                    ref={player2Ref}
                    url={src2 || EMPTY_SOURCE}
                    volume={volume2}
                    width={0}
                />
            )}
        </div>
    );
};

WebPlayerEngine.displayName = 'WebPlayerEngine';
