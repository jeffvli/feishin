import { useImperativeHandle, forwardRef, useRef, useState, useCallback, useEffect } from 'react';
import isElectron from 'is-electron';
import type { ReactPlayerProps } from 'react-player';
import ReactPlayer from 'react-player/lazy';
import type { Song } from '/@/renderer/api/types';
import {
    crossfadeHandler,
    gaplessHandler,
} from '/@/renderer/components/audio-player/utils/list-handlers';
import { useSettingsStore, useSettingsStoreActions } from '/@/renderer/store/settings.store';
import type { CrossfadeStyle } from '/@/renderer/types';
import { PlaybackStyle, PlayerStatus } from '/@/renderer/types';
import { useSpeed } from '/@/renderer/store';
import { toast } from '/@/renderer/components/toast';

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

type WebAudio = {
    context: AudioContext;
    gain: GainNode;
};

// Credits: https://gist.github.com/novwhisky/8a1a0168b94f3b6abfaa?permalink_comment_id=1551393#gistcomment-1551393
// This is used so that the player will always have an <audio> element. This means that
// player1Source and player2Source are connected BEFORE the user presses play for
// the first time. This workaround is important for Safari, which seems to require the
// source to be connected PRIOR to resuming audio context
const EMPTY_SOURCE =
    'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU2LjM2LjEwMAAAAAAAAAAAAAAA//OEAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAEAAABIADAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV6urq6urq6urq6urq6urq6urq6urq6urq6v////////////////////////////////8AAAAATGF2YzU2LjQxAAAAAAAAAAAAAAAAJAAAAAAAAAAAASDs90hvAAAAAAAAAAAAAAAAAAAA//MUZAAAAAGkAAAAAAAAA0gAAAAATEFN//MUZAMAAAGkAAAAAAAAA0gAAAAARTMu//MUZAYAAAGkAAAAAAAAA0gAAAAAOTku//MUZAkAAAGkAAAAAAAAA0gAAAAANVVV';

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
        const { resetSampleRate } = useSettingsStoreActions();
        const playbackSpeed = useSpeed();

        const [webAudio, setWebAudio] = useState<WebAudio | null>(null);
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
                let context: AudioContext;

                try {
                    context = new AudioContext({
                        latencyHint: 'playback',
                        sampleRate: playback.audioSampleRateHz || undefined,
                    });
                } catch (error) {
                    // In practice, this should never be hit because the UI should validate
                    // the range. However, the actual supported range is not guaranteed
                    toast.error({ message: (error as Error).message });
                    context = new AudioContext({ latencyHint: 'playback' });
                    resetSampleRate();
                }

                const gain = context.createGain();
                gain.connect(context.destination);

                setWebAudio({ context, gain });

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
                    // calling play() is not necessarily a safe option (https://developer.chrome.com/blog/play-request-was-interrupted)
                    // In practice, this failure is only likely to happen when using the 0-second wav:
                    // play() + play() in rapid succession will cause problems as the frist one ends the track.
                    player1Ref.current
                        ?.getInternalPlayer()
                        ?.play()
                        .catch(() => {});
                } else {
                    player2Ref.current
                        ?.getInternalPlayer()
                        ?.play()
                        .catch(() => {});
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
            // Not standard, just used in chromium-based browsers. See
            // https://developer.chrome.com/blog/audiocontext-setsinkid/.
            // If the isElectron() check is every removed, fix this.
            if (isElectron() && webAudio && 'setSinkId' in webAudio.context) {
                if (audioDeviceId !== 'default') {
                    // @ts-ignore
                    webAudio.context.setSinkId(audioDeviceId);
                } else {
                    // @ts-ignore
                    webAudio.context.setSinkId('');
                }
            }
        }, [audioDeviceId, webAudio]);

        useEffect(() => {
            if (webAudio && player1Source && player1 && currentPlayer === 1) {
                const newVolume = calculateReplayGain(player1) * volume;
                webAudio.gain.gain.setValueAtTime(newVolume, 0);
            }
        }, [calculateReplayGain, currentPlayer, player1, player1Source, volume, webAudio]);

        useEffect(() => {
            if (webAudio && player2Source && player2 && currentPlayer === 2) {
                const newVolume = calculateReplayGain(player2) * volume;
                webAudio.gain.gain.setValueAtTime(newVolume, 0);
            }
        }, [calculateReplayGain, currentPlayer, player2, player2Source, volume, webAudio]);

        const handlePlayer1Start = useCallback(
            async (player: ReactPlayer) => {
                if (!webAudio) return;
                if (player1Source) {
                    // This should fire once, only if the source is real (meaning we
                    // saw the dummy source) and the context is not ready
                    if (webAudio.context.state !== 'running') {
                        await webAudio.context.resume();
                    }
                    return;
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
                if (!webAudio) return;
                if (player2Source) {
                    if (webAudio.context.state !== 'running') {
                        await webAudio.context.resume();
                    }
                    return;
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

        // Bugfix for Safari: rather than use the `<audio>` volume (which doesn't work),
        // use the GainNode to scale the volume. In this case, for compatibility with
        // other browsers, set the `<audio>` volume to 1
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
                    url={player1?.streamUrl || EMPTY_SOURCE}
                    volume={webAudio ? 1 : volume}
                    width={0}
                    // If there is no stream url, we do not need to handle when the audio finishes
                    onEnded={player1?.streamUrl ? handleOnEnded : undefined}
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
                    url={player2?.streamUrl || EMPTY_SOURCE}
                    volume={webAudio ? 1 : volume}
                    width={0}
                    onEnded={player2?.streamUrl ? handleOnEnded : undefined}
                    onProgress={
                        playbackStyle === PlaybackStyle.GAPLESS ? handleGapless2 : handleCrossfade2
                    }
                    onReady={handlePlayer2Start}
                />
            </>
        );
    },
);
