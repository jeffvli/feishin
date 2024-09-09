import { IpcRendererEvent, ipcRenderer } from 'electron';
import { isMacOS, isWindows, isLinux } from '../utils';
import { PlayerState } from '/@/renderer/store';

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

const onRestoreQueue = (cb: (event: IpcRendererEvent, data: Partial<PlayerState>) => void) => {
    ipcRenderer.on('renderer-restore-queue', cb);
};

const playerErrorListener = (cb: (event: IpcRendererEvent, data: { code: number }) => void) => {
    ipcRenderer.on('player-error-listener', cb);
};

const mainMessageListener = (
    cb: (
        event: IpcRendererEvent,
        data: { message: string; type: 'success' | 'error' | 'warning' | 'info' },
    ) => void,
) => {
    ipcRenderer.on('toast-from-main', cb);
};

const logger = (
    cb: (
        event: IpcRendererEvent,
        data: {
            message: string;
            type: 'debug' | 'verbose' | 'error' | 'warning' | 'info';
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
    onSaveQueue,
    openItem,
    playerErrorListener,
    restoreQueue,
    saveQueue,
};

export type Utils = typeof utils;
