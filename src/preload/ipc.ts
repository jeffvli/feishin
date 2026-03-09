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

const on = (channel: string, listener: (event: any, ...args: any[]) => void) => {
    ipcRenderer.on(channel, listener);
};

const removeListener = (channel: string, listener: (event: any, ...args: any[]) => void) => {
    ipcRenderer.removeListener(channel, listener);
};

export const ipc = {
    invoke,
    on,
    removeAllListeners,
    removeListener,
    send,
};

export type Ipc = typeof ipc;
