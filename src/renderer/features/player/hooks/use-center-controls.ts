import { useCallback, useEffect } from 'react';
import isElectron from 'is-electron';
import { PlaybackType, PlayerStatus } from '@/renderer/types';
import { usePlayerStore } from '../../../store';
import { useSettingsStore } from '../../../store/settings.store';
import { mpvPlayer } from '../utils/mpv-player';

const ipc = isElectron() ? window.electron.ipcRenderer : null;

export const useCenterControls = (args: { playersRef: any }) => {
  const { playersRef } = args;

  const settings = useSettingsStore((state) => state.player);
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

  const isMpvPlayer = isElectron() && settings.type === PlaybackType.LOCAL;

  const handlePlay = useCallback(() => {
    if (isMpvPlayer) {
      mpvPlayer.play();
    } else {
      currentPlayerRef.getInternalPlayer().play();
    }

    play();
  }, [currentPlayerRef, isMpvPlayer, play]);

  const handlePause = useCallback(() => {
    if (isMpvPlayer) {
      mpvPlayer.pause();
    }

    pause();
  }, [isMpvPlayer, pause]);

  const handleStop = () => {
    if (isMpvPlayer) {
      mpvPlayer.stop();
    } else {
      stopPlayback();
    }

    setCurrentTime(0);
    pause();
  };

  const handleNextTrack = useCallback(() => {
    const playerData = next();

    if (isMpvPlayer) {
      mpvPlayer.setQueue(playerData);
      mpvPlayer.next();
    } else {
      resetPlayers();
    }

    setCurrentTime(0);
  }, [isMpvPlayer, next, resetPlayers, setCurrentTime]);

  const handlePrevTrack = useCallback(() => {
    const playerData = prev();

    if (isMpvPlayer) {
      mpvPlayer.setQueue(playerData);
      mpvPlayer.previous();
    } else {
      resetPlayers();
    }

    setCurrentTime(0);
  }, [isMpvPlayer, prev, resetPlayers, setCurrentTime]);

  const handlePlayPause = useCallback(() => {
    if (queue) {
      if (playerStatus === PlayerStatus.PAUSED) {
        return handlePlay();
      }

      return handlePause();
    }

    return null;
  }, [handlePause, handlePlay, playerStatus, queue]);

  const handleSkipBackward = (seconds: number) => {
    if (isMpvPlayer) {
      const newTime = currentTime - seconds;
      mpvPlayer.seek(-seconds);
      setCurrentTime(newTime < 0 ? 0 : newTime);
    } else {
      const newTime = currentPlayerRef?.getCurrentTime() - seconds;
      resetNextPlayer();
      setCurrentTime(newTime);
      currentPlayerRef.seekTo(newTime);
    }
  };

  const handleSkipForward = (seconds: number) => {
    if (isMpvPlayer) {
      const newTime = currentTime + seconds;
      mpvPlayer.seek(seconds);
      setCurrentTime(newTime);
    } else {
      const checkNewTime = currentPlayerRef?.getCurrentTime() + seconds;
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

      if (isMpvPlayer) {
        mpvPlayer.seekTo(e);
      } else {
        currentPlayerRef.seekTo(e);
      }
    },
    [currentPlayerRef, isMpvPlayer, setCurrentTime]
  );

  useEffect(() => {
    ipc?.RENDERER_PLAYER_PLAY_PAUSE(() => {
      const { status } = usePlayerStore.getState().current;
      if (status === PlayerStatus.PAUSED) {
        play();

        if (isMpvPlayer) {
          mpvPlayer.play();
        }
      } else {
        pause();
        if (isMpvPlayer) {
          mpvPlayer.pause();
        }
      }
    });

    ipc?.RENDERER_PLAYER_NEXT(() => {
      const playerData = next();

      if (isMpvPlayer) {
        mpvPlayer.setQueue(playerData);
        mpvPlayer.next();
      }
    });

    ipc?.RENDERER_PLAYER_PREVIOUS(() => {
      const playerData = prev();
      if (isMpvPlayer) {
        mpvPlayer.setQueue(playerData);
        mpvPlayer.previous();
      }
    });

    ipc?.RENDERER_PLAYER_PLAY(() => play());

    ipc?.RENDERER_PLAYER_PAUSE(() => pause());

    ipc?.RENDERER_PLAYER_STOP(() => pause());

    ipc?.RENDERER_PLAYER_CURRENT_TIME((_event, time) => setCurrentTime(time));

    return () => {
      ipc?.removeAllListeners('renderer-player-play-pause');
      ipc?.removeAllListeners('renderer-player-next');
      ipc?.removeAllListeners('renderer-player-previous');
      ipc?.removeAllListeners('renderer-player-play');
      ipc?.removeAllListeners('renderer-player-pause');
      ipc?.removeAllListeners('renderer-player-stop');
      ipc?.removeAllListeners('renderer-player-current-time');
    };
  }, [isMpvPlayer, next, pause, play, prev, setCurrentTime]);

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
