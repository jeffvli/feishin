import { logFn } from '/@/renderer/utils/logger';

const ANIMATED_COVERS_API_BASE = 'https://artwork.m8tec.top';
const ANIMATED_COVERS_API_ENDPOINT = '/api/v1/artwork/search';
const REQUEST_TIMEOUT = 10000;

interface AnimatedCoverResponse {
    album?: string;
    artist?: string;
    isCached?: boolean;
    url?: string;
}

const animatedCoverCache = new Map<string, null | string>();

const getCacheKey = (albumName: string, artistName: string): string => {
    return `${albumName}|${artistName}`;
};

export const getAnimatedCoverUrl = async (
    albumName: string,
    artistName: string,
    apiBase?: string,
): Promise<null | string> => {
    if (!albumName || !artistName) {
        return null;
    }

    const cacheKey = getCacheKey(albumName, artistName);

    if (animatedCoverCache.has(cacheKey)) {
        return animatedCoverCache.get(cacheKey) || null;
    }

    const baseUrl = apiBase || ANIMATED_COVERS_API_BASE;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        const params = new URLSearchParams({
            album: albumName,
            artist: artistName,
        });
        const url = `${baseUrl}${ANIMATED_COVERS_API_ENDPOINT}?${params.toString()}`;

        const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            animatedCoverCache.set(cacheKey, null);
            return null;
        }

        const data: AnimatedCoverResponse = await response.json();
        const coverUrl = data.url || null;

        animatedCoverCache.set(cacheKey, coverUrl);
        return coverUrl;
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                logFn.warn(`AnimatedCovers-API Request timeout after ${REQUEST_TIMEOUT / 1000}s`, {
                    meta: { album: albumName, artist: artistName },
                });
            } else {
                logFn.error('AnimatedCovers-API Fetch error:', {
                    meta: { message: error.message, name: error.name },
                });
            }
        } else {
            logFn.error('AnimatedCovers-API Unknown fetch error:', { meta: { error } });
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
