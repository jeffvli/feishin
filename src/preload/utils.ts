import { ipcRenderer, IpcRendererEvent } from 'electron';

import { isLinux, isMacOS, isWindows } from '../main/utils';

const saveQueue = (data: Record<string, any>) => {
    ipcRenderer.send('player-save-queue', data);
};

const restoreQueue = () => {
    ipcRenderer.send('player-restore-queue');
};

const openItem = async (path: string) => {
    return ipcRenderer.invoke('open-item', path);
};

const onSaveQueue = (cb: (event: IpcRendererEvent) => void) => {
    ipcRenderer.on('renderer-save-queue', cb);
};

const onRestoreQueue = (cb: (event: IpcRendererEvent, data: Partial<any>) => void) => {
    ipcRenderer.on('renderer-restore-queue', cb);
};
const onRestoreQueueFail = (cb: (event: IpcRendererEvent, data: any) => void) => {
    ipcRenderer.on('renderer-restore-queue-fail', cb);
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
    download,
    isLinux,
    isMacOS,
    isWindows,
    logger,
    mainMessageListener,
    onRestoreQueue,
    onRestoreQueueFail,
    onSaveQueue,
    openItem,
    playerErrorListener,
    restoreQueue,
    saveQueue,
};

export type Utils = typeof utils;
