import { constants, existsSync } from 'fs';
import { access, readdir, lstat, writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { Song } from '/@/renderer/api/types';
import { localSettings } from '/@/main/preload/local-settings';
import { ipcRenderer } from 'electron';

let cachePath: string;

const cacheFile = async (song: Song): Promise<void> => {
    if (!song.id || !song.serverId) return;

    const filePath = join(cachePath, `${song.serverId}-${song.id}`);

    try {
        await access(filePath, constants.F_OK);
        return;
    } catch (error) {
        const response = await fetch(song.streamUrl);
        const buffer = await response.arrayBuffer();
        await writeFile(filePath, Buffer.from(buffer));
    }
};

export const getPath = (song: Song): string => {
    const filePath = join(cachePath, `${song.serverId}-${song.id}`);
    if (existsSync(filePath)) {
        return `feishin-cache://${filePath}`;
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

export const openCacheDialog = (): Promise<string | null> => {
    return ipcRenderer.invoke('cache-open-dialog');
};

export const openCachePath = (path: string) => {
    ipcRenderer.invoke('cache-open-path', path);
};

export const purgeFiles = async (): Promise<void[]> => {
    const files = await readdir(cachePath);
    return Promise.all(files.map((file) => unlink(join(cachePath, file))));
};

export const getSize = async (): Promise<[number, number]> => {
    const files = await readdir(cachePath);
    const all = await Promise.all(files.map((file) => lstat(join(cachePath, file))));
    return all.reduce(
        ([count, size], curr) => {
            return [count + 1, size + curr.size];
        },
        [0, 0],
    );
};

export const cache = {
    cacheFile,
    getPath,
    getSize,
    isValidDirectory,
    openCacheDialog,
    openCachePath,
    purgeFiles,
    setCachePath,
};

export type Cache = typeof cache;
