import type {
    OfflineDownloadRequest,
    OfflineEntry,
    OfflinePlaybackSource,
} from '/@/shared/types/offline';

import { ipcRenderer } from 'electron';

const download = (request: OfflineDownloadRequest): Promise<OfflineEntry> =>
    ipcRenderer.invoke('offline-download', request);

const list = (): Promise<OfflineEntry[]> => ipcRenderer.invoke('offline-list');

const remove = (serverId: string, songId: string): Promise<boolean> =>
    ipcRenderer.invoke('offline-remove', serverId, songId);

const resolve = (serverId: string, songId: string): Promise<null | OfflinePlaybackSource> =>
    ipcRenderer.invoke('offline-resolve', serverId, songId);

export const offline = { download, list, remove, resolve };

export type Offline = typeof offline;
