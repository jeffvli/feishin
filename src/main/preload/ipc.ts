import { ipcRenderer } from 'electron';

const removeAllListeners = (channel: string) => {
  ipcRenderer.removeAllListeners(channel);
};

const send = (channel: string, ...args: any[]) => {
  ipcRenderer.send(channel, ...args);
};

const on = (channel: string, listener: (event: Electron.IpcRendererEvent, ...args: any[]) => void) => {
  ipcRenderer.on(channel, listener);
}

export const ipc = {
  removeAllListeners,
  send,
  on
};
