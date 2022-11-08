// Other files:
// main/features/core/player/index.ts
// main/preload.ts
// renderer/preload.d.ts

import isElectron from 'is-electron';
import { PlayerData, usePlayerStore } from '../../../store';

const ipc = isElectron() ? window.electron.ipcRenderer : null;

const play = () => ipc?.PLAYER_PLAY();

const pause = () => ipc?.PLAYER_PAUSE();

const stop = () => ipc?.PLAYER_STOP();

const currentTime = () => ipc?.PLAYER_CURRENT_TIME();

const next = () => ipc?.PLAYER_NEXT();

const previous = () => ipc?.PLAYER_PREVIOUS();

const setQueue = (data: PlayerData) => ipc?.PLAYER_SET_QUEUE(data);

const setQueueNext = (data: PlayerData) => ipc?.PLAYER_SET_QUEUE_NEXT(data);

const playerAutoNext = (data: PlayerData) => ipc?.PLAYER_AUTO_NEXT(data);

const seek = (seconds: number) => ipc?.PLAYER_SEEK(seconds);

const seekTo = (seconds: number) => ipc?.PLAYER_SEEK_TO(seconds);

const volume = (value: number) => ipc?.PLAYER_VOLUME(value);

const mute = () => ipc?.PLAYER_MUTE();

const { autoNext } = usePlayerStore.getState();

ipc?.RENDERER_PLAYER_AUTO_NEXT(() => {
  const playerData = autoNext();
  if (playerData.queue.next) {
    playerAutoNext(playerData);
  }
});

export const mpvPlayer = {
  currentTime,
  mute,
  next,
  pause,
  play,
  playerAutoNext,
  previous,
  seek,
  seekTo,
  setQueue,
  setQueueNext,
  stop,
  volume,
};
