import { useImperativeHandle, forwardRef, useRef, useState, useCallback, useEffect } from 'react';
import isElectron from 'is-electron';
import type { ReactPlayerProps } from 'react-player';
import ReactPlayer from 'react-player';
import type { Song } from '/@/renderer/api/types';
import {
  crossfadeHandler,
  gaplessHandler,
} from '/@/renderer/components/audio-player/utils/list-handlers';
import { useSettingsStore } from '/@/renderer/store/settings.store';
import type { CrossfadeStyle } from '/@/renderer/types';
import { PlaybackStyle, PlayerStatus } from '/@/renderer/types';

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
    const player1Ref = useRef<any>(null);
    const player2Ref = useRef<any>(null);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const audioDeviceId = useSettingsStore((state) => state.playback.audioDeviceId);

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

    return (
      <>
        <ReactPlayer
          ref={player1Ref}
          height={0}
          muted={muted}
          playing={currentPlayer === 1 && status === PlayerStatus.PLAYING}
          progressInterval={isTransitioning ? 10 : 250}
          url={player1?.streamUrl}
          volume={volume}
          width={0}
          onEnded={handleOnEnded}
          onProgress={playbackStyle === PlaybackStyle.GAPLESS ? handleGapless1 : handleCrossfade1}
        />
        <ReactPlayer
          ref={player2Ref}
          height={0}
          muted={muted}
          playing={currentPlayer === 2 && status === PlayerStatus.PLAYING}
          progressInterval={isTransitioning ? 10 : 250}
          url={player2?.streamUrl}
          volume={volume}
          width={0}
          onEnded={handleOnEnded}
          onProgress={playbackStyle === PlaybackStyle.GAPLESS ? handleGapless2 : handleCrossfade2}
        />
      </>
    );
  },
);
