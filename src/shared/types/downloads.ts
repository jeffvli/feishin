import { QueueSong } from '/@/shared/types/domain-types';

export interface DownloadedSong {
    absolutePath: string;
    bytes: number;
    downloadedAt: number;
    relativePath: string;
    serverId: string;
    serverType: 'jellyfin' | 'navidrome' | 'subsonic';
    songId: string;
    sourceAlbum?: string;
    sourceArtist?: string;
    sourceTitle: string;
}

export interface DownloadProgress {
    bytesPerSecond?: number;
    bytesReceived: number;
    bytesTotal: number;
    error?: string;
    serverId: string;
    songId: string;
    status: DownloadStatus;
    title?: string;
}

export interface DownloadsManifest {
    folder: string;
    songs: Record<string, DownloadedSong>;
    version: 1;
}

export type DownloadStatus = 'cancelled' | 'completed' | 'downloading' | 'failed' | 'queued';

export interface StartDownloadPayload {
    downloadUrl: string;
    serverType: 'jellyfin' | 'navidrome' | 'subsonic';
    song: Pick<QueueSong, '_serverId' | 'album' | 'artistName' | 'id' | 'name'>;
}

export const downloadKey = (serverId: string, songId: string) => `${serverId}:${songId}`;
