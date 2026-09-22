import type {
    OfflineDownloadRequest,
    OfflineEntry,
    OfflinePlaybackSource,
    OfflinePlaylist,
    OfflinePlaylistSyncRequest,
    OfflinePlaylistSyncResult,
    OfflineStorageInfo,
} from '/@/shared/types/offline';

import { ipcRenderer } from 'electron';

const download = (request: OfflineDownloadRequest): Promise<OfflineEntry> =>
    ipcRenderer.invoke('offline-download', request);

const getStorageInfo = (): Promise<OfflineStorageInfo> => ipcRenderer.invoke('offline-storage-get');

const list = (): Promise<OfflineEntry[]> => ipcRenderer.invoke('offline-list');

const listPlaylists = (): Promise<OfflinePlaylist[]> => ipcRenderer.invoke('offline-playlist-list');

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

const syncPlaylist = (request: OfflinePlaylistSyncRequest): Promise<OfflinePlaylistSyncResult> =>
    ipcRenderer.invoke('offline-playlist-sync', request);

export const offline = {
    download,
    getStorageInfo,
    list,
    listPlaylists,
    remove,
    removePlaylist,
    resolve,
    selectStorageDirectory,
    setStorageDirectory,
    syncPlaylist,
};

export type Offline = typeof offline;
