import isElectron from 'is-electron';
import debounce from 'lodash/debounce';
import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { toast } from '/@/renderer/components';
import { useScrobble } from '/@/renderer/features/player/hooks/use-scrobble';
import { updateSong } from '/@/renderer/features/player/update-remote-song';
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
import { usePlaybackType } from '/@/renderer/store/settings.store';
import { setAutoNext, setQueue, setQueueNext } from '/@/renderer/utils/set-transcoded-queue-data';
import { PlaybackType, PlayerRepeat, PlayerShuffle, PlayerStatus } from '/@/shared/types/types';

const mpvPlayer = isElectron() ? window.api.mpvPlayer : null;
const mpvPlayerListener = isElectron() ? window.api.mpvPlayerListener : null;
const ipc = isElectron() ? window.api.ipc : null;
const utils = isElectron() ? window.api.utils : null;
const mpris = isElectron() && utils?.isLinux() ? window.api.mpris : null;
const remote = isElectron() ? window.api.remote : null;
const mediaSession = navigator.mediaSession;

export const useCenterControls = (args: { playersRef: any }) => {
    const { t } = useTranslation();
    const { playersRef } = args;

    const currentPlayer = useCurrentPlayer();
    const { autoNext, next, pause, play, previous, setCurrentIndex, setRepeat, setShuffle } =
        usePlayerControls();
    const setCurrentTime = useSetCurrentTime();
    const queue = useDefaultQueue();
    const playerStatus = useCurrentStatus();
    const repeatStatus = useRepeatStatus();
    const shuffleStatus = useShuffleStatus();
    const playbackType = usePlaybackType();
    const player1Ref = playersRef?.current?.player1;
    const player2Ref = playersRef?.current?.player2;
    const currentPlayerRef = currentPlayer === 1 ? player1Ref : player2Ref;
    const nextPlayerRef = currentPlayer === 1 ? player2Ref : player1Ref;

    const { handleScrobbleFromSeek, handleScrobbleFromSongRestart } = useScrobble();

    useEffect(() => {
        if (mediaSession) {
            mediaSession.playbackState =
                playerStatus === PlayerStatus.PLAYING ? 'playing' : 'paused';
        }

        remote?.updatePlayback(playerStatus);
    }, [playerStatus]);

    useEffect(() => {
        remote?.updateRepeat(repeatStatus);
    }, [repeatStatus]);

    useEffect(() => {
        remote?.updateShuffle(shuffleStatus !== PlayerShuffle.NONE);
    }, [shuffleStatus]);

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

        const nextPlayer = nextPlayerRef.getInternalPlayer();
        if (nextPlayer) {
            nextPlayer.currentTime = 0;
            nextPlayer.pause();
        }
    }, [currentPlayerRef, nextPlayerRef]);

    const stopPlayback = useCallback(() => {
        player1Ref.getInternalPlayer().pause();
        player2Ref.getInternalPlayer().pause();
        resetPlayers();
    }, [player1Ref, player2Ref, resetPlayers]);

    const isMpvPlayer = isElectron() && playbackType === PlaybackType.LOCAL;

    const handlePlay = useCallback(() => {
        if (isMpvPlayer) {
            mpvPlayer?.volume(usePlayerStore.getState().volume);
            mpvPlayer!.play();
        } else {
            currentPlayerRef
                .getInternalPlayer()
                ?.play()
                .catch(() => {});
        }

        play();
    }, [currentPlayerRef, isMpvPlayer, play]);

    const handlePause = useCallback(() => {
        if (isMpvPlayer) {
            mpvPlayer!.pause();
        }

        pause();
    }, [isMpvPlayer, pause]);

    const handleStop = useCallback(() => {
        if (isMpvPlayer) {
            mpvPlayer!.stop();
        } else {
            stopPlayback();
        }

        setCurrentTime(0);
        pause();
    }, [isMpvPlayer, pause, setCurrentTime, stopPlayback]);

    const handleToggleShuffle = useCallback(() => {
        if (shuffleStatus === PlayerShuffle.NONE) {
            const playerData = setShuffle(PlayerShuffle.TRACK);
            remote?.updateShuffle(true);
            return setQueueNext(playerData);
        }

        const playerData = setShuffle(PlayerShuffle.NONE);
        remote?.updateShuffle(false);
        return setQueueNext(playerData);
    }, [setShuffle, shuffleStatus]);

    const handleToggleRepeat = useCallback(() => {
        if (repeatStatus === PlayerRepeat.NONE) {
            const playerData = setRepeat(PlayerRepeat.ALL);
            remote?.updateRepeat(PlayerRepeat.ALL);
            return setQueueNext(playerData);
        }

        if (repeatStatus === PlayerRepeat.ALL) {
            const playerData = setRepeat(PlayerRepeat.ONE);
            remote?.updateRepeat(PlayerRepeat.ONE);
            return setQueueNext(playerData);
        }

        const playerData = setRepeat(PlayerRepeat.NONE);
        remote?.updateRepeat(PlayerRepeat.NONE);
        return setQueueNext(playerData);
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
                updateSong(playerData.current.song);
                setAutoNext(playerData);
                play();
            },
            web: () => {
                const playerData = autoNext();
                updateSong(playerData.current.song);
            },
        };

        const handleRepeatNone = {
            local: () => {
                if (isLastTrack) {
                    const playerData = setCurrentIndex(0);
                    updateSong(playerData.current.song);
                    setQueue(playerData, true);
                    pause();
                } else {
                    const playerData = autoNext();
                    updateSong(playerData.current.song);
                    setAutoNext(playerData);
                    play();
                }
            },
            web: () => {
                if (isLastTrack) {
                    resetPlayers();
                    pause();
                } else {
                    const playerData = autoNext();
                    updateSong(playerData.current.song);
                    resetPlayers();
                }
            },
        };

        const handleRepeatOne = {
            local: () => {
                const playerData = autoNext();
                updateSong(playerData.current.song);
                setAutoNext(playerData);
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
            case PlayerRepeat.ALL:
                handleRepeatAll[playbackType]();
                break;
            case PlayerRepeat.NONE:
                handleRepeatNone[playbackType]();
                break;
            case PlayerRepeat.ONE:
                handleRepeatOne[playbackType]();
                break;

            default:
                break;
        }
    }, [
        autoNext,
        checkIsLastTrack,
        pause,
        play,
        playbackType,
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
                updateSong(playerData.current.song);
                setQueue(playerData);
            },
            web: () => {
                const playerData = next();
                updateSong(playerData.current.song);
            },
        };

        const handleRepeatNone = {
            local: () => {
                if (isLastTrack) {
                    const playerData = setCurrentIndex(0);
                    updateSong(playerData.current.song);
                    setQueue(playerData, true);
                    pause();
                } else {
                    const playerData = next();
                    updateSong(playerData.current.song);
                    setQueue(playerData);
                }
            },
            web: () => {
                if (isLastTrack) {
                    const playerData = setCurrentIndex(0);
                    updateSong(playerData.current.song);
                    resetPlayers();
                    pause();
                } else {
                    const playerData = next();
                    updateSong(playerData.current.song);
                    resetPlayers();
                }
            },
        };

        const handleRepeatOne = {
            local: () => {
                if (!isLastTrack) {
                    const playerData = next();
                    updateSong(playerData.current.song);
                    setQueue(playerData);
                }
            },
            web: () => {
                if (!isLastTrack) {
                    const playerData = next();
                    updateSong(playerData.current.song);
                }
            },
        };

        switch (repeatStatus) {
            case PlayerRepeat.ALL:
                handleRepeatAll[playbackType]();
                break;
            case PlayerRepeat.NONE:
                handleRepeatNone[playbackType]();
                break;
            case PlayerRepeat.ONE:
                handleRepeatOne[playbackType]();
                break;

            default:
                break;
        }

        setCurrentTime(0);
    }, [
        checkIsLastTrack,
        next,
        pause,
        playbackType,
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
            setCurrentTime(0, true);
            handleScrobbleFromSongRestart(currentTime);
            mpris?.updateSeek(0);
            if (isMpvPlayer) {
                return mpvPlayer!.seekTo(0);
            }
            return currentPlayerRef.seekTo(0);
        }

        const isFirstTrack = checkIsFirstTrack();

        const handleRepeatAll = {
            local: () => {
                if (!isFirstTrack) {
                    const playerData = previous();
                    updateSong(playerData.current.song);
                    setQueue(playerData);
                } else {
                    const playerData = setCurrentIndex(queue.length - 1);
                    updateSong(playerData.current.song);
                    setQueue(playerData);
                }
            },
            web: () => {
                if (isFirstTrack) {
                    const playerData = setCurrentIndex(queue.length - 1);
                    updateSong(playerData.current.song);
                    resetPlayers();
                } else {
                    const playerData = previous();
                    updateSong(playerData.current.song);
                    resetPlayers();
                }
            },
        };

        const handleRepeatNone = {
            local: () => {
                if (isFirstTrack) {
                    const playerData = setCurrentIndex(0);
                    updateSong(playerData.current.song);
                    setQueue(playerData, true);
                    pause();
                } else {
                    const playerData = previous();
                    updateSong(playerData.current.song);
                    setQueue(playerData);
                }
            },
            web: () => {
                if (isFirstTrack) {
                    resetPlayers();
                    pause();
                } else {
                    const playerData = previous();
                    updateSong(playerData.current.song);
                    resetPlayers();
                }
            },
        };

        const handleRepeatOne = {
            local: () => {
                const playerData = previous();
                updateSong(playerData.current.song);
                setQueue(playerData);
            },
            web: () => {
                const playerData = previous();
                updateSong(playerData.current.song);
                resetPlayers();
            },
        };

        switch (repeatStatus) {
            case PlayerRepeat.ALL:
                handleRepeatAll[playbackType]();
                break;
            case PlayerRepeat.NONE:
                handleRepeatNone[playbackType]();
                break;
            case PlayerRepeat.ONE:
                handleRepeatOne[playbackType]();
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
        playbackType,
        previous,
        queue.length,
        repeatStatus,
        resetPlayers,
        setCurrentIndex,
        setCurrentTime,
    ]);

    const handlePlayPause = useCallback(() => {
        if (queue.length > 0) {
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
        setCurrentTime(newTime, true);
        mpris?.updateSeek(newTime);

        if (isMpvPlayer) {
            mpvPlayer!.seek(-seconds);
        } else {
            resetNextPlayer();
            currentPlayerRef.seekTo(newTime, 'seconds');
        }
    };

    const handleSkipForward = (seconds: number) => {
        const currentTime = isMpvPlayer
            ? usePlayerStore.getState().current.time
            : currentPlayerRef.getCurrentTime();

        if (isMpvPlayer) {
            const newTime = currentTime + seconds;
            mpvPlayer!.seek(seconds);
            mpris?.updateSeek(newTime);
            setCurrentTime(newTime, true);
        } else {
            const checkNewTime = currentTime + seconds;
            const songDuration = currentPlayerRef.player.player.duration;

            const newTime = checkNewTime >= songDuration ? songDuration - 1 : checkNewTime;
            mpris?.updateSeek(newTime);

            resetNextPlayer();
            setCurrentTime(newTime, true);
            currentPlayerRef.seekTo(newTime, 'seconds');
        }
    };

    const debouncedSeek = debounce((e: number) => {
        if (isMpvPlayer) {
            mpvPlayer!.seekTo(e);
        } else {
            currentPlayerRef.seekTo(e, 'seconds');
        }
    }, 100);

    const handleSeekSlider = useCallback(
        (e: any | number) => {
            setCurrentTime(e, true);
            handleScrobbleFromSeek(e);
            debouncedSeek(e);

            mpris?.updateSeek(e);
        },
        [debouncedSeek, handleScrobbleFromSeek, setCurrentTime],
    );

    const handleQuit = useCallback(() => {
        mpvPlayer!.quit();
    }, []);

    const handleError = useCallback(
        (message: string) => {
            toast.error({
                id: 'mpv-error',
                message,
                title: t('error.playbackError', { postProcess: 'sentenceCase' }),
            });
            pause();
            mpvPlayer!.pause();
        },
        [pause, t],
    );

    useEffect(() => {
        if (mpvPlayerListener) {
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
        if (!isElectron() && mediaSession) {
            mediaSession.setActionHandler('nexttrack', () => {
                handleNextTrack();
            });

            mediaSession.setActionHandler('pause', () => {
                handlePause();
            });

            mediaSession.setActionHandler('play', () => {
                handlePlay();
            });

            mediaSession.setActionHandler('previoustrack', () => {
                handlePrevTrack();
            });

            mediaSession.setActionHandler('seekto', (evt) => {
                const time = evt.seekTime;

                if (time !== undefined) {
                    handleSeekSlider(time);
                }
            });

            mediaSession.setActionHandler('stop', () => {
                handleStop();
            });

            return () => {
                mediaSession.setActionHandler('nexttrack', null);
                mediaSession.setActionHandler('pause', null);
                mediaSession.setActionHandler('play', null);
                mediaSession.setActionHandler('previoustrack', null);
                mediaSession.setActionHandler('seekto', null);
                mediaSession.setActionHandler('stop', null);
            };
        }

        return () => {};
    }, [
        handleNextTrack,
        handlePause,
        handlePlay,
        handlePrevTrack,
        handleSeekSlider,
        handleStop,
        setCurrentTime,
    ]);

    useEffect(() => {
        if (remote) {
            const unsubCurrentTime = usePlayerStore.subscribe(
                (state) => state.current.time,
                (time) => {
                    remote.updatePosition(time);
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
            mpris!.requestToggleRepeat((_e: any, data: { repeat: string }) => {
                if (data.repeat === 'Playlist') {
                    usePlayerStore.getState().actions.setRepeat(PlayerRepeat.ALL);
                } else if (data.repeat === 'Track') {
                    usePlayerStore.getState().actions.setRepeat(PlayerRepeat.ONE);
                } else {
                    usePlayerStore.getState().actions.setRepeat(PlayerRepeat.NONE);
                }
            });

            mpris!.requestToggleShuffle((_e: any, data: { shuffle: boolean }) => {
                usePlayerStore
                    .getState()
                    .actions.setShuffle(data.shuffle ? PlayerShuffle.TRACK : PlayerShuffle.NONE);
            });

            return () => {
                ipc?.removeAllListeners('mpris-request-toggle-repeat');
                ipc?.removeAllListeners('mpris-request-toggle-shuffle');
            };
        }

        return () => {};
    }, [handleSeekSlider, isMpvPlayer]);

    useEffect(() => {
        if (remote) {
            remote.requestPosition((_e: any, data: { position: number }) => {
                const newTime = data.position;
                handleSeekSlider(newTime);
            });

            remote.requestSeek((_e: any, data: { offset: number }) => {
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

            remote.requestVolume((_e: any, data: { volume: number }) => {
                usePlayerStore.getState().actions.setVolume(data.volume);

                if (isMpvPlayer) {
                    mpvPlayer!.volume(data.volume);
                }
            });

            return () => {
                ipc?.removeAllListeners('request-position');
                ipc?.removeAllListeners('request-seek');
                ipc?.removeAllListeners('request-volume');
            };
        }

        return () => {};
    });

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
