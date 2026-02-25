import { ipcMain } from 'electron';

import {
    ANIMATED_COVERS_API_BASE,
    ANIMATED_COVERS_API_ENDPOINT,
    REQUEST_TIMEOUT,
} from './constants';
import { AnimatedCoverResponse } from './types';

const getAnimatedCoverUrl = async (
    albumName: string,
    artistName: string,
    apiBase?: string,
): Promise<null | string> => {
    const baseUrl = apiBase || ANIMATED_COVERS_API_BASE;

    if (!albumName || !artistName) {
        return null;
    }

    try {
        const controller = new AbortController();
        const params = new URLSearchParams({
            album: albumName,
            artist: artistName,
        });
        const url = `${baseUrl}${ANIMATED_COVERS_API_ENDPOINT}?${params.toString()}`;

        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        const response = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            return null;
        }

        const data: AnimatedCoverResponse = await response.json();

        return data.url || null;
    } catch (error) {
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                console.warn(`AnimatedCovers Request timeout after ${REQUEST_TIMEOUT / 1000}s`);
            } else {
                console.error('AnimatedCovers Fetch error:', error.message);
            }
        } else {
            console.error('AnimatedCovers Unknown error:', error);
        }
        return null;
    }
};

ipcMain.handle(
    'animated-cover-url',
    async (_event, albumName: string, artistName: string, apiBase?: string) => {
        return getAnimatedCoverUrl(albumName, artistName, apiBase);
    },
);

export const animatedCovers = {
    getAnimatedCoverUrl,
};

export * from './constants';
export * from './types';
