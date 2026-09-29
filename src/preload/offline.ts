import type {
    OfflineAlbum,
    OfflineAlbumSyncRequest,
    OfflineAlbumSyncResult,
    OfflineBatchDownloadRequest,
    OfflineDownloadRequest,
    OfflineDownloadTask,
    OfflineEntry,
    OfflinePlaybackSource,
    OfflinePlaylist,
    OfflinePlaylistSyncRequest,
    OfflinePlaylistSyncResult,
    OfflineRetryRequest,
    OfflineStorageInfo,
} from '/@/shared/types/offline';

import { ipcRenderer } from 'electron';

const download = (request: OfflineDownloadRequest): Promise<OfflineEntry> =>
    ipcRenderer.invoke('offline-download', request);

const downloadBatch = (request: OfflineBatchDownloadRequest): Promise<OfflineEntry[]> =>
    ipcRenderer.invoke('offline-download-batch', request);

const listDownloadTasks = (): Promise<OfflineDownloadTask[]> =>
    ipcRenderer.invoke('offline-download-tasks');

const cancelDownload = (taskId: string): Promise<boolean> =>
    ipcRenderer.invoke('offline-download-cancel', taskId);

const retryDownload = (request: OfflineRetryRequest): Promise<OfflineEntry[]> =>
    ipcRenderer.invoke('offline-download-retry', request);

const clearDownloadHistory = (): Promise<number> =>
    ipcRenderer.invoke('offline-download-history-clear');

const onDownloadProgress = (callback: (task: OfflineDownloadTask) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, task: OfflineDownloadTask) =>
        callback(task);
    ipcRenderer.on('offline-download-progress', listener);
    return () => ipcRenderer.removeListener('offline-download-progress', listener);
};

const getStorageInfo = (): Promise<OfflineStorageInfo> => ipcRenderer.invoke('offline-storage-get');

const list = (): Promise<OfflineEntry[]> => ipcRenderer.invoke('offline-list');

const listPlaylists = (): Promise<OfflinePlaylist[]> => ipcRenderer.invoke('offline-playlist-list');

const listAlbums = (): Promise<OfflineAlbum[]> => ipcRenderer.invoke('offline-album-list');

const remove = (serverId: string, songId: string): Promise<boolean> =>
    ipcRenderer.invoke('offline-remove', serverId, songId);

const resolve = (serverId: string, songId: string): Promise<null | OfflinePlaybackSource> =>
    ipcRenderer.invoke('offline-resolve', serverId, songId);

const selectStorageDirectory = (): Promise<null | string> =>
    ipcRenderer.invoke('offline-storage-select');

const setStorageDirectory = (directory: null | string): Promise<OfflineStorageInfo> =>
    ipcRenderer.invoke('offline-storage-set', directory);

const removePlaylist = (serverId: string, playlistId: string): Promise<number> =>
    ipcRenderer.invoke('offline-playlist-remove', serverId, playlistId);

const removeAlbum = (serverId: string, albumId: string): Promise<number> =>
    ipcRenderer.invoke('offline-album-remove', serverId, albumId);

const syncAlbum = (request: OfflineAlbumSyncRequest): Promise<OfflineAlbumSyncResult> =>
    ipcRenderer.invoke('offline-album-sync', request);

const syncPlaylist = (request: OfflinePlaylistSyncRequest): Promise<OfflinePlaylistSyncResult> =>
    ipcRenderer.invoke('offline-playlist-sync', request);

export const offline = {
    cancelDownload,
    clearDownloadHistory,
    download,
    downloadBatch,
    getStorageInfo,
    list,
    listAlbums,
    listDownloadTasks,
    listPlaylists,
    onDownloadProgress,
    remove,
    removeAlbum,
    removePlaylist,
    resolve,
    retryDownload,
    selectStorageDirectory,
    setStorageDirectory,
    syncAlbum,
    syncPlaylist,
};

export type Offline = typeof offline;
