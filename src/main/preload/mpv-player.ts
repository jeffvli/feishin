import { ipcRenderer, IpcRendererEvent } from 'electron';
import { PlayerData } from '/@/renderer/store';

const initialize = (data: { extraParameters?: string[]; properties?: Record<string, any> }) => {
  ipcRenderer.send('player-initialize', data);
};

const restart = (data: { extraParameters?: string[]; properties?: Record<string, any> }) => {
  ipcRenderer.send('player-restart', data);
};

const setProperties = (data: Record<string, any>) => {
  console.log('Setting property :>>', data);
  ipcRenderer.send('player-set-properties', data);
};

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

const saveQueue = (data: Record<string, any>) => {
  ipcRenderer.send('player-save-data', data);
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

const rendererSkipForward = (cb: (event: IpcRendererEvent, data: PlayerData) => void) => {
  ipcRenderer.on('renderer-player-skip-forward', cb);
};

const rendererSkipBackward = (cb: (event: IpcRendererEvent, data: PlayerData) => void) => {
  ipcRenderer.on('renderer-player-skip-backward', cb);
};

const rendererVolumeUp = (cb: (event: IpcRendererEvent, data: PlayerData) => void) => {
  ipcRenderer.on('renderer-player-volume-up', cb);
};

const rendererVolumeDown = (cb: (event: IpcRendererEvent, data: PlayerData) => void) => {
  ipcRenderer.on('renderer-player-volume-down', cb);
};

const rendererVolumeMute = (cb: (event: IpcRendererEvent, data: PlayerData) => void) => {
  ipcRenderer.on('renderer-player-volume-mute', cb);
};

const rendererToggleRepeat = (cb: (event: IpcRendererEvent, data: PlayerData) => void) => {
  ipcRenderer.on('renderer-player-toggle-repeat', cb);
};

const rendererToggleShuffle = (cb: (event: IpcRendererEvent, data: PlayerData) => void) => {
  ipcRenderer.on('renderer-player-toggle-shuffle', cb);
};

const rendererQuit = (cb: (event: IpcRendererEvent) => void) => {
  ipcRenderer.on('renderer-player-quit', cb);
};

const rendererSaveState = (cb: (event: IpcRendererEvent) => void) => {
  ipcRenderer.on('renderer-player-save-queue', cb);
};

const rendererRestoreState = (cb: (event: IpcRendererEvent) => void) => {
  ipcRenderer.on('renderer-player-restore-queue', cb);
};

export const mpvPlayer = {
  autoNext,
  currentTime,
  initialize,
  mute,
  next,
  pause,
  play,
  previous,
  quit,
  restart,
  saveQueue,
  seek,
  seekTo,
  setProperties,
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
  rendererRestoreState,
  rendererSaveState,
  rendererSkipBackward,
  rendererSkipForward,
  rendererStop,
  rendererToggleRepeat,
  rendererToggleShuffle,
  rendererVolumeDown,
  rendererVolumeMute,
  rendererVolumeUp,
};
