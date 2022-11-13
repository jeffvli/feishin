import { useCallback, useEffect } from 'react';
import isElectron from 'is-electron';
import {
  PlaybackType,
  PlayerRepeat,
  PlayerShuffle,
  PlayerStatus,
} from '@/renderer/types';
import { usePlayerStore } from '../../../store';
import { useSettingsStore } from '../../../store/settings.store';
import { mpvPlayer } from '../utils/mpv-player';

const ipc = isElectron() ? window.electron.ipcRenderer : null;

export const useCenterControls = (args: { playersRef: any }) => {
  const { playersRef } = args;

  const settings = useSettingsStore((state) => state.player);
  const setShuffle = usePlayerStore((state) => state.setShuffle);
  const setRepeat = usePlayerStore((state) => state.setRepeat);
  const play = usePlayerStore((state) => state.play);
  const pause = usePlayerStore((state) => state.pause);
  const prev = usePlayerStore((state) => state.prev);
  const next = usePlayerStore((state) => state.next);
  const setCurrentIndex = usePlayerStore((state) => state.setCurrentIndex);
  const autoNext = usePlayerStore((state) => state.autoNext);
  const queue = usePlayerStore((state) => state.queue.default);
  const playerStatus = usePlayerStore((state) => state.current.status);
  const currentPlayer = usePlayerStore((state) => state.current.player);
  const repeat = usePlayerStore((state) => state.repeat);
  const shuffle = usePlayerStore((state) => state.shuffle);
  const playerType = useSettingsStore((state) => state.player.type);

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
    if (shuffle === PlayerShuffle.NONE) {
      const playerData = setShuffle(PlayerShuffle.TRACK);
      return mpvPlayer.setQueueNext(playerData);
    }

    const playerData = setShuffle(PlayerShuffle.NONE);
    return mpvPlayer.setQueueNext(playerData);
  }, [setShuffle, shuffle]);

  const handleToggleRepeat = useCallback(() => {
    if (repeat === PlayerRepeat.NONE) {
      const playerData = setRepeat(PlayerRepeat.ALL);
      return mpvPlayer.setQueueNext(playerData);
    }

    if (repeat === PlayerRepeat.ALL) {
      const playerData = setRepeat(PlayerRepeat.ONE);
      return mpvPlayer.setQueueNext(playerData);
    }

    return setRepeat(PlayerRepeat.NONE);
  }, [repeat, setRepeat]);

  const checkIsLastTrack = useCallback(() => {
    return usePlayerStore.getState().checkIsLastTrack();
  }, []);

  const checkIsFirstTrack = useCallback(() => {
    return usePlayerStore.getState().checkIsFirstTrack();
  }, []);

  const handleAutoNext = useCallback(() => {
    const isLastTrack = checkIsLastTrack();

    const handleRepeatAll = {
      local: () => {
        const playerData = autoNext();
        mpvPlayer.playerAutoNext(playerData);
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
          mpvPlayer.playerAutoNext(playerData);
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
        mpvPlayer.playerAutoNext(playerData);
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

    switch (repeat) {
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
    repeat,
    resetPlayers,
    setCurrentIndex,
  ]);

  const handleNextTrack = useCallback(() => {
    const isLastTrack = checkIsLastTrack();

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

    switch (repeat) {
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
    repeat,
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
      if (isMpvPlayer) {
        return mpvPlayer.seekTo(0);
      }
      return currentPlayerRef.seekTo(0);
    }

    const isFirstTrack = checkIsFirstTrack();

    const handleRepeatAll = {
      local: () => {
        if (!isFirstTrack) {
          const playerData = prev();
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
          prev();
          resetPlayers();
        }
      },
    };

    const handleRepeatNone = {
      local: () => {
        const playerData = prev();
        mpvPlayer.setQueue(playerData);
        mpvPlayer.previous();
      },
      web: () => {
        if (isFirstTrack) {
          resetPlayers();
          pause();
        } else {
          prev();
          resetPlayers();
        }
      },
    };

    const handleRepeatOne = {
      local: () => {
        if (!isFirstTrack) {
          const playerData = prev();
          mpvPlayer.setQueue(playerData);
          mpvPlayer.previous();
        } else {
          mpvPlayer.stop();
        }
      },
      web: () => {
        prev();
        resetPlayers();
      },
    };

    switch (repeat) {
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
    prev,
    queue.length,
    repeat,
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
      handlePlayPause();
    });

    ipc?.RENDERER_PLAYER_NEXT(() => {
      handleNextTrack();
    });

    ipc?.RENDERER_PLAYER_PREVIOUS(() => {
      handlePrevTrack();
    });

    ipc?.RENDERER_PLAYER_PLAY(() => handlePlay());

    ipc?.RENDERER_PLAYER_PAUSE(() => handlePause());

    ipc?.RENDERER_PLAYER_STOP(() => handleStop());

    ipc?.RENDERER_PLAYER_CURRENT_TIME((_event, time) => setCurrentTime(time));

    ipc?.RENDERER_PLAYER_AUTO_NEXT(() => {
      handleAutoNext();
    });

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
    prev,
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
