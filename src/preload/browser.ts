import { ipcRenderer } from 'electron';

const exit = () => {
    ipcRenderer.send('window-close');
};

const maximize = () => {
    ipcRenderer.send('window-maximize');
};

const minimize = () => {
    ipcRenderer.send('window-minimize');
};

const unmaximize = () => {
    ipcRenderer.send('window-unmaximize');
};

const quit = () => {
    ipcRenderer.send('window-quit');
};

const devtools = () => {
    ipcRenderer.send('window-dev-tools');
};

const clearCache = (): Promise<void> => {
    return ipcRenderer.invoke('window-clear-cache');
};

const clearImageCache = (): Promise<void> => {
    return ipcRenderer.invoke('image-cache-clear');
};

const getImageCacheStats = (): Promise<{
    entryCount: number;
    hitCount: number;
    missCount: number;
    totalSizeBytes: number;
}> => {
    return ipcRenderer.invoke('image-cache-stats');
};

const updateImageCacheConfig = (config: {
    enabled?: boolean;
    maxSizeMB?: number;
    rateLimitBurst?: number;
    rateLimitMaxConcurrent?: number;
    rateLimitRefillPerSec?: number;
}): Promise<void> => {
    return ipcRenderer.invoke('image-cache-config', config);
};

export const browser = {
    clearCache,
    clearImageCache,
    devtools,
    exit,
    getImageCacheStats,
    maximize,
    minimize,
    quit,
    unmaximize,
    updateImageCacheConfig,
};

export type Browser = typeof browser;
