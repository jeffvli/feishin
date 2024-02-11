import { IpcRendererEvent, ipcRenderer } from 'electron';
import { isMacOS, isWindows, isLinux } from '../utils';
import { PlayerState } from '/@/renderer/store';

const saveQueue = (data: Record<string, any>) => {
    ipcRenderer.send('player-save-queue', data);
};

const restoreQueue = () => {
    ipcRenderer.send('player-restore-queue');
};

const onSaveQueue = (cb: (event: IpcRendererEvent) => void) => {
    ipcRenderer.on('renderer-save-queue', cb);
};

const onRestoreQueue = (cb: (event: IpcRendererEvent, data: Partial<PlayerState>) => void) => {
    ipcRenderer.on('renderer-restore-queue', cb);
};

export const utils = {
    isLinux,
    isMacOS,
    isWindows,
    onRestoreQueue,
    onSaveQueue,
    restoreQueue,
    saveQueue,
};

export type Utils = typeof utils;
