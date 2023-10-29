import { useImperativeHandle, forwardRef, useRef, useState, useCallback, useEffect } from 'react';
import isElectron from 'is-electron';
import type { ReactPlayerProps } from 'react-player';
import ReactPlayer from 'react-player/lazy';
import type { Song } from '/@/renderer/api/types';
import {
    crossfadeHandler,
    gaplessHandler,
} from '/@/renderer/components/audio-player/utils/list-handlers';
import { useSettingsStore } from '/@/renderer/store/settings.store';
import type { CrossfadeStyle } from '/@/renderer/types';
import { PlaybackStyle, PlayerStatus } from '/@/renderer/types';
import { useWebAudio } from '/@/renderer/features/player/hooks/use-webaudio';
import { useSpeed } from '/@/renderer/store';

interface AudioPlayerProps extends ReactPlayerProps {
    crossfadeDuration: number;
    crossfadeStyle: CrossfadeStyle;
    currentPlayer: 1 | 2;
    playbackStyle: PlaybackStyle;
    player1: Song;
    player2: Song;
    status: PlayerStatus;
    volume: number;
}

export type AudioPlayerProgress = {
    loaded: number;
    loadedSeconds: number;
    played: number;
    playedSeconds: number;
};

const getDuration = (ref: any) => {
    return ref.current?.player?.player?.player?.duration;
};

