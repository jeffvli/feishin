import { ipcRenderer, IpcRendererEvent } from 'electron';
import { PlayerData } from '/@/renderer/store';

const autoNext = (data: PlayerData) => {
  ipcRenderer.send('player-auto-next', data);
};

const currentTime = () => {
  ipcRenderer.send('player-current-time');
};
const mute = () => {
  ipcRenderer.send('player-mute');
};
const next = () => {
  ipcRenderer.send('player-next');
};
const pause = () => {
  ipcRenderer.send('player-pause');
};
const play = () => {
  ipcRenderer.send('player-play');
};
const previous = () => {
  ipcRenderer.send('player-previous');
};
const seek = (seconds: number) => {
  ipcRenderer.send('player-seek', seconds);
};
const seekTo = (seconds: number) => {
  ipcRenderer.send('player-seek-to', seconds);
};
const setQueue = (data: PlayerData) => {
  ipcRenderer.send('player-set-queue', data);
};
const setQueueNext = (data: PlayerData) => {
  ipcRenderer.send('player-set-queue-next', data);
};
const stop = () => {
  ipcRenderer.send('player-stop');
};
const volume = (value: number) => {
  ipcRenderer.send('player-volume', value);
};

const quit = () => {
  ipcRenderer.send('player-quit');
};

const rendererAutoNext = (cb: (event: IpcRendererEvent, data: PlayerData) => void) => {
  ipcRenderer.on('renderer-player-auto-next', cb);
};

const rendererCurrentTime = (cb: (event: IpcRendererEvent, data: number) => void) => {
  ipcRenderer.on('renderer-player-current-time', cb);
};

const rendererNext = (cb: (event: IpcRendererEvent, data: PlayerData) => void) => {
  ipcRenderer.on('renderer-player-next', cb);
};

const rendererPause = (cb: (event: IpcRendererEvent, data: PlayerData) => void) => {
  ipcRenderer.on('renderer-player-pause', cb);
};

const rendererPlay = (cb: (event: IpcRendererEvent, data: PlayerData) => void) => {
  ipcRenderer.on('renderer-player-play', cb);
};

const rendererPlayPause = (cb: (event: IpcRendererEvent, data: PlayerData) => void) => {
  ipcRenderer.on('renderer-player-play-pause', cb);
};

const rendererPrevious = (cb: (event: IpcRendererEvent, data: PlayerData) => void) => {
  ipcRenderer.on('renderer-player-previous', cb);
};

const rendererStop = (cb: (event: IpcRendererEvent, data: PlayerData) => void) => {
  ipcRenderer.on('renderer-player-stop', cb);
};

const rendererQuit = (cb: (event: IpcRendererEvent) => void) => {
  ipcRenderer.on('renderer-player-quit', cb);
};

export const mpvPlayer = {
  autoNext,
  currentTime,
  mute,
  next,
  pause,
  play,
  previous,
  quit,
  seek,
  seekTo,
  setQueue,
  setQueueNext,
  stop,
  volume,
};

export const mpvPlayerListener = {
  rendererAutoNext,
  rendererCurrentTime,
  rendererNext,
  rendererPause,
  rendererPlay,
  rendererPlayPause,
  rendererPrevious,
  rendererQuit,
  rendererStop,
};
