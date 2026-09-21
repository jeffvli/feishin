import type {
    OfflineDownloadRequest,
    OfflineEntry,
    OfflinePlaybackSource,
    OfflinePlaylist,
    OfflinePlaylistSyncRequest,
    OfflinePlaylistSyncResult,
} from '/@/shared/types/offline';

import { ipcRenderer } from 'electron';

const download = (request: OfflineDownloadRequest): Promise<OfflineEntry> =>
    ipcRenderer.invoke('offline-download', request);

const list = (): Promise<OfflineEntry[]> => ipcRenderer.invoke('offline-list');

const listPlaylists = (): Promise<OfflinePlaylist[]> => ipcRenderer.invoke('offline-playlist-list');

const remove = (serverId: string, songId: string): Promise<boolean> =>
    ipcRenderer.invoke('offline-remove', serverId, songId);

const resolve = (serverId: string, songId: string): Promise<null | OfflinePlaybackSource> =>
    ipcRenderer.invoke('offline-resolve', serverId, songId);

const removePlaylist = (serverId: string, playlistId: string): Promise<number> =>
    ipcRenderer.invoke('offline-playlist-remove', serverId, playlistId);

const syncPlaylist = (request: OfflinePlaylistSyncRequest): Promise<OfflinePlaylistSyncResult> =>
    ipcRenderer.invoke('offline-playlist-sync', request);

export const offline = {
    download,
    list,
    listPlaylists,
    remove,
    removePlaylist,
    resolve,
    syncPlaylist,
};

export type Offline = typeof offline;
