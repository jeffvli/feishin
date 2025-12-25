import { ipcRenderer, IpcRendererEvent } from 'electron';

import { disableAutoUpdates, isLinux, isMacOS, isWindows } from '../main/utils';

const openItem = async (path: string) => {
    return ipcRenderer.invoke('open-item', path);
};

const openApplicationDirectory = async () => {
    return ipcRenderer.invoke('open-application-directory');
};

const playerErrorListener = (cb: (event: IpcRendererEvent, data: { code: number }) => void) => {
    ipcRenderer.on('player-error-listener', cb);
};

const mainMessageListener = (
    cb: (
        event: IpcRendererEvent,
        data: { message: string; type: 'error' | 'info' | 'success' | 'warning' },
    ) => void,
) => {
    ipcRenderer.on('toast-from-main', cb);
};

const logger = (
    cb: (
        event: IpcRendererEvent,
        data: {
            message: string;
            type: 'debug' | 'error' | 'info' | 'verbose' | 'warning';
        },
    ) => void,
) => {
    ipcRenderer.send('logger', cb);
};

const download = (url: string) => {
    ipcRenderer.send('download-url', url);
};

export const utils = {
    disableAutoUpdates,
    download,
    isLinux,
    isMacOS,
    isWindows,
    logger,
    mainMessageListener,
    openApplicationDirectory,
    openItem,
    playerErrorListener,
};

export type Utils = typeof utils;
