import { useCallback, useEffect } from 'react';
import isElectron from 'is-electron';
import { PlaybackType, PlayerRepeat, PlayerShuffle, PlayerStatus } from '/@/renderer/types';
import {
  useCurrentPlayer,
  useCurrentStatus,
  useDefaultQueue,
  usePlayerControls,
  usePlayerStore,
  useRepeatStatus,
  useSetCurrentTime,
  useShuffleStatus,
} from '/@/renderer/store';
import { useSettingsStore } from '/@/renderer/store/settings.store';

const mpvPlayer = window.electron.mpvPlayer;
const mpvPlayerListener = window.electron.mpvPlayerListener;
const ipc = window.electron.ipc;

export const useCenterControls = (args: { playersRef: any }) => {
  const { playersRef } = args;

  const settings = useSettingsStore((state) => state.player);
  const currentPlayer = useCurrentPlayer();
  const { setShuffle, setRepeat, play, pause, previous, next, setCurrentIndex, autoNext } =
    usePlayerControls();
  const setCurrentTime = useSetCurrentTime();
  const queue = useDefaultQueue();
  const playerStatus = useCurrentStatus();
  const repeatStatus = useRepeatStatus();
  const shuffleStatus = useShuffleStatus();
  const playerType = useSettingsStore((state) => state.player.type);
  const player1Ref = playersRef?.current?.player1;
  const player2Ref = playersRef?.current?.player2;
  const currentPlayerRef = currentPlayer === 1 ? player1Ref : player2Ref;
  const nextPlayerRef = currentPlayer === 1 ? player2Ref : player1Ref;

  const resetPlayers = useCallback(() => {
    if (player1Ref.getInternalPlayer()) {
      player1Ref.getInternalPlayer().currentTime = 0;
      player1Ref.getInternalPlayer().pause();
    }

    if (player2Ref.getInternalPlayer()) {
      player2Ref.getInternalPlayer().currentTime = 0;
      player2Ref.getInternalPlayer().pause();
    }
  }, [player1Ref, player2Ref]);

  const resetNextPlayer = useCallback(() => {
    currentPlayerRef.getInternalPlayer().volume = 0.1;
    nextPlayerRef.getInternalPlayer().currentTime = 0;
    nextPlayerRef.getInternalPlayer().pause();
  }, [currentPlayerRef, nextPlayerRef]);

  const stopPlayback = useCallback(() => {
    player1Ref.getInternalPlayer().pause();
    player2Ref.getInternalPlayer().pause();
    resetPlayers();
  }, [player1Ref, player2Ref, resetPlayers]);

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

  const handleStop = useCallback(() => {
    if (isMpvPlayer) {
      mpvPlayer.stop();
    } else {
      stopPlayback();
    }

    setCurrentTime(0);
    pause();
  }, [isMpvPlayer, pause, setCurrentTime, stopPlayback]);

  const handleToggleShuffle = useCallback(() => {
    if (shuffleStatus === PlayerShuffle.NONE) {
      const playerData = setShuffle(PlayerShuffle.TRACK);
      return mpvPlayer.setQueueNext(playerData);
    }

    const playerData = setShuffle(PlayerShuffle.NONE);
    return mpvPlayer.setQueueNext(playerData);
  }, [setShuffle, shuffleStatus]);

  const handleToggleRepeat = useCallback(() => {
    if (repeatStatus === PlayerRepeat.NONE) {
      const playerData = setRepeat(PlayerRepeat.ALL);
      return mpvPlayer.setQueueNext(playerData);
    }

    if (repeatStatus === PlayerRepeat.ALL) {
      const playerData = setRepeat(PlayerRepeat.ONE);
      return mpvPlayer.setQueueNext(playerData);
    }

    return setRepeat(PlayerRepeat.NONE);
  }, [repeatStatus, setRepeat]);

  const checkIsLastTrack = useCallback(() => {
    return usePlayerStore.getState().actions.checkIsLastTrack();
  }, []);

  const checkIsFirstTrack = useCallback(() => {
    return usePlayerStore.getState().actions.checkIsFirstTrack();
  }, []);

  const handleAutoNext = useCallback(() => {
    const isLastTrack = checkIsLastTrack();

    const handleRepeatAll = {
      local: () => {
        const playerData = autoNext();
        mpvPlayer.autoNext(playerData);
        play();
      },
      web: () => {
        autoNext();
      },
    };

    const handleRepeatNone = {
      local: () => {
        if (isLastTrack) {
          const playerData = setCurrentIndex(0);
          mpvPlayer.setQueue(playerData);
          mpvPlayer.pause();
          pause();
        } else {
          const playerData = autoNext();
          mpvPlayer.autoNext(playerData);
          play();
        }
      },
      web: () => {
        if (isLastTrack) {
          resetPlayers();
          pause();
        } else {
          autoNext();
          resetPlayers();
        }
      },
    };

    const handleRepeatOne = {
      local: () => {
        const playerData = autoNext();
        mpvPlayer.autoNext(playerData);
        play();
      },
      web: () => {
        if (isLastTrack) {
          resetPlayers();
        } else {
          autoNext();
          resetPlayers();
        }
      },
    };

    switch (repeatStatus) {
      case PlayerRepeat.NONE:
        handleRepeatNone[playerType]();
        break;
      case PlayerRepeat.ALL:
        handleRepeatAll[playerType]();
        break;
      case PlayerRepeat.ONE:
        handleRepeatOne[playerType]();
        break;

      default:
        break;
    }
  }, [
    autoNext,
    checkIsLastTrack,
    pause,
    play,
    playerType,
    repeatStatus,
    resetPlayers,
    setCurrentIndex,
  ]);

  const handleNextTrack = useCallback(() => {
    const isLastTrack = checkIsLastTrack();
    setCurrentTime(0);

    const handleRepeatAll = {
      local: () => {
        const playerData = next();
        mpvPlayer.setQueue(playerData);
        mpvPlayer.next();
      },
      web: () => {
        next();
      },
    };

    const handleRepeatNone = {
      local: () => {
        if (isLastTrack) {
          const playerData = setCurrentIndex(0);
          mpvPlayer.setQueue(playerData);
          mpvPlayer.pause();
          pause();
        } else {
          const playerData = next();
          mpvPlayer.setQueue(playerData);
          mpvPlayer.next();
        }
      },
      web: () => {
        if (isLastTrack) {
          setCurrentIndex(0);
          resetPlayers();
          pause();
        } else {
          next();
          resetPlayers();
        }
      },
    };

    const handleRepeatOne = {
      local: () => {
        const playerData = next();
        mpvPlayer.setQueue(playerData);
        mpvPlayer.next();
      },
      web: () => {
        if (!isLastTrack) {
          next();
        }
      },
    };

    switch (repeatStatus) {
      case PlayerRepeat.NONE:
        handleRepeatNone[playerType]();
        break;
      case PlayerRepeat.ALL:
        handleRepeatAll[playerType]();
        break;
      case PlayerRepeat.ONE:
        handleRepeatOne[playerType]();
        break;

      default:
        break;
    }

    setCurrentTime(0);
  }, [
    checkIsLastTrack,
    next,
    pause,
    playerType,
    repeatStatus,
    resetPlayers,
    setCurrentIndex,
    setCurrentTime,
  ]);

  const handlePrevTrack = useCallback(() => {
    const currentTime = isMpvPlayer
      ? usePlayerStore.getState().current.time
      : currentPlayerRef.getCurrentTime();

    // Reset the current track more than 10 seconds have elapsed
    if (currentTime >= 10) {
      setCurrentTime(0);

      if (isMpvPlayer) {
        return mpvPlayer.seekTo(0);
      }
      return currentPlayerRef.seekTo(0);
    }

    const isFirstTrack = checkIsFirstTrack();

    const handleRepeatAll = {
      local: () => {
        if (!isFirstTrack) {
          const playerData = previous();
          mpvPlayer.setQueue(playerData);
          mpvPlayer.previous();
        } else {
          const playerData = setCurrentIndex(queue.length - 1);
          mpvPlayer.setQueue(playerData);
          mpvPlayer.previous();
        }
      },
      web: () => {
        if (isFirstTrack) {
          setCurrentIndex(queue.length - 1);
          resetPlayers();
        } else {
          previous();
          resetPlayers();
        }
      },
    };

    const handleRepeatNone = {
      local: () => {
        const playerData = previous();
        mpvPlayer.setQueue(playerData);
        mpvPlayer.previous();
      },
      web: () => {
        if (isFirstTrack) {
          resetPlayers();
          pause();
        } else {
          previous();
          resetPlayers();
        }
      },
    };

    const handleRepeatOne = {
      local: () => {
        if (!isFirstTrack) {
          const playerData = previous();
          mpvPlayer.setQueue(playerData);
          mpvPlayer.previous();
        } else {
          mpvPlayer.stop();
        }
      },
      web: () => {
        previous();
        resetPlayers();
      },
    };

    switch (repeatStatus) {
      case PlayerRepeat.NONE:
        handleRepeatNone[playerType]();
        break;
      case PlayerRepeat.ALL:
        handleRepeatAll[playerType]();
        break;
      case PlayerRepeat.ONE:
        handleRepeatOne[playerType]();
        break;

      default:
        break;
    }

    return setCurrentTime(0);
  }, [
    checkIsFirstTrack,
    currentPlayerRef,
    isMpvPlayer,
    pause,
    playerType,
    previous,
    queue.length,
    repeatStatus,
    resetPlayers,
    setCurrentIndex,
    setCurrentTime,
  ]);

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
    const currentTime = isMpvPlayer
      ? usePlayerStore.getState().current.time
      : currentPlayerRef.getCurrentTime();

    if (isMpvPlayer) {
      const newTime = currentTime - seconds;
      mpvPlayer.seek(-seconds);
      setCurrentTime(newTime < 0 ? 0 : newTime);
    } else {
      const newTime = currentTime - seconds;
      resetNextPlayer();
      setCurrentTime(newTime);
      currentPlayerRef.seekTo(newTime);
    }
  };

  const handleSkipForward = (seconds: number) => {
    const currentTime = isMpvPlayer
      ? usePlayerStore.getState().current.time
      : currentPlayerRef.getCurrentTime();

    if (isMpvPlayer) {
      const newTime = currentTime + seconds;
      mpvPlayer.seek(seconds);
      setCurrentTime(newTime);
    } else {
      const checkNewTime = currentTime + seconds;
      const songDuration = currentPlayerRef.player.player.duration;

      const newTime = checkNewTime >= songDuration ? songDuration - 1 : checkNewTime;

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
    [currentPlayerRef, isMpvPlayer, setCurrentTime],
  );

  useEffect(() => {
    if (isElectron()) {
      mpvPlayerListener.rendererPlayPause(() => {
        handlePlayPause();
      });

      mpvPlayerListener.rendererNext(() => {
        handleNextTrack();
      });

      mpvPlayerListener.rendererPrevious(() => {
        handlePrevTrack();
      });

      mpvPlayerListener.rendererPlay(() => {
        handlePlay();
      });

      mpvPlayerListener.rendererPause(() => {
        handlePause();
      });

      mpvPlayerListener.rendererStop(() => {
        handleStop();
      });

      mpvPlayerListener.rendererCurrentTime((_event: any, time: number) => {
        setCurrentTime(time);
      });

      mpvPlayerListener.rendererAutoNext(() => {
        handleAutoNext();
      });
    }

    return () => {
      ipc?.removeAllListeners('renderer-player-play-pause');
      ipc?.removeAllListeners('renderer-player-next');
      ipc?.removeAllListeners('renderer-player-previous');
      ipc?.removeAllListeners('renderer-player-play');
      ipc?.removeAllListeners('renderer-player-pause');
      ipc?.removeAllListeners('renderer-player-stop');
      ipc?.removeAllListeners('renderer-player-current-time');
      ipc?.removeAllListeners('renderer-player-auto-next');
    };
  }, [
    autoNext,
    handleAutoNext,
    handleNextTrack,
    handlePause,
    handlePlay,
    handlePlayPause,
    handlePrevTrack,
    handleStop,
    isMpvPlayer,
    next,
    pause,
    play,
    previous,
    setCurrentTime,
  ]);

  return {
    handleNextTrack,
    handlePlayPause,
    handlePrevTrack,
    handleSeekSlider,
    handleSkipBackward,
    handleSkipForward,
    handleStop,
    handleToggleRepeat,
    handleToggleShuffle,
  };
};
