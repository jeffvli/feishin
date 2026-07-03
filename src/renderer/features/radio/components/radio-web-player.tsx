import type ReactPlayer from 'react-player';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
    WebPlayerEngine,
    WebPlayerEngineHandle,
} from '/@/renderer/features/player/audio-player/engine/web-player-engine';
import { useWebAudio } from '/@/renderer/features/player/hooks/use-webaudio';
import {
    useIsRadioActive,
    useRadioPlayer,
    useRadioStore,
} from '/@/renderer/features/radio/hooks/use-radio-player';
import { usePlaybackSettings, usePlayerMuted, usePlayerVolume } from '/@/renderer/store';
import { toast } from '/@/shared/components/toast/toast';
import { PlayerStatus } from '/@/shared/types/types';

export function RadioWebPlayer() {
    const playerRef = useRef<null | WebPlayerEngineHandle>(null);
    const { currentStreamUrl, isPlaying } = useRadioPlayer();
    const { actions } = useRadioStore();
    const { setCurrentStreamUrl, setIsPlaying, setStationName } = actions;
    const isRadioActive = useIsRadioActive();
    const isMuted = usePlayerMuted();
    const volume = usePlayerVolume();
    const { preservePitch } = usePlaybackSettings();
    const { webAudio } = useWebAudio();

    const [playerStatus, setPlayerStatus] = useState<PlayerStatus>(
        isPlaying ? PlayerStatus.PLAYING : PlayerStatus.PAUSED,
    );
    const [player1Source, setPlayer1Source] = useState<MediaElementAudioSourceNode | null>(null);
    const processedMediaElementRef = useRef<HTMLMediaElement | null>(null);
    const player1SourceRef = useRef<MediaElementAudioSourceNode | null>(null);

    useEffect(() => {
        player1SourceRef.current = player1Source;
    }, [player1Source]);

    useEffect(() => {
        setPlayerStatus(isPlaying ? PlayerStatus.PLAYING : PlayerStatus.PAUSED);
    }, [isPlaying]);

    // Cleanup source only on unmount
    useEffect(() => {
        return () => {
            if (player1SourceRef.current) {
                try {
                    player1SourceRef.current.disconnect();
                } catch {
                    // Ignore disconnect errors
                }
                setPlayer1Source(null);
                processedMediaElementRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (!webAudio || !player1Source) return;

        const linearVolume = volume / 100;
        const gainValue = isMuted ? 0 : linearVolume;

        try {
            webAudio.gains[0].gain.setValueAtTime(gainValue, 0);
        } catch (error) {
            console.error('Error setting radio volume gain', error);
        }
    }, [volume, isMuted, webAudio, player1Source]);

    const handlePlayer1Start = useCallback(
        async (player: ReactPlayer) => {
            if (!webAudio) return;

            const internal = player.getInternalPlayer() as HTMLMediaElement | undefined;
            if (!internal) return;

            // If we've already processed this exact media element, reuse the existing source
            if (processedMediaElementRef.current === internal && player1Source) {
                // Ensure it's still connected to the gain node
                try {
                    if (!player1Source.context) {
                        const { gains } = webAudio;
                        player1Source.connect(gains[0]);
                    }
                } catch {
                    // Already connected, which is what we want
                }
                return;
            }

            if (currentStreamUrl) {
                if (webAudio.context.state !== 'running') {
                    await webAudio.context.resume();
                }
            }

            try {
                const { context, gains } = webAudio;
                const source = context.createMediaElementSource(internal);
                source.connect(gains[0]);
                setPlayer1Source(source);
                processedMediaElementRef.current = internal;
            } catch {
                processedMediaElementRef.current = internal;

                if (webAudio && webAudio.gains[0]) {
                    const linearVolume = volume / 100;
                    const gainValue = isMuted ? 0 : linearVolume;
                    webAudio.gains[0].gain.setValueAtTime(gainValue, 0);
                }
            }
        },
        [player1Source, currentStreamUrl, webAudio, volume, isMuted],
    );

    const onProgressPlayer1 = useCallback(() => {
        // We don't need to handle progress for radio streams
    }, []);

    const onEndedPlayer1 = useCallback(() => {
        console.error('Radio stream ended unexpectedly');
        setIsPlaying(false);
        setCurrentStreamUrl(null);
        setStationName(null);
        toast.error({ message: 'Radio stream ended unexpectedly' });
    }, [setIsPlaying, setCurrentStreamUrl, setStationName]);

    if (!isRadioActive) {
        return null;
    }

    return (
        <WebPlayerEngine
            isMuted={isMuted}
            isTransitioning={false}
            loopPlayer1={false}
            loopPlayer2={false}
            onEndedPlayer1={onEndedPlayer1}
            onEndedPlayer2={() => {}}
            onErrorPause={() => {}}
            onProgressPlayer1={onProgressPlayer1}
            onProgressPlayer2={() => {}}
            onStartedPlayer1={handlePlayer1Start}
            onStartedPlayer2={() => {}}
            playerNum={1}
            playerRef={playerRef}
            playerStatus={playerStatus}
            preservesPitch={preservePitch}
            speed={1}
            src1={currentStreamUrl || undefined}
            src2={undefined}
            volume={volume}
        />
    );
}
