import { ipcRenderer } from 'electron';

const exit = () => {
    ipcRenderer.send('window-close');
};

const toggleMaximize = () => {
    ipcRenderer.send('window-toggle-maximize');
};

const onMaximizedChange = (cb: (maximized: boolean) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, maximized: boolean) => cb(maximized);
    ipcRenderer.on('renderer-window-maximized', listener);
    return () => ipcRenderer.removeListener('renderer-window-maximized', listener);
};

const isMaximized = (): Promise<boolean> => {
    return ipcRenderer.invoke('window-is-maximized');
};

const minimize = () => {
    ipcRenderer.send('window-minimize');
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
    isMaximized,
    minimize,
    onMaximizedChange,
    quit,
    toggleMaximize,
};

export type Browser = typeof browser;
