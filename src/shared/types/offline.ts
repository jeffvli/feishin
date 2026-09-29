import type { Song } from '/@/shared/types/domain-types';

export type OfflineAlbum = {
    id: string;
    name: string;
    serverId: string;
    songIds: string[];
    syncedAt: string;
};

export type OfflineAlbumSyncRequest = {
    album: Pick<OfflineAlbum, 'id' | 'name' | 'serverId'>;
    silent?: boolean;
    tracks: OfflineDownloadRequest[];
};

export type OfflineAlbumSyncResult = {
    album: OfflineAlbum;
    downloaded: number;
    removed: number;
    unchanged: number;
};

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
    completedSongIds: string[];
    createdAt: string;
    error: null | string;
    failedSongIds: string[];
    id: string;
    itemIds: string[];
    itemType: OfflineDownloadItemType;
    name: string;
    serverId: string;
    silent: boolean;
    songIds: string[];
    state: 'cancelled' | 'complete' | 'downloading' | 'error' | 'queued';
    total: number;
    updatedAt: string;
};

export type OfflineEntry = {
    albumIds: string[];
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

export type OfflineRetryRequest = {
    taskId: string;
    tracks: OfflineDownloadRequest[];
};

export type OfflineStorageInfo = {
    custom: boolean;
    defaultDirectory: string;
    directory: string;
};
