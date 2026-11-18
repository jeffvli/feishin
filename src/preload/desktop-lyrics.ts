import type {
    DesktopLyricsLabels,
    DesktopLyricsSettings,
    DesktopLyricsSnapshot,
    DesktopLyricsState,
    DesktopLyricsUpdate,
} from '/@/shared/types/desktop-lyrics';

import { ipcRenderer } from 'electron';

export const desktopLyrics = {
    close: (): Promise<DesktopLyricsState> => ipcRenderer.invoke('desktop-lyrics-close'),
    getSettings: (): Promise<DesktopLyricsSettings> =>
        ipcRenderer.invoke('desktop-lyrics-settings'),
    getSnapshot: (): Promise<DesktopLyricsUpdate> => ipcRenderer.invoke('desktop-lyrics-snapshot'),
    getState: (): Promise<DesktopLyricsState> => ipcRenderer.invoke('desktop-lyrics-state'),
    onHover: (callback: (hovered: boolean) => void) => {
        const listener = (_event: Electron.IpcRendererEvent, hovered: boolean) => callback(hovered);
        ipcRenderer.on('desktop-lyrics-hover', listener);
        return () => {
            ipcRenderer.removeListener('desktop-lyrics-hover', listener);
        };
    },
    onOffset: (callback: (update: { offsetMs: number; trackKey: string }) => void) => {
        const listener = (
            _event: Electron.IpcRendererEvent,
            update: { offsetMs: number; trackKey: string },
        ) => callback(update);
        ipcRenderer.on('desktop-lyrics-offset-request', listener);
        return () => {
            ipcRenderer.removeListener('desktop-lyrics-offset-request', listener);
        };
    },
    onSettings: (callback: (settings: DesktopLyricsSettings) => void) => {
        const listener = (_event: Electron.IpcRendererEvent, settings: DesktopLyricsSettings) =>
            callback(settings);
        ipcRenderer.on('desktop-lyrics-settings-changed', listener);
        return () => {
            ipcRenderer.removeListener('desktop-lyrics-settings-changed', listener);
        };
    },
    onSnapshot: (callback: (update: DesktopLyricsUpdate) => void) => {
        const listener = (_event: Electron.IpcRendererEvent, data: DesktopLyricsUpdate) =>
            callback(data);
        ipcRenderer.on('desktop-lyrics-snapshot', listener);
        return () => {
            ipcRenderer.removeListener('desktop-lyrics-snapshot', listener);
        };
    },
    onState: (callback: (state: DesktopLyricsState) => void) => {
        const listener = (_event: Electron.IpcRendererEvent, state: DesktopLyricsState) =>
            callback(state);
        ipcRenderer.on('desktop-lyrics-state', listener);
        return () => {
            ipcRenderer.removeListener('desktop-lyrics-state', listener);
        };
    },
    open: (labels: DesktopLyricsLabels): Promise<DesktopLyricsState> =>
        ipcRenderer.invoke('desktop-lyrics-open', labels),
    openSettings: (): Promise<void> => ipcRenderer.invoke('desktop-lyrics-open-settings'),
    publish: (snapshot: DesktopLyricsSnapshot) =>
        ipcRenderer.send('desktop-lyrics-publish', snapshot),
    publishTime: (trackKey: null | string, timestamp: number) =>
        ipcRenderer.send('desktop-lyrics-time', { timestamp, trackKey }),
    resetSettings: (): Promise<DesktopLyricsSettings> =>
        ipcRenderer.invoke('desktop-lyrics-settings-reset'),
    restore: (labels: DesktopLyricsLabels): Promise<DesktopLyricsState> =>
        ipcRenderer.invoke('desktop-lyrics-restore', labels),
    selectFont: (): Promise<null | string> => ipcRenderer.invoke('desktop-lyrics-select-font'),
    setLocked: (locked: boolean): Promise<DesktopLyricsState> =>
        ipcRenderer.invoke('desktop-lyrics-lock', locked),
    setOffset: (trackKey: string, offsetMs: number): Promise<void> =>
        ipcRenderer.invoke('desktop-lyrics-offset', { offsetMs, trackKey }),
    setSettings: (settings: DesktopLyricsSettings): Promise<DesktopLyricsSettings> =>
        ipcRenderer.invoke('desktop-lyrics-settings-update', settings),
    toggleLayout: (): Promise<DesktopLyricsSettings> =>
        ipcRenderer.invoke('desktop-lyrics-layout-toggle'),
};
