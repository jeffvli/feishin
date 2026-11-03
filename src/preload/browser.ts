import { ipcRenderer } from 'electron';

const exit = () => {
    ipcRenderer.send('window-close');
};

const maximize = () => {
    ipcRenderer.send('window-maximize');
};

const minimize = () => {
    ipcRenderer.send('window-minimize');
};

const setMiniPlayer = (enabled: boolean, alwaysOnTop: boolean) => {
    ipcRenderer.send('window-mini-player', enabled, alwaysOnTop);
};

const unmaximize = () => {
    ipcRenderer.send('window-unmaximize');
};

const quit = () => {
    ipcRenderer.send('window-quit');
};

const devtools = () => {
    ipcRenderer.send('window-dev-tools');
};

const clearCache = (): Promise<void> => {
    return ipcRenderer.invoke('window-clear-cache');
};

export const browser = {
    clearCache,
    devtools,
    exit,
    maximize,
    minimize,
    quit,
    setMiniPlayer,
    unmaximize,
};

export type Browser = typeof browser;