export const AudioPlayer = forwardRef(
    (
        {
            status,
            playbackStyle,
            crossfadeStyle,
            crossfadeDuration,
            currentPlayer,
            autoNext,
            player1,
            player2,
            muted,
            volume,
        }: AudioPlayerProps,
        ref: any,
    ) => {
        const player1Ref = useRef<ReactPlayer>(null);
        const player2Ref = useRef<ReactPlayer>(null);
        const [isTransitioning, setIsTransitioning] = useState(false);
        const audioDeviceId = useSettingsStore((state) => state.playback.audioDeviceId);
        const playback = useSettingsStore((state) => state.playback.mpvProperties);
        const playbackSpeed = useSpeed();

        const { webAudio, setWebAudio } = useWebAudio();
        const [player1Source, setPlayer1Source] = useState<MediaElementAudioSourceNode | null>(
            null,
        );
        const [player2Source, setPlayer2Source] = useState<MediaElementAudioSourceNode | null>(
            null,
        );
        const calculateReplayGain = useCallback(
            (song: Song): number => {
                if (playback.replayGainMode === 'no') {
                    return 1;
                }

                let gain: number | undefined;
                let peak: number | undefined;

                if (playback.replayGainMode === 'track') {
                    gain = song.gain?.track ?? song.gain?.album;
                    peak = song.peak?.track ?? song.peak?.album;
                } else {
                    gain = song.gain?.album ?? song.gain?.track;
                    peak = song.peak?.album ?? song.peak?.track;
                }

                if (gain === undefined) {
                    gain = playback.replayGainFallbackDB;

                    if (!gain) {
                        return 1;
                    }
                }

                if (peak === undefined) {
                    peak = 1;
                }

                const preAmp = playback.replayGainPreampDB ?? 0;

                // https://wiki.hydrogenaud.io/index.php?title=ReplayGain_1.0_specification&section=19
                // Normalized to max gain
                const expectedGain = 10 ** ((gain + preAmp) / 20);

                if (playback.replayGainClip) {
                    return Math.min(expectedGain, 1 / peak);
                }
                return expectedGain;
            },
            [
                playback.replayGainClip,
                playback.replayGainFallbackDB,
                playback.replayGainMode,
                playback.replayGainPreampDB,
            ],
        );

        useEffect(() => {
            if ('AudioContext' in window) {
                const context = new AudioContext({
                    latencyHint: 'playback',
                    sampleRate: playback.audioSampleRateHz || undefined,
                });
                const gain = context.createGain();
                const analyzer = context.createAnalyser();
                gain.connect(analyzer);
                analyzer.connect(context.destination);

                setWebAudio!({ analyzer, context, gain });

                return () => {
                    return context.close();
                };
            }
            return () => {};
            // Intentionally ignore the sample rate dependency, as it makes things really messy
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, []);

        useImperativeHandle(ref, () => ({
            get player1() {
                return player1Ref?.current;
            },
            get player2() {
                return player2Ref?.current;
            },
        }));

        const handleOnEnded = () => {
            autoNext();
            setIsTransitioning(false);
        };

        useEffect(() => {
            if (status === PlayerStatus.PLAYING) {
                if (currentPlayer === 1) {
                    player1Ref.current?.getInternalPlayer()?.play();
                } else {
                    player2Ref.current?.getInternalPlayer()?.play();
                }
            } else {
                player1Ref.current?.getInternalPlayer()?.pause();
                player2Ref.current?.getInternalPlayer()?.pause();
            }
        }, [currentPlayer, status]);

        const handleCrossfade1 = useCallback(
            (e: AudioPlayerProgress) => {
                return crossfadeHandler({
                    currentPlayer,
                    currentPlayerRef: player1Ref,
                    currentTime: e.playedSeconds,
                    duration: getDuration(player1Ref),
                    fadeDuration: crossfadeDuration,
                    fadeType: crossfadeStyle,
                    isTransitioning,
                    nextPlayerRef: player2Ref,
                    player: 1,
                    setIsTransitioning,
                    volume,
                });
            },
            [crossfadeDuration, crossfadeStyle, currentPlayer, isTransitioning, volume],
        );

        const handleCrossfade2 = useCallback(
            (e: AudioPlayerProgress) => {
                return crossfadeHandler({
                    currentPlayer,
                    currentPlayerRef: player2Ref,
                    currentTime: e.playedSeconds,
                    duration: getDuration(player2Ref),
                    fadeDuration: crossfadeDuration,
                    fadeType: crossfadeStyle,
                    isTransitioning,
                    nextPlayerRef: player1Ref,
                    player: 2,
                    setIsTransitioning,
                    volume,
                });
            },
            [crossfadeDuration, crossfadeStyle, currentPlayer, isTransitioning, volume],
        );

        const handleGapless1 = useCallback(
            (e: AudioPlayerProgress) => {
                return gaplessHandler({
                    currentTime: e.playedSeconds,
                    duration: getDuration(player1Ref),
                    isFlac: player1?.container === 'flac',
                    isTransitioning,
                    nextPlayerRef: player2Ref,
                    setIsTransitioning,
                });
            },
            [isTransitioning, player1?.container],
        );

        const handleGapless2 = useCallback(
            (e: AudioPlayerProgress) => {
                return gaplessHandler({
                    currentTime: e.playedSeconds,
                    duration: getDuration(player2Ref),
                    isFlac: player2?.container === 'flac',
                    isTransitioning,
                    nextPlayerRef: player1Ref,
                    setIsTransitioning,
                });
            },
            [isTransitioning, player2?.container],
        );

        useEffect(() => {
            if (isElectron()) {
                if (audioDeviceId) {
                    player1Ref.current?.getInternalPlayer()?.setSinkId(audioDeviceId);
                    player2Ref.current?.getInternalPlayer()?.setSinkId(audioDeviceId);
                } else {
                    player1Ref.current?.getInternalPlayer()?.setSinkId('');
                    player2Ref.current?.getInternalPlayer()?.setSinkId('');
                }
            }
        }, [audioDeviceId]);

        useEffect(() => {
            if (webAudio && player1Source) {
                if (player1 === undefined) {
                    player1Source.disconnect();
                    setPlayer1Source(null);
                } else if (currentPlayer === 1) {
                    webAudio.gain.gain.setValueAtTime(calculateReplayGain(player1), 0);
                }
            }
        }, [calculateReplayGain, currentPlayer, player1, player1Source, webAudio]);

        useEffect(() => {
            if (webAudio && player2Source) {
                if (player2 === undefined) {
                    player2Source.disconnect();
                    setPlayer2Source(null);
                } else if (currentPlayer === 2) {
                    webAudio.gain.gain.setValueAtTime(calculateReplayGain(player2), 0);
                }
            }
        }, [calculateReplayGain, currentPlayer, player2, player2Source, webAudio]);

        const handlePlayer1Start = useCallback(
            async (player: ReactPlayer) => {
                if (!webAudio || player1Source) return;
                if (webAudio.context.state !== 'running') {
                    await webAudio.context.resume();
                }

                const internal = player.getInternalPlayer() as HTMLMediaElement | undefined;
                if (internal) {
                    const { context, gain } = webAudio;
                    const source = context.createMediaElementSource(internal);
                    source.connect(gain);
                    setPlayer1Source(source);
                }
            },
            [player1Source, webAudio],
        );

        const handlePlayer2Start = useCallback(
            async (player: ReactPlayer) => {
                if (!webAudio || player2Source) return;
                if (webAudio.context.state !== 'running') {
                    await webAudio.context.resume();
                }

                const internal = player.getInternalPlayer() as HTMLMediaElement | undefined;
                if (internal) {
                    const { context, gain } = webAudio;
                    const source = context.createMediaElementSource(internal);
                    source.connect(gain);
                    setPlayer2Source(source);
                }
            },
            [player2Source, webAudio],
        );

        return (
            <>
                <ReactPlayer
                    ref={player1Ref}
                    config={{
                        file: { attributes: { crossOrigin: 'anonymous' }, forceAudio: true },
                    }}
                    height={0}
                    muted={muted}
                    playbackRate={playbackSpeed}
                    playing={currentPlayer === 1 && status === PlayerStatus.PLAYING}
                    progressInterval={isTransitioning ? 10 : 250}
                    url={player1?.streamUrl}
                    volume={volume}
                    width={0}
                    onEnded={handleOnEnded}
                    onProgress={
                        playbackStyle === PlaybackStyle.GAPLESS ? handleGapless1 : handleCrossfade1
                    }
                    onReady={handlePlayer1Start}
                />
                <ReactPlayer
                    ref={player2Ref}
                    config={{
                        file: { attributes: { crossOrigin: 'anonymous' }, forceAudio: true },
                    }}
                    height={0}
                    muted={muted}
                    playbackRate={playbackSpeed}
                    playing={currentPlayer === 2 && status === PlayerStatus.PLAYING}
                    progressInterval={isTransitioning ? 10 : 250}
                    url={player2?.streamUrl}
                    volume={volume}
                    width={0}
                    onEnded={handleOnEnded}
                    onProgress={
                        playbackStyle === PlaybackStyle.GAPLESS ? handleGapless2 : handleCrossfade2
                    }
                    onReady={handlePlayer2Start}
                />
            </>
        );
    },
);
