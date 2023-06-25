import { ipcRenderer } from 'electron';

const removeAllListeners = (channel: string) => {
  ipcRenderer.removeAllListeners(channel);
};

const send = (channel: string, ...args: any[]) => {
  ipcRenderer.send(channel, ...args);
};

export const ipc = {
  removeAllListeners,
  send,
};

export type Ipc = typeof ipc;
