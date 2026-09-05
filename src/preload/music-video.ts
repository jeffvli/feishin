import { ipcRenderer } from 'electron';

export interface MusicVideoAssetStatus {
    ffmpeg: { path: null | string };
    ytdlp: { path: null | string; version: null | string };
}

export interface MusicVideoCacheStats {
    bytes: number;
    count: number;
}

export interface MusicVideoSearchResult {
    channel: null | string;
    durationSec: null | number;
    title: string;
    videoId: string;
}

const search = (query: string): Promise<MusicVideoSearchResult[]> => {
    return ipcRenderer.invoke('music-video-search', query);
};

const extractAudio = (videoId: string): Promise<Uint8Array> => {
    return ipcRenderer.invoke('music-video-extract-audio', videoId);
};

// The local track, decoded to the same mono low-rate wav the candidates are extracted to. Done in
// the main process because the stream URL is the music server's, not this app's origin, and
// because a whole decoded track is a far larger thing to hand the renderer than the fingerprint
// ever needs.
const extractLocalAudio = (streamUrl: string, maxSeconds: number): Promise<Uint8Array> => {
    return ipcRenderer.invoke('music-video-extract-local-audio', streamUrl, maxSeconds);
};

// Downloads a video-only stream for `videoId` into the main process's on-disk cache -
// resolving means the renderer can safely point a `<video src>` at
// `/music-video-cache/<videoId>.mp4` on its own origin. A video already cached is not
// re-fetched, only stamped as used again, which is what the cache's eviction order is built on.
// `cacheLimitBytes` is the size ceiling to prune down to afterwards; omitting it skips pruning.
// `maxHeight` caps the rendition downloaded; the main process validates it against the heights
// Settings offers and falls back to the default for anything else.
const downloadVideo = (
    videoId: string,
    cacheLimitBytes?: number,
    maxHeight?: number,
): Promise<void> => {
    return ipcRenderer.invoke('music-video-download-video', videoId, cacheLimitBytes, maxHeight);
};

const getCacheStats = (): Promise<MusicVideoCacheStats> => {
    return ipcRenderer.invoke('music-video-cache-stats');
};

const pruneCache = (limitBytes: number): Promise<void> => {
    return ipcRenderer.invoke('music-video-prune-cache', limitBytes);
};

const clearVideoCache = (): Promise<void> => {
    return ipcRenderer.invoke('music-video-clear-video-cache');
};

// The stored path overrides live in the same electron-store settings blob as `mpv_path`
// (`window.api.localSettings.get/set('ytdlp_path' | 'ffmpeg_path', ...)`); this asks the
// main process to actually resolve each binary (override, downloaded copy, or PATH), for
// the settings page's detection status line.
const getAssetStatus = (): Promise<MusicVideoAssetStatus> => {
    return ipcRenderer.invoke('music-video-asset-status');
};

// Triggers a fresh download of the given binary into `userData/bin` (also how "Update" is
// implemented - it's the same call, since it always fetches the latest release), and returns
// the status afterward.
const downloadAsset = (asset: 'ffmpeg' | 'ytdlp'): Promise<MusicVideoAssetStatus> => {
    return ipcRenderer.invoke('music-video-download-asset', asset);
};

export const musicVideo = {
    clearVideoCache,
    downloadAsset,
    downloadVideo,
    extractAudio,
    extractLocalAudio,
    getAssetStatus,
    getCacheStats,
    pruneCache,
    search,
};

export type MusicVideoApi = typeof musicVideo;
