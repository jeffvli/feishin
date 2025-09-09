import { ipcRenderer } from 'electron';

const removeAllListeners = (channel: string) => {
    ipcRenderer.removeAllListeners(channel);
};

const send = (channel: string, ...args: any[]) => {
    ipcRenderer.send(channel, ...args);
};

const invoke = (channel: string, ...args: any[]) => {
    return ipcRenderer.invoke(channel, ...args);
};

export const ipc = {
    invoke,
    removeAllListeners,
    send,
};

export type Ipc = typeof ipc;
