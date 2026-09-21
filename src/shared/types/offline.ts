import type { Song } from '/@/shared/types/domain-types';

export type OfflineDownloadRequest = {
    song: Song;
    url: string;
};

export type OfflineEntry = {
    downloadedAt: string;
    fileName: string;
    size: number;
    song: Song;
};

export type OfflinePlaybackSource = {
    filePath: string;
    url: string;
};
