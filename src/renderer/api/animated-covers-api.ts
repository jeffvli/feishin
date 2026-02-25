import isElectron from 'is-electron';
import { logFn } from '/@/renderer/utils/logger';

const animatedCoversIpc = isElectron() ? window.api.animatedCovers : null;

const animatedCoverCache = new Map<string, string | null>();

const getCacheKey = (albumName: string, artistName: string): string => {
    return `${albumName}|${artistName}`;
};

export const getAnimatedCoverUrl = async (
    albumName: string,
    artistName: string,
    apiBase?: string,
): Promise<string | null> => {
    if (!albumName || !artistName) {
        return null;
    }

    const cacheKey = getCacheKey(albumName, artistName);

    if (animatedCoverCache.has(cacheKey)) {
        const cachedUrl = animatedCoverCache.get(cacheKey);
        return cachedUrl || null;
    }

    if (!animatedCoversIpc) {
        return null;
    }

    try {
        const url = await animatedCoversIpc.getAnimatedCoverUrl(albumName, artistName, apiBase);

        // Store in cache (even if null to avoid re-fetching failed lookups)
        animatedCoverCache.set(cacheKey, url);

        return url;
    } catch (error) {
        if (error instanceof Error) {
            logFn.error('AnimatedCovers-API IPC error:', {
                meta: { message: error.message, name: error.name },
            });
        } else {
            logFn.error('AnimatedCovers-API Unknown IPC error:', { meta: { error } });
        }

        // Cache the failure to avoid repeated failed requests
        animatedCoverCache.set(cacheKey, null);

        return null;
    }
};

export const clearAnimatedCoverCache = () => {
    logFn.info('AnimatedCovers-API Clearing cache:', {
        meta: { previousSize: animatedCoverCache.size },
    });
    animatedCoverCache.clear();
};

export const getAnimatedCoverCacheSize = () => animatedCoverCache.size;
