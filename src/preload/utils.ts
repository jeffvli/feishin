import { ipcRenderer, webFrame } from 'electron';

import { disableAutoUpdates, isLinux, isMacOS, isWindows } from '../main/env';

const openItem = async (path: string) => {
    return ipcRenderer.invoke('open-item', path);
};

const openApplicationDirectory = async () => {
    return ipcRenderer.invoke('open-application-directory');
};

const getCustomCss = async (): Promise<
    | undefined
    | {
          content: string;
          exists: boolean;
          path?: string;
      }
> => {
    return ipcRenderer.invoke('custom-css-get');
};

const saveCustomCss = async (content: string) => {
    return ipcRenderer.invoke('custom-css-save', { content });
};

const openCustomCssFolder = async () => {
    return ipcRenderer.invoke('custom-css-open-folder');
};

const customCssUpdatedListener = (
    cb: (data: { content?: string; exists?: boolean; path?: string }) => void,
) => {
    const listener = (_event: unknown, data: { content?: string; exists?: boolean }) => cb(data);
    ipcRenderer.on('custom-css-updated', listener);

    return () => {
        ipcRenderer.removeListener('custom-css-updated', listener);
    };
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

const setInputFocused = (focused: boolean) => {
    ipcRenderer.send('input-focus-state', focused);
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
    customCssUpdatedListener,
    disableAutoUpdates,
    download,
    forceGarbageCollection,
    getCustomCss,
    isLinux,
    isMacOS,
    isWindows,
    mainMessageListener,
    openApplicationDirectory,
    openCustomCssFolder,
    openItem,
    playerErrorListener,
    rendererOpenCommandPalette,
    rendererOpenManageServers,
    rendererOpenReleaseNotes,
    rendererOpenSettings,
    rendererTogglePrivateMode,
    rendererToggleSidebar,
    rendererUpdateAvailable,
    saveCustomCss,
    setInputFocused,
    startPowerSaveBlocker,
    stopPowerSaveBlocker,
};

export type Utils = typeof utils;
