import { ipcRenderer } from 'electron';

const removeAllListeners = (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
};

const send = (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args);
};

const removeListener = (channel: string, listener: (event: any, ...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, listener);
};

export const ipc = {
    removeAllListeners,
    removeListener,
    send,
};

export type Ipc = typeof ipc;
