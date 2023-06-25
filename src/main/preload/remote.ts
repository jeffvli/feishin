import { IpcRendererEvent, ipcRenderer } from 'electron';
import { SongUpdate } from '/@/renderer/types';

const requestPosition = (cb: (event: IpcRendererEvent, data: { position: number }) => void) => {
  ipcRenderer.on('request-position', cb);
};

const requestSeek = (cb: (event: IpcRendererEvent, data: { offset: number }) => void) => {
  ipcRenderer.on('request-seek', cb);
};

const requestVolume = (cb: (event: IpcRendererEvent, data: { volume: number }) => void) => {
  ipcRenderer.on('request-volume', cb);
};

const setRemoteEnabled = (enabled: boolean): Promise<string | null> => {
  const result = ipcRenderer.invoke('remote-enable', enabled);
  return result;
};

const setRemotePort = (port: number): Promise<string | null> => {
  const result = ipcRenderer.invoke('remote-port', port);
  return result;
};

const updateRepeat = (repeat: string) => {
  ipcRenderer.send('update-repeat', repeat);
};

const updateShuffle = (shuffle: boolean) => {
  ipcRenderer.send('update-shuffle', shuffle);
};

const updateSong = (args: SongUpdate) => {
  ipcRenderer.send('update-song', args);
};

const updateVolume = (volume: number) => {
  ipcRenderer.send('update-volume', volume);
};

export const remote = {
  requestPosition,
  requestSeek,
  requestVolume,
  setRemoteEnabled,
  setRemotePort,
  updateRepeat,
  updateShuffle,
  updateSong,
  updateVolume,
};

export type Remote = typeof remote;
