import { IpcRendererEvent, ipcRenderer } from 'electron';
import { QueueSong } from '/@/renderer/api/types';

const updateSong = (args: { currentTime: number; song: QueueSong }) => {
  ipcRenderer.send('mpris-update-song', args);
};

const updatePosition = (timeSec: number) => {
  ipcRenderer.send('mpris-update-position', timeSec);
};

const updateSeek = (timeSec: number) => {
  ipcRenderer.send('mpris-update-seek', timeSec);
};

const updateVolume = (volume: number) => {
  ipcRenderer.send('mpris-update-volume', volume);
};

const updateRepeat = (repeat: string) => {
  ipcRenderer.send('mpris-update-repeat', repeat);
};

const updateShuffle = (shuffle: boolean) => {
  ipcRenderer.send('mpris-update-shuffle', shuffle);
};

const toggleRepeat = () => {
  ipcRenderer.send('mpris-toggle-repeat');
};

const toggleShuffle = () => {
  ipcRenderer.send('mpris-toggle-shuffle');
};

const requestPosition = (cb: (event: IpcRendererEvent, data: { position: number }) => void) => {
  ipcRenderer.on('mpris-request-position', cb);
};

const requestSeek = (cb: (event: IpcRendererEvent, data: { offset: number }) => void) => {
  ipcRenderer.on('mpris-request-seek', cb);
};

const requestVolume = (cb: (event: IpcRendererEvent, data: { volume: number }) => void) => {
  ipcRenderer.on('mpris-request-volume', cb);
};

const requestToggleRepeat = (cb: (event: IpcRendererEvent) => void) => {
  ipcRenderer.on('mpris-request-toggle-repeat', cb);
};

const requestToggleShuffle = (cb: (event: IpcRendererEvent) => void) => {
  ipcRenderer.on('mpris-request-toggle-shuffle', cb);
};

export const mpris = {
  requestPosition,
  requestSeek,
  requestToggleRepeat,
  requestToggleShuffle,
  requestVolume,
  toggleRepeat,
  toggleShuffle,
  updatePosition,
  updateRepeat,
  updateSeek,
  updateShuffle,
  updateSong,
  updateVolume,
};
