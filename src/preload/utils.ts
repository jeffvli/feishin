import { ipcRenderer, webFrame } from 'electron';

import { disableAutoUpdates, isLinux, isMacOS, isWindows } from '../main/env';

const openItem = async (path: string) => {
    return ipcRenderer.invoke('open-item', path);
};

const openApplicationDirectory = async () => {
    return ipcRenderer.invoke('open-application-directory');
};

const playerErrorListener = (cb: (data: { code: number }) => void) => {
    ipcRenderer.on('player-error-listener', (_, data) => cb(data));
};

const mainMessageListener = (
    cb: (data: { message: string; type: 'error' | 'info' | 'success' | 'warning' }) => void,
) => {
    ipcRenderer.on('toast-from-main', (_, data) => cb(data));
};

const download = (url: string) => {
    ipcRenderer.send('download-url', url);
};

const checkForUpdates = (): Promise<{ updateAvailable: boolean; version?: string }> => {
    return ipcRenderer.invoke('app-check-for-updates');
};

const startPowerSaveBlocker = (full: boolean) => {
    return ipcRenderer.invoke('power-save-blocker-start', { full });
};

const stopPowerSaveBlocker = () => {
    return ipcRenderer.invoke('power-save-blocker-stop');
};

const forceGarbageCollection = (): boolean => {
    try {
        if (typeof global.gc === 'function') {
            global.gc();
            webFrame.clearCache();
            return true;
        }
        if (typeof window.gc === 'function') {
            window.gc();
            webFrame.clearCache();
            return true;
        }
        return false;
    } catch {
        return false;
    }
};

const setCommandPaletteOpen = (opened: boolean) => {
    ipcRenderer.send('command-palette-state', opened);
};

const rendererOpenSettings = (cb: () => void) => {
    ipcRenderer.on('renderer-open-settings', () => cb());
};

const rendererOpenCommandPalette = (cb: () => void) => {
    ipcRenderer.on('renderer-open-command-palette', () => cb());
};

const rendererOpenManageServers = (cb: () => void) => {
    ipcRenderer.on('renderer-open-manage-servers', () => cb());
};

const rendererTogglePrivateMode = (cb: () => void) => {
    ipcRenderer.on('renderer-toggle-private-mode', cb);
};

const rendererToggleSidebar = (cb: () => void) => {
    ipcRenderer.on('renderer-toggle-sidebar', () => cb());
};

const rendererOpenReleaseNotes = (cb: () => void) => {
    ipcRenderer.on('renderer-open-release-notes', () => cb());
};

const rendererUpdateAvailable = (cb: (version: string) => void) => {
    ipcRenderer.on('update-available', (_, version) => cb(version));
};

export const utils = {
    checkForUpdates,
    disableAutoUpdates,
    download,
    forceGarbageCollection,
    isLinux,
    isMacOS,
    isWindows,
    mainMessageListener,
    openApplicationDirectory,
    openItem,
    playerErrorListener,
    rendererOpenCommandPalette,
    rendererOpenManageServers,
    rendererOpenReleaseNotes,
    rendererOpenSettings,
    rendererTogglePrivateMode,
    rendererToggleSidebar,
    rendererUpdateAvailable,
    setCommandPaletteOpen,
    startPowerSaveBlocker,
    stopPowerSaveBlocker,
};

export type Utils = typeof utils;
