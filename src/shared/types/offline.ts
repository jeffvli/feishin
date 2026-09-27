import type { Song } from '/@/shared/types/domain-types';

export type OfflineBatchDownloadRequest = {
    item: {
        ids: string[];
        name: string;
        serverId: string;
        type: OfflineDownloadItemType;
    };
    tracks: OfflineDownloadRequest[];
};

export type OfflineDownloadItemType = 'album' | 'playlist' | 'track';

export type OfflineDownloadRequest = {
    song: Song;
    url: string;
};

export type OfflineDownloadTask = {
    bytesDownloaded: number;
    bytesTotal: number;
    completed: number;
    createdAt: string;
    error: null | string;
    id: string;
    itemIds: string[];
    itemType: OfflineDownloadItemType;
    name: string;
    serverId: string;
    silent: boolean;
    songIds: string[];
    state: 'complete' | 'downloading' | 'error' | 'queued';
    total: number;
    updatedAt: string;
};

export type OfflineEntry = {
    downloadedAt: string;
    fileName: string;
    fingerprint: string;
    manual: boolean;
    playlistIds: string[];
    size: number;
    song: Song;
};

export type OfflinePlaybackSource = {
    filePath: string;
    url: string;
};

export type OfflinePlaylist = {
    id: string;
    name: string;
    serverId: string;
    songIds: string[];
    syncedAt: string;
};

export type OfflinePlaylistSyncRequest = {
    playlist: Pick<OfflinePlaylist, 'id' | 'name' | 'serverId'>;
    silent?: boolean;
    tracks: OfflineDownloadRequest[];
};

export type OfflinePlaylistSyncResult = {
    downloaded: number;
    playlist: OfflinePlaylist;
    removed: number;
    unchanged: number;
};

export type OfflineStorageInfo = {
    custom: boolean;
    defaultDirectory: string;
    directory: string;
};
