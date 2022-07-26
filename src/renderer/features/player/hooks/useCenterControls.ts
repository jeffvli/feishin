import { useCallback } from 'react';
import { usePlayerStore } from 'renderer/store';
import { PlaybackType, PlayerStatus } from '../../../../types';
import { mpvPlayer } from '../utils/mpvPlayer';

export const useCenterControls = (args: { playersRef: any }) => {
  const { playersRef } = args;

  const settings = usePlayerStore((state) => state.settings);
  const play = usePlayerStore((state) => state.play);
  const pause = usePlayerStore((state) => state.pause);
  const prev = usePlayerStore((state) => state.prev);
  const next = usePlayerStore((state) => state.next);
  const queue = usePlayerStore((state) => state.queue.default);
  const playerStatus = usePlayerStore((state) => state.current.status);
  const currentPlayer = usePlayerStore((state) => state.current.player);
  const currentTime = usePlayerStore((state) => state.current.time);
  const setCurrentTime = usePlayerStore((state) => state.setCurrentTime);

  const player1Ref = playersRef?.current?.player1;
  const player2Ref = playersRef?.current?.player2;
  const currentPlayerRef = currentPlayer === 1 ? player1Ref : player2Ref;
  const nextPlayerRef = currentPlayer === 1 ? player2Ref : player1Ref;

  const resetPlayers = useCallback(() => {
    player1Ref.getInternalPlayer().currentTime = 0;
    player2Ref.getInternalPlayer().currentTime = 0;
    player1Ref.getInternalPlayer().pause();
    player2Ref.getInternalPlayer().pause();
  }, [player1Ref, player2Ref]);

  const resetNextPlayer = useCallback(() => {
    currentPlayerRef.getInternalPlayer().volume = 0.1;
    nextPlayerRef.getInternalPlayer().currentTime = 0;
    nextPlayerRef.getInternalPlayer().pause();
  }, [currentPlayerRef, nextPlayerRef]);

  const stopPlayback = () => {
    player1Ref.getInternalPlayer().pause();
    player2Ref.getInternalPlayer().pause();
    resetPlayers();
  };

  const handlePlay = useCallback(() => {
    if (settings.type === PlaybackType.Local) {
      mpvPlayer.play();
    } else {
      currentPlayerRef.getInternalPlayer().play();
    }

    play();
  }, [currentPlayerRef, play, settings]);

  const handlePause = useCallback(() => {
    if (settings.type === PlaybackType.Local) {
      mpvPlayer.pause();
    }

    pause();
  }, [pause, settings]);

  const handleStop = () => {
    if (settings.type === PlaybackType.Local) {
      mpvPlayer.stop();
    } else {
      stopPlayback();
    }

    setCurrentTime(0);
    pause();
  };

  const handleNextTrack = useCallback(() => {
    const playerData = next();

    if (settings.type === PlaybackType.Local) {
      mpvPlayer.setQueue(playerData);
      mpvPlayer.next();
    } else {
      resetPlayers();
    }

    setCurrentTime(0);
  }, [next, resetPlayers, setCurrentTime, settings]);

  const handlePrevTrack = useCallback(() => {
    const playerData = prev();

    if (settings.type === PlaybackType.Local) {
      mpvPlayer.setQueue(playerData);
      mpvPlayer.previous();
    } else {
      resetPlayers();
    }

    setCurrentTime(0);
  }, [prev, resetPlayers, setCurrentTime, settings]);

  const handlePlayPause = useCallback(() => {
    if (queue) {
      if (playerStatus === PlayerStatus.Paused) {
        return handlePlay();
      }

      return handlePause();
    }

    return null;
  }, [handlePause, handlePlay, playerStatus, queue]);

  const handleSkipBackward = () => {
    const skipBackwardSec = 5;

    if (settings.type === PlaybackType.Local) {
      const newTime = currentTime - skipBackwardSec;
      mpvPlayer.seek(-skipBackwardSec);
      setCurrentTime(newTime < 0 ? 0 : newTime);
    } else {
      const newTime = currentPlayerRef.getCurrentTime() - skipBackwardSec;
      resetNextPlayer();
      setCurrentTime(newTime);
      currentPlayerRef.seekTo(newTime);
    }
  };

  const handleSkipForward = () => {
    const skipForwardSec = 5;

    if (settings.type === PlaybackType.Local) {
      const newTime = currentTime + skipForwardSec;
      mpvPlayer.seek(skipForwardSec);
      setCurrentTime(newTime);
    } else {
      const checkNewTime = currentPlayerRef.getCurrentTime() + skipForwardSec;
      const songDuration = currentPlayerRef.player.player.duration;

      const newTime =
        checkNewTime >= songDuration ? songDuration - 1 : checkNewTime;

      resetNextPlayer();
      setCurrentTime(newTime);
      currentPlayerRef.seekTo(newTime);
    }
  };

  const handleSeekSlider = useCallback(
    (e: number | any) => {
      setCurrentTime(e);

      if (settings.type === PlaybackType.Local) {
        mpvPlayer.seekTo(e);
      } else {
        currentPlayerRef.seekTo(e);
      }
    },
    [currentPlayerRef, setCurrentTime, settings]
  );

  // const handleVolumeSlider = useCallback(
  //   (e: number | any) => {
  //     // dispatch(setVolume(e));
  //     if (settings.type === PlaybackType.Local) {
  //       // playerApi.volume(currentTime, e);
  //     }

  //     setSettings({ volume: (e / 100) ** 2 });
  //   },
  //   [currentTime, setSettings, settings]
  // );

  return {
    handleNextTrack,
    handlePlayPause,
    handlePrevTrack,
    handleSeekSlider,
    handleSkipBackward,
    handleSkipForward,
    handleStop,
  };
};
