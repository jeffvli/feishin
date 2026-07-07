import { ipcRenderer } from 'electron';

import {
    DownloadProgress,
    DownloadsManifest,
    StartDownloadPayload,
} from '/@/shared/types/downloads';

export const downloads = {
    cancel: (items: Array<{ serverId: string; songId: string }>) =>
        ipcRenderer.invoke('downloads-cancel', items),
    delete: (items: Array<{ serverId: string; songId: string }>): Promise<DownloadsManifest> =>
        ipcRenderer.invoke('downloads-delete', items),
    enqueue: (payloads: StartDownloadPayload[]) =>
        ipcRenderer.invoke('downloads-enqueue', payloads),
    list: (): Promise<DownloadsManifest> => ipcRenderer.invoke('downloads-list'),
    onProgress: (cb: (p: DownloadProgress) => void) => {
        const listener = (_: unknown, p: DownloadProgress) => cb(p);
        ipcRenderer.on('downloads-progress', listener);
        return () => ipcRenderer.removeListener('downloads-progress', listener);
    },
    pickFolder: (): Promise<DownloadsManifest> => ipcRenderer.invoke('downloads-pick-folder'),
    reconcile: (): Promise<DownloadsManifest> => ipcRenderer.invoke('downloads-reconcile'),
};

export type Downloads = typeof downloads;
