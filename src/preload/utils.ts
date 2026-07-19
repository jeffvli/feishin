import { ipcRenderer, type IpcRendererEvent, webFrame } from 'electron';

import type {
    ArtworkOp,
    BatchProgress,
    ReadLocalImageResult,
    ReadSongMetadataBatchResult,
    TagValue,
    WriteSongTagsBatchResult,
} from '../shared/types/tag-editor';

import { disableAutoUpdates, isLinux, isMacOS, isWindows } from '../main/env';

const openItem = async (path: string) => {
    return ipcRenderer.invoke('open-item', path);
};

const cancelReadSongMetadata = (): void => {
    ipcRenderer.invoke('cancel-read-song-metadata');
};

const readSongMetadataBatch = (filePaths: string[]): Promise<ReadSongMetadataBatchResult> => {
    return ipcRenderer.invoke('read-song-metadata-batch', filePaths);
};

const writeSongTagsBatch = (
    filePaths: string[],
    edits: Record<string, TagValue>,
    removed: string[],
    artworkOp?: ArtworkOp,
): Promise<WriteSongTagsBatchResult> => {
    return ipcRenderer.invoke('write-song-tags-batch', filePaths, edits, removed, artworkOp);
};

const onBatchProgress = (cb: (event: IpcRendererEvent, data: BatchProgress) => void) => {
    ipcRenderer.on('batch-progress', cb);
};

const offBatchProgress = (cb: (event: IpcRendererEvent, data: BatchProgress) => void) => {
    ipcRenderer.removeListener('batch-progress', cb);
};

const readLocalImage = (filePath: string): Promise<ReadLocalImageResult> => {
    return ipcRenderer.invoke('read-local-image', filePath);
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

const rendererOpenCreatePlaylist = (cb: () => void) => {
    ipcRenderer.on('renderer-open-create-playlist', () => cb());
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
    cancelReadSongMetadata,
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
    offBatchProgress,
    onBatchProgress,
    openApplicationDirectory,
    openCustomCssFolder,
    openItem,
    playerErrorListener,
    readLocalImage,
    readSongMetadataBatch,
    rendererOpenCommandPalette,
    rendererOpenCreatePlaylist,
    rendererOpenManageServers,
    rendererOpenReleaseNotes,
    rendererOpenSettings,
    rendererTogglePrivateMode,
    rendererToggleSidebar,
    rendererUpdateAvailable,
    saveCustomCss,
    separator: isWindows() ? '\\' : '/',
    setInputFocused,
    startPowerSaveBlocker,
    stopPowerSaveBlocker,
    writeSongTagsBatch,
};

export type Utils = typeof utils;
