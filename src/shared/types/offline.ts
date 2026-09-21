import type { Song } from '/@/shared/types/domain-types';

export type OfflineDownloadRequest = {
    song: Song;
    url: string;
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
    tracks: OfflineDownloadRequest[];
};

export type OfflinePlaylistSyncResult = {
    downloaded: number;
    playlist: OfflinePlaylist;
    removed: number;
    unchanged: number;
};
