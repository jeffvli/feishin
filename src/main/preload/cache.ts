import { existsSync } from 'fs';
import { lstat, writeFile } from 'fs/promises';
import { join } from 'path';
import { Song } from '/@/renderer/api/types';
import { localSettings } from '/@/main/preload/local-settings';

let cachePath: string;

const cacheFile = async (song: Song) => {
    const filePath = join(cachePath, `${song.serverId}-${song.id}`);
    const response = await fetch(song.streamUrl);
    const buffer = await response.arrayBuffer();
    return writeFile(filePath, Buffer.from(buffer));
};

export const getPath = (song: Song, prefix: string): string => {
    const filePath = join(cachePath, `${song.serverId}-${song.id}`);
    if (existsSync(filePath)) {
        return `${prefix}://${filePath}`;
    }
    return song.streamUrl;
};

export const isValidDirectory = async (path: string): Promise<boolean> => {
    try {
        return (await lstat(path)).isDirectory();
    } catch (error) {
        return false;
    }
};

export const setCachePath = (path: string): void => {
    cachePath = path;
    localSettings.set('cache.path', path);
};

export const cache = {
    cacheFile,
    getPath,
    isValidDirectory,
    setCachePath,
};

export type Cache = typeof cache;
