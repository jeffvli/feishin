// import { write, writeFile } from 'fs';
// import { deflate } from 'zlib';
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
import { usePlayerType, useSettingsStore } from '/@/renderer/store/settings.store';
import { useScrobble } from '/@/renderer/features/player/hooks/use-scrobble';
import debounce from 'lodash/debounce';
import { QueueSong } from '/@/renderer/api/types';
import { toast } from '/@/renderer/components';

const mpvPlayer = isElectron() ? window.electron.mpvPlayer : null;
const mpvPlayerListener = isElectron() ? window.electron.mpvPlayerListener : null;
const ipc = isElectron() ? window.electron.ipc : null;
const utils = isElectron() ? window.electron.utils : null;
const mpris = isElectron() && utils?.isLinux() ? window.electron.mpris : null;

export const useCenterControls = (args: { playersRef: any }) => {
  const { playersRef } = args;

  const settings = useSettingsStore((state) => state.playback);
  const currentPlayer = useCurrentPlayer();
  const { setShuffle, setRepeat, play, pause, previous, next, setCurrentIndex, autoNext } =
    usePlayerControls();
  const setCurrentTime = useSetCurrentTime();
  const queue = useDefaultQueue();
  const playerStatus = useCurrentStatus();
  const repeatStatus = useRepeatStatus();
  const shuffleStatus = useShuffleStatus();
  const playerType = usePlayerType();
  const player1Ref = playersRef?.current?.player1;
  const player2Ref = playersRef?.current?.player2;
  const currentPlayerRef = currentPlayer === 1 ? player1Ref : player2Ref;
  const nextPlayerRef = currentPlayer === 1 ? player2Ref : player1Ref;

  const { handleScrobbleFromSongRestart, handleScrobbleFromSeek } = useScrobble();

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

  const mprisUpdateSong = (args?: {
    currentTime?: number;
    song?: QueueSong;
    status?: PlayerStatus;
  }) => {
    const { song, currentTime, status } = args || {};
    mpris?.updateSong({
      currentTime: currentTime || usePlayerStore.getState().current.time,
      repeat: usePlayerStore.getState().repeat,
      shuffle: usePlayerStore.getState().shuffle,
      song: song || usePlayerStore.getState().current.song,
      status:
        (status || usePlayerStore.getState().current.status) === PlayerStatus.PLAYING
          ? 'Playing'
          : 'Paused',
    });
  };

  const handlePlay = useCallback(() => {
    mprisUpdateSong({ status: PlayerStatus.PLAYING });

    if (isMpvPlayer) {
      mpvPlayer?.volume(usePlayerStore.getState().volume);
      mpvPlayer.play();
    } else {
      currentPlayerRef.getInternalPlayer().play();
    }

    play();
  }, [currentPlayerRef, isMpvPlayer, play]);

  const handlePause = useCallback(() => {
    mprisUpdateSong({ status: PlayerStatus.PAUSED });

    if (isMpvPlayer) {
      mpvPlayer.pause();
    }

    pause();
  }, [isMpvPlayer, pause]);

  const handleStop = useCallback(() => {
    mprisUpdateSong({ status: PlayerStatus.PAUSED });

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
      mpris?.updateShuffle(true);
      return mpvPlayer.setQueueNext(playerData);
    }

    const playerData = setShuffle(PlayerShuffle.NONE);
    mpris?.updateShuffle(false);
    return mpvPlayer.setQueueNext(playerData);
  }, [setShuffle, shuffleStatus]);

  const handleToggleRepeat = useCallback(() => {
    if (repeatStatus === PlayerRepeat.NONE) {
      const playerData = setRepeat(PlayerRepeat.ALL);
      mpris?.updateRepeat('Playlist');
      return mpvPlayer.setQueueNext(playerData);
    }

    if (repeatStatus === PlayerRepeat.ALL) {
      const playerData = setRepeat(PlayerRepeat.ONE);
      mpris?.updateRepeat('Track');
      return mpvPlayer.setQueueNext(playerData);
    }

    mpris?.updateRepeat('None');
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
        mprisUpdateSong({ song: playerData.current.song, status: PlayerStatus.PLAYING });
        mpvPlayer.autoNext(playerData);
        play();
      },
      web: () => {
        const playerData = autoNext();
        mprisUpdateSong({ song: playerData.current.song, status: PlayerStatus.PLAYING });
      },
    };

    const handleRepeatNone = {
      local: () => {
        if (isLastTrack) {
          const playerData = setCurrentIndex(0);
          mprisUpdateSong({ song: playerData.current.song, status: PlayerStatus.PAUSED });
          mpvPlayer.setQueue(playerData);
          mpvPlayer.pause();
          pause();
        } else {
          const playerData = autoNext();
          mprisUpdateSong({ song: playerData.current.song, status: PlayerStatus.PLAYING });
          mpvPlayer.autoNext(playerData);
          play();
        }
      },
      web: () => {
        if (isLastTrack) {
          resetPlayers();
          mprisUpdateSong({ status: PlayerStatus.PAUSED });
          pause();
        } else {
          const playerData = autoNext();
          mprisUpdateSong({ song: playerData.current.song, status: PlayerStatus.PLAYING });
          resetPlayers();
        }
      },
    };

    const handleRepeatOne = {
      local: () => {
        const playerData = autoNext();
        mprisUpdateSong({ song: playerData.current.song, status: PlayerStatus.PLAYING });
        mpvPlayer.autoNext(playerData);
        play();
      },
      web: () => {
        if (isLastTrack) {
          mprisUpdateSong({ status: PlayerStatus.PAUSED });
          resetPlayers();
        } else {
          const playerData = autoNext();
          mprisUpdateSong({ song: playerData.current.song, status: PlayerStatus.PLAYING });
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
        mprisUpdateSong({ song: playerData.current.song, status: PlayerStatus.PLAYING });
        mpvPlayer.setQueue(playerData);
        mpvPlayer.next();
      },
      web: () => {
        const playerData = next();
        mprisUpdateSong({ song: playerData.current.song, status: PlayerStatus.PLAYING });
      },
    };

    const handleRepeatNone = {
      local: () => {
        if (isLastTrack) {
          const playerData = setCurrentIndex(0);
          mprisUpdateSong({ song: playerData.current.song, status: PlayerStatus.PAUSED });
          mpvPlayer.setQueue(playerData);
          mpvPlayer.pause();
          pause();
        } else {
          const playerData = next();
          mprisUpdateSong({ song: playerData.current.song, status: PlayerStatus.PLAYING });
          mpvPlayer.setQueue(playerData);
          mpvPlayer.next();
        }
      },
      web: () => {
        if (isLastTrack) {
          const playerData = setCurrentIndex(0);
          mprisUpdateSong({ song: playerData.current.song, status: PlayerStatus.PLAYING });
          resetPlayers();
          pause();
        } else {
          const playerData = next();
          mprisUpdateSong({ song: playerData.current.song, status: PlayerStatus.PLAYING });
          resetPlayers();
        }
      },
    };

    const handleRepeatOne = {
      local: () => {
        const playerData = next();
        mprisUpdateSong({ song: playerData.current.song, status: PlayerStatus.PLAYING });
        mpvPlayer.setQueue(playerData);
        mpvPlayer.next();
      },
      web: () => {
        if (!isLastTrack) {
          const playerData = next();
          mprisUpdateSong({ song: playerData.current.song, status: PlayerStatus.PLAYING });
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
      handleScrobbleFromSongRestart(currentTime);
      mpris?.updateSeek(0);
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
          mprisUpdateSong({ song: playerData.current.song, status: PlayerStatus.PLAYING });
          mpvPlayer.setQueue(playerData);
          mpvPlayer.previous();
        } else {
          const playerData = setCurrentIndex(queue.length - 1);
          mprisUpdateSong({ song: playerData.current.song, status: PlayerStatus.PLAYING });
          mpvPlayer.setQueue(playerData);
          mpvPlayer.previous();
        }
      },
      web: () => {
        if (isFirstTrack) {
          const playerData = setCurrentIndex(queue.length - 1);
          mprisUpdateSong({ song: playerData.current.song, status: PlayerStatus.PLAYING });
          resetPlayers();
        } else {
          const playerData = previous();
          mprisUpdateSong({ song: playerData.current.song, status: PlayerStatus.PLAYING });
          resetPlayers();
        }
      },
    };

    const handleRepeatNone = {
      local: () => {
        const playerData = previous();
        mpris?.updateSong({
          currentTime: usePlayerStore.getState().current.time,
          song: playerData.current.song,
        });
        mpvPlayer.setQueue(playerData);
        mpvPlayer.previous();
      },
      web: () => {
        if (isFirstTrack) {
          resetPlayers();
          mprisUpdateSong({ status: PlayerStatus.PAUSED });
          pause();
        } else {
          const playerData = previous();
          mprisUpdateSong({ song: playerData.current.song, status: PlayerStatus.PLAYING });
          resetPlayers();
        }
      },
    };

    const handleRepeatOne = {
      local: () => {
        if (!isFirstTrack) {
          const playerData = previous();
          mprisUpdateSong({ song: playerData.current.song, status: PlayerStatus.PLAYING });
          mpvPlayer.setQueue(playerData);
          mpvPlayer.previous();
        } else {
          mpvPlayer.stop();
        }
      },
      web: () => {
        const playerData = previous();
        mprisUpdateSong({ song: playerData.current.song, status: PlayerStatus.PLAYING });
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
    handleScrobbleFromSongRestart,
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

    const evaluatedTime = currentTime - seconds;
    const newTime = evaluatedTime < 0 ? 0 : evaluatedTime;
    setCurrentTime(newTime);
    mpris?.updateSeek(newTime);

    if (isMpvPlayer) {
      mpvPlayer.seek(-seconds);
    } else {
      resetNextPlayer();
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
      mpris?.updateSeek(newTime);
      setCurrentTime(newTime);
    } else {
      const checkNewTime = currentTime + seconds;
      const songDuration = currentPlayerRef.player.player.duration;

      const newTime = checkNewTime >= songDuration ? songDuration - 1 : checkNewTime;
      mpris?.updateSeek(newTime);

      resetNextPlayer();
      setCurrentTime(newTime);
      currentPlayerRef.seekTo(newTime);
    }
  };

  const debouncedSeek = debounce((e: number) => {
    if (isMpvPlayer) {
      mpvPlayer.seekTo(e);
    } else {
      currentPlayerRef.seekTo(e);
    }
  }, 100);

  const handleSeekSlider = useCallback(
    (e: number | any) => {
      setCurrentTime(e);
      handleScrobbleFromSeek(e);
      debouncedSeek(e);

      mpris?.updateSeek(e);
    },
    [debouncedSeek, handleScrobbleFromSeek, setCurrentTime],
  );

  const handleQuit = useCallback(() => {
    mpvPlayer.quit();
  }, []);

  const handleError = useCallback(
    (message: string) => {
      toast.error({ id: 'mpv-error', message, title: 'An error occurred during playback' });
      pause();
      mpvPlayer.pause();
    },
    [pause],
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

      mpvPlayerListener.rendererQuit(() => {
        handleQuit();
      });

      mpvPlayerListener.rendererToggleShuffle(() => {
        handleToggleShuffle();
      });

      mpvPlayerListener.rendererToggleRepeat(() => {
        handleToggleRepeat();
      });

      mpvPlayerListener.rendererError((_event: any, message: string) => {
        handleError(message);
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
      ipc?.removeAllListeners('renderer-player-quit');
      ipc?.removeAllListeners('renderer-player-toggle-shuffle');
      ipc?.removeAllListeners('renderer-player-toggle-repeat');
      ipc?.removeAllListeners('renderer-player-error');
    };
  }, [
    autoNext,
    handleAutoNext,
    handleError,
    handleNextTrack,
    handlePause,
    handlePlay,
    handlePlayPause,
    handlePrevTrack,
    handleQuit,
    handleStop,
    handleToggleRepeat,
    handleToggleShuffle,
    isMpvPlayer,
    next,
    pause,
    play,
    previous,
    setCurrentTime,
  ]);

  useEffect(() => {
    if (utils?.isLinux()) {
      const unsubCurrentTime = usePlayerStore.subscribe(
        (state) => state.current.time,
        (time) => {
          mpris?.updatePosition(time);
        },
      );

      return () => {
        unsubCurrentTime();
      };
    }

    return () => {};
  }, []);

  useEffect(() => {
    if (utils?.isLinux()) {
      mpris.requestPosition((_e: any, data: { position: number }) => {
        const newTime = data.position;
        handleSeekSlider(newTime);
      });

      mpris.requestSeek((_e: any, data: { offset: number }) => {
        const currentTime = usePlayerStore.getState().current.time;
        const currentSongDuration = usePlayerStore.getState().current.song?.duration || 0;
        const resultingTime = currentTime + data.offset;

        let newTime = resultingTime;
        if (resultingTime > currentSongDuration) {
          newTime = currentSongDuration - 1;
        }

        if (resultingTime < 0) {
          newTime = 0;
        }

        handleSeekSlider(newTime);
      });

      mpris.requestVolume((_e: any, data: { volume: number }) => {
        const currentVolume = usePlayerStore.getState().volume;
        const resultingVolume = data.volume + currentVolume;

        let newVolume = resultingVolume;
        if (newVolume > 100) {
          newVolume = 100;
        } else if (newVolume < 0) {
          newVolume = 0;
        }

        usePlayerStore.getState().actions.setVolume(newVolume);

        if (isMpvPlayer) {
          mpvPlayer.volume(newVolume);
        }
      });

      mpris.requestToggleRepeat((_e: any, data: { repeat: string }) => {
        if (data.repeat === 'Playlist') {
          usePlayerStore.getState().actions.setRepeat(PlayerRepeat.ALL);
        } else if (data.repeat === 'Track') {
          usePlayerStore.getState().actions.setRepeat(PlayerRepeat.ONE);
        } else {
          usePlayerStore.getState().actions.setRepeat(PlayerRepeat.NONE);
        }
      });

      mpris.requestToggleShuffle((_e: any, data: { shuffle: boolean }) => {
        usePlayerStore
          .getState()
          .actions.setShuffle(data.shuffle ? PlayerShuffle.TRACK : PlayerShuffle.NONE);
      });

      return () => {
        ipc?.removeAllListeners('mpris-request-position');
        ipc?.removeAllListeners('mpris-request-seek');
        ipc?.removeAllListeners('mpris-request-volume');
        ipc?.removeAllListeners('mpris-request-toggle-repeat');
        ipc?.removeAllListeners('mpris-request-toggle-shuffle');
      };
    }

    return () => {};
  }, [handleSeekSlider, isMpvPlayer]);

  return {
    handleNextTrack,
    handlePause,
    handlePlay,
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
