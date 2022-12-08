import { ipcRenderer } from 'electron';

const removeAllListeners = (channel: string) => {
  ipcRenderer.removeAllListeners(channel);
};

export const ipc = {
  removeAllListeners,
};
