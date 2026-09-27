import type {
    OfflineBatchDownloadRequest,
    OfflineDownloadRequest,
    OfflineDownloadTask,
    OfflineEntry,
    OfflinePlaybackSource,
    OfflinePlaylist,
    OfflinePlaylistSyncRequest,
    OfflinePlaylistSyncResult,
    OfflineStorageInfo,
} from '/@/shared/types/offline';

import { app, BrowserWindow, dialog, ipcMain, net } from 'electron';
import { createHash, randomUUID } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Readable, Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { store } from '/@/main/features/core/settings';
import log from '/@/main/logger';

type OfflineManifest = {
    entries: Record<string, OfflineEntry>;
    playlists: Record<string, OfflinePlaylist>;
    version: 2;
};

type OfflineManifestV1 = {
    entries: Record<string, Omit<OfflineEntry, 'fingerprint' | 'manual' | 'playlistIds'>>;
    version: 1;
};

const EMPTY_MANIFEST: OfflineManifest = { entries: {}, playlists: {}, version: 2 };
const OFFLINE_DIRECTORY_SETTING = 'offline_download_directory';
const downloadTasks = new Map<string, OfflineDownloadTask>();
const lastTaskEmit = new Map<string, number>();
let manifestUpdate = Promise.resolve();

const emitTask = (task: OfflineDownloadTask, force = false) => {
    const now = Date.now();
    if (!force && now - (lastTaskEmit.get(task.id) ?? 0) < 100) return;

    task.updatedAt = new Date(now).toISOString();
    lastTaskEmit.set(task.id, now);
    for (const window of BrowserWindow.getAllWindows()) {
        window.webContents.send('offline-download-progress', task);
    }
};

const createTask = (
    item: OfflineBatchDownloadRequest['item'],
    tracks: OfflineDownloadRequest[],
    silent = false,
): OfflineDownloadTask => {
    const finishedTasks = [...downloadTasks.values()]
        .filter((task) => task.state === 'complete' || task.state === 'error')
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    while (downloadTasks.size >= 50 && finishedTasks.length > 0) {
        const finishedTask = finishedTasks.shift();
        if (!finishedTask) break;
        downloadTasks.delete(finishedTask.id);
        lastTaskEmit.delete(finishedTask.id);
    }

    const now = new Date().toISOString();
    const task: OfflineDownloadTask = {
        bytesDownloaded: 0,
        bytesTotal: tracks.reduce((total, track) => total + Math.max(0, track.song.size || 0), 0),
        completed: 0,
        createdAt: now,
        error: null,
        id: randomUUID(),
        itemIds: item.ids,
        itemType: item.type,
        name: item.name,
        serverId: item.serverId,
        silent,
        songIds: tracks.map((track) => track.song.id),
        state: 'queued',
        total: tracks.length,
        updatedAt: now,
    };
    downloadTasks.set(task.id, task);
    emitTask(task, true);
    return task;
};

const failTask = (task: OfflineDownloadTask, error: unknown) => {
    task.error = error instanceof Error ? error.message : 'Download failed';
    task.state = 'error';
    emitTask(task, true);
};

const getDefaultOfflineRoot = () => path.join(app.getPath('userData'), 'offline');
const getManifestPath = () => path.join(getDefaultOfflineRoot(), 'manifest.json');
const getOfflineRoot = () => {
    const configuredDirectory = store.get(OFFLINE_DIRECTORY_SETTING);
    return typeof configuredDirectory === 'string' && path.isAbsolute(configuredDirectory)
        ? path.resolve(configuredDirectory)
        : getDefaultOfflineRoot();
};
const getEntryKey = (serverId: string, songId: string) => `${serverId}:${songId}`;
const getPlaylistKey = (serverId: string, playlistId: string) => `${serverId}:${playlistId}`;
const hashPart = (value: string) => createHash('sha256').update(value).digest('hex');

const getFingerprint = (song: OfflineDownloadRequest['song']) =>
    JSON.stringify([
        song.updatedAt,
        song.size,
        song.duration,
        song.bitRate,
        song.codec,
        song.container,
        song.sampleRate,
    ]);

const resolveEntryPath = (fileName: string, directory = getOfflineRoot()) => {
    const root = path.resolve(directory);
    const filePath = path.resolve(root, fileName);
    const relativePath = path.relative(root, filePath);
    return relativePath &&
        relativePath !== '..' &&
        !relativePath.startsWith(`..${path.sep}`) &&
        !path.isAbsolute(relativePath)
        ? filePath
        : null;
};

const getStorageInfo = (): OfflineStorageInfo => {
    const defaultDirectory = path.resolve(getDefaultOfflineRoot());
    const directory = path.resolve(getOfflineRoot());
    return {
        custom: directory !== defaultDirectory,
        defaultDirectory,
        directory,
    };
};

const getExtension = (request: OfflineDownloadRequest) => {
    const container = request.song.container?.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (container) return container;

    try {
        const extension = path.extname(new URL(request.url).pathname).slice(1).toLowerCase();
        if (/^[a-z0-9]{1,10}$/.test(extension)) return extension;
    } catch {
        // The URL is validated by net.fetch below.
    }

    return 'audio';
};

const readManifest = async (): Promise<OfflineManifest> => {
    try {
        const contents = await fs.readFile(getManifestPath(), 'utf8');
        const parsed = JSON.parse(contents) as OfflineManifest | OfflineManifestV1;
        if (parsed.version === 2 && parsed.entries && parsed.playlists) return parsed;
        if (parsed.version === 1 && parsed.entries) {
            return {
                entries: Object.fromEntries(
                    Object.entries(parsed.entries).map(([key, entry]) => [
                        key,
                        {
                            ...entry,
                            fingerprint: getFingerprint(entry.song),
                            manual: true,
                            playlistIds: [],
                        },
                    ]),
                ),
                playlists: {},
                version: 2,
            };
        }
        return { ...EMPTY_MANIFEST, entries: {}, playlists: {} };
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            log.warn('Failed to read offline manifest; starting with an empty manifest', error);
        }
        return { ...EMPTY_MANIFEST, entries: {}, playlists: {} };
    }
};

const writeManifest = async (manifest: OfflineManifest) => {
    await fs.mkdir(getDefaultOfflineRoot(), { recursive: true });
    const manifestPath = getManifestPath();
    const temporaryPath = `${manifestPath}.tmp`;
    await fs.writeFile(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    await fs.rename(temporaryPath, manifestPath);
};

const migrateStorage = async (directory: null | string): Promise<OfflineStorageInfo> => {
    const sourceDirectory = path.resolve(getOfflineRoot());
    const defaultDirectory = path.resolve(getDefaultOfflineRoot());
    const targetDirectory = directory ? path.resolve(directory) : defaultDirectory;

    if (directory && !path.isAbsolute(directory)) {
        throw new Error('Offline download location must be an absolute path');
    }

    if (sourceDirectory === targetDirectory) {
        if (targetDirectory === defaultDirectory) {
            store.delete(OFFLINE_DIRECTORY_SETTING);
        } else {
            store.set(OFFLINE_DIRECTORY_SETTING, targetDirectory);
        }
        return getStorageInfo();
    }

    await fs.mkdir(targetDirectory, { recursive: true });
    const writeTestPath = path.join(
        targetDirectory,
        `.katiesamp-write-test-${process.pid}-${Date.now()}`,
    );
    try {
        await fs.writeFile(writeTestPath, '');
    } finally {
        await fs.rm(writeTestPath, { force: true });
    }

    const manifest = await readManifest();
    const copiedFiles: Array<{ source: string; target: string }> = [];

    for (const entry of Object.values(manifest.entries)) {
        const sourcePath = resolveEntryPath(entry.fileName, sourceDirectory);
        const targetPath = resolveEntryPath(entry.fileName, targetDirectory);
        if (!sourcePath || !targetPath) continue;

        const sourceExists = await fs
            .access(sourcePath)
            .then(() => true)
            .catch(() => false);
        if (!sourceExists) continue;

        await fs.mkdir(path.dirname(targetPath), { recursive: true });
        const temporaryPath = `${targetPath}.migrating`;
        try {
            await fs.rm(temporaryPath, { force: true });
            await fs.copyFile(sourcePath, temporaryPath);
            await fs.rm(targetPath, { force: true });
            await fs.rename(temporaryPath, targetPath);
            copiedFiles.push({ source: sourcePath, target: targetPath });
        } catch (error) {
            await fs.rm(temporaryPath, { force: true });
            throw error;
        }
    }

    if (targetDirectory === defaultDirectory) {
        store.delete(OFFLINE_DIRECTORY_SETTING);
    } else {
        store.set(OFFLINE_DIRECTORY_SETTING, targetDirectory);
    }

    for (const file of copiedFiles) {
        try {
            await fs.rm(file.source, { force: true });
            await fs.rmdir(path.dirname(file.source)).catch(() => undefined);
        } catch (error) {
            log.warn('Failed to remove an old offline track after migration', {
                error,
                filePath: file.source,
            });
        }
    }

    log.info('Offline download location changed', {
        directory: targetDirectory,
        movedFiles: copiedFiles.length,
    });
    return getStorageInfo();
};

const setStorageDirectory = (directory: null | string): Promise<OfflineStorageInfo> => {
    const operation = manifestUpdate.then(() => migrateStorage(directory));
    manifestUpdate = operation.then(
        () => undefined,
        () => undefined,
    );
    return operation;
};

const updateManifest = <T>(update: (manifest: OfflineManifest) => Promise<T> | T): Promise<T> => {
    const operation = manifestUpdate.then(async () => {
        const manifest = await readManifest();
        const result = await update(manifest);
        await writeManifest(manifest);
        return result;
    });
    manifestUpdate = operation.then(
        () => undefined,
        () => undefined,
    );
    return operation;
};

export const resolveOfflineSource = async (
    serverId: string,
    songId: string,
): Promise<null | OfflinePlaybackSource> => {
    const manifest = await readManifest();
    const entry = manifest.entries[getEntryKey(serverId, songId)];
    if (!entry) return null;

    const filePath = resolveEntryPath(entry.fileName);
    if (!filePath) return null;
    try {
        await fs.access(filePath);
    } catch {
        return null;
    }

    const url = new URL('feishin-offline://media');
    url.searchParams.set('serverId', serverId);
    url.searchParams.set('songId', songId);

    return { filePath, url: url.toString() };
};

const download = async (
    request: OfflineDownloadRequest,
    ownership: { manual?: boolean; playlistId?: string } = { manual: true },
    onBytes?: (bytes: number) => void,
): Promise<OfflineEntry> => {
    const serverDirectory = hashPart(request.song._serverId);
    const relativeFileName = path.join(
        serverDirectory,
        `${hashPart(request.song.id)}.${getExtension(request)}`,
    );
    const destinationPath = path.join(getOfflineRoot(), relativeFileName);
    const temporaryPath = `${destinationPath}.part`;

    await fs.mkdir(path.dirname(destinationPath), { recursive: true });

    try {
        const response = await net.fetch(request.url);
        if (!response.ok || !response.body) {
            throw new Error(`Download failed with HTTP ${response.status}`);
        }

        const progress = new Transform({
            transform(chunk: Buffer, _encoding, callback) {
                onBytes?.(chunk.length);
                callback(null, chunk);
            },
        });
        await pipeline(
            Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]),
            progress,
            createWriteStream(temporaryPath),
        );
        await fs.rm(destinationPath, { force: true });
        await fs.rename(temporaryPath, destinationPath);

        const stat = await fs.stat(destinationPath);
        const entry = await updateManifest(async (manifest): Promise<OfflineEntry> => {
            const key = getEntryKey(request.song._serverId, request.song.id);
            const existing = manifest.entries[key];
            if (existing && existing.fileName !== relativeFileName) {
                const previousPath = resolveEntryPath(existing.fileName);
                if (previousPath) await fs.rm(previousPath, { force: true });
            }
            const playlistIds = new Set(existing?.playlistIds ?? []);
            if (ownership.playlistId) playlistIds.add(ownership.playlistId);

            const nextEntry: OfflineEntry = {
                downloadedAt: new Date().toISOString(),
                fileName: relativeFileName,
                fingerprint: getFingerprint(request.song),
                manual: Boolean(ownership.manual || existing?.manual),
                playlistIds: [...playlistIds],
                size: stat.size,
                song: { ...request.song, imageUrl: null },
            };
            manifest.entries[key] = nextEntry;
            return nextEntry;
        });
        return entry;
    } catch (error) {
        await fs.rm(temporaryPath, { force: true });
        log.error('Failed to download track for offline playback', {
            error,
            serverId: request.song._serverId,
            songId: request.song.id,
        });
        throw error;
    }
};

const downloadBatch = async (request: OfflineBatchDownloadRequest): Promise<OfflineEntry[]> => {
    const tracks = [...new Map(request.tracks.map((track) => [track.song.id, track])).values()];
    const task = createTask(request.item, tracks);
    const entries: OfflineEntry[] = [];

    try {
        task.state = 'downloading';
        emitTask(task, true);
        for (const track of tracks) {
            const entry = await download(track, { manual: true }, (bytes) => {
                task.bytesDownloaded += bytes;
                emitTask(task);
            });
            entries.push(entry);
            task.completed += 1;
            emitTask(task, true);
        }
        task.bytesTotal = Math.max(task.bytesTotal, task.bytesDownloaded);
        task.bytesDownloaded = task.bytesTotal;
        task.state = 'complete';
        emitTask(task, true);
        return entries;
    } catch (error) {
        failTask(task, error);
        throw error;
    }
};

const remove = async (serverId: string, songId: string): Promise<boolean> => {
    return updateManifest(async (manifest) => {
        const key = getEntryKey(serverId, songId);
        const entry = manifest.entries[key];
        if (!entry) return false;

        const filePath = resolveEntryPath(entry.fileName);
        if (filePath) await fs.rm(filePath, { force: true });
        delete manifest.entries[key];
        for (const playlist of Object.values(manifest.playlists)) {
            if (playlist.serverId === serverId) {
                playlist.songIds = playlist.songIds.filter((id) => id !== songId);
            }
        }
        return true;
    });
};

const removePlaylist = async (serverId: string, playlistId: string): Promise<number> => {
    return updateManifest(async (manifest) => {
        const key = getPlaylistKey(serverId, playlistId);
        if (!manifest.playlists[key]) return 0;

        let removed = 0;
        for (const [entryKey, entry] of Object.entries(manifest.entries)) {
            if (entry.song._serverId !== serverId || !entry.playlistIds.includes(playlistId)) {
                continue;
            }

            entry.playlistIds = entry.playlistIds.filter((id) => id !== playlistId);
            if (!entry.manual && entry.playlistIds.length === 0) {
                const filePath = resolveEntryPath(entry.fileName);
                if (filePath) await fs.rm(filePath, { force: true });
                delete manifest.entries[entryKey];
                removed += 1;
            }
        }
        delete manifest.playlists[key];
        return removed;
    });
};

const syncPlaylist = async (
    request: OfflinePlaylistSyncRequest,
): Promise<OfflinePlaylistSyncResult> => {
    const tracks = [...new Map(request.tracks.map((track) => [track.song.id, track])).values()];
    const task = createTask(
        {
            ids: [request.playlist.id],
            name: request.playlist.name,
            serverId: request.playlist.serverId,
            type: 'playlist',
        },
        tracks,
        request.silent,
    );

    try {
        task.state = 'downloading';
        emitTask(task, true);
        let downloaded = 0;
        let unchanged = 0;

        for (const track of tracks) {
            const manifest = await readManifest();
            const entry = manifest.entries[getEntryKey(request.playlist.serverId, track.song.id)];
            const filePath = entry && resolveEntryPath(entry.fileName);
            const fileExists = filePath
                ? await fs
                      .access(filePath)
                      .then(() => true)
                      .catch(() => false)
                : false;

            if (!entry || !fileExists || entry.fingerprint !== getFingerprint(track.song)) {
                await download(
                    track,
                    { manual: false, playlistId: request.playlist.id },
                    (bytes) => {
                        task.bytesDownloaded += bytes;
                        emitTask(task);
                    },
                );
                downloaded += 1;
            } else {
                await updateManifest((nextManifest) => {
                    const nextEntry =
                        nextManifest.entries[getEntryKey(request.playlist.serverId, track.song.id)];
                    if (!nextEntry) return;
                    nextEntry.playlistIds = [
                        ...new Set([request.playlist.id, ...nextEntry.playlistIds]),
                    ];
                    nextEntry.song = { ...track.song, imageUrl: null };
                });
                task.bytesDownloaded += Math.max(0, track.song.size || 0);
                unchanged += 1;
            }
            task.completed += 1;
            emitTask(task, true);
        }

        const songIds = tracks.map((track) => track.song.id);
        let removed = 0;
        const playlist = await updateManifest(async (manifest): Promise<OfflinePlaylist> => {
            const key = getPlaylistKey(request.playlist.serverId, request.playlist.id);
            const previousSongIds = new Set(manifest.playlists[key]?.songIds ?? []);
            const currentSongIds = new Set(songIds);

            for (const songId of previousSongIds) {
                if (currentSongIds.has(songId)) continue;
                const entryKey = getEntryKey(request.playlist.serverId, songId);
                const entry = manifest.entries[entryKey];
                if (!entry) continue;

                entry.playlistIds = entry.playlistIds.filter((id) => id !== request.playlist.id);
                if (!entry.manual && entry.playlistIds.length === 0) {
                    const filePath = resolveEntryPath(entry.fileName);
                    if (filePath) await fs.rm(filePath, { force: true });
                    delete manifest.entries[entryKey];
                    removed += 1;
                }
            }

            const nextPlaylist: OfflinePlaylist = {
                ...request.playlist,
                songIds,
                syncedAt: new Date().toISOString(),
            };
            manifest.playlists[key] = nextPlaylist;
            return nextPlaylist;
        });

        task.bytesTotal = Math.max(task.bytesTotal, task.bytesDownloaded);
        task.bytesDownloaded = task.bytesTotal;
        task.state = 'complete';
        emitTask(task, true);
        return { downloaded, playlist, removed, unchanged };
    } catch (error) {
        failTask(task, error);
        throw error;
    }
};

ipcMain.handle('offline-download', async (_event, request: OfflineDownloadRequest) => {
    const [entry] = await downloadBatch({
        item: {
            ids: [request.song.id],
            name: request.song.name,
            serverId: request.song._serverId,
            type: 'track',
        },
        tracks: [request],
    });
    return entry;
});
ipcMain.handle('offline-download-batch', (_event, request: OfflineBatchDownloadRequest) =>
    downloadBatch(request),
);
ipcMain.handle('offline-download-tasks', (): OfflineDownloadTask[] =>
    [...downloadTasks.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
);
ipcMain.handle('offline-storage-get', () => getStorageInfo());
ipcMain.handle('offline-storage-select', async (): Promise<null | string> => {
    const result = await dialog.showOpenDialog({
        defaultPath: getOfflineRoot(),
        properties: ['openDirectory', 'createDirectory'],
        title: 'Choose offline download location',
    });
    return result.canceled ? null : result.filePaths[0] || null;
});
ipcMain.handle('offline-storage-set', (_event, directory: null | string) =>
    setStorageDirectory(directory),
);
ipcMain.handle('offline-list', async (): Promise<OfflineEntry[]> => {
    const manifest = await readManifest();
    const entries = await Promise.all(
        Object.values(manifest.entries).map(async (entry) => {
            const filePath = resolveEntryPath(entry.fileName);
            if (!filePath) return null;
            const exists = await fs
                .access(filePath)
                .then(() => true)
                .catch(() => false);
            return exists ? entry : null;
        }),
    );
    return entries.filter((entry): entry is OfflineEntry => entry !== null);
});
ipcMain.handle('offline-playlist-list', async (): Promise<OfflinePlaylist[]> => {
    const manifest = await readManifest();
    return Object.values(manifest.playlists);
});
ipcMain.handle('offline-playlist-remove', (_event, serverId: string, playlistId: string) =>
    removePlaylist(serverId, playlistId),
);
ipcMain.handle('offline-playlist-sync', (_event, request: OfflinePlaylistSyncRequest) =>
    syncPlaylist(request),
);
ipcMain.handle('offline-remove', (_event, serverId: string, songId: string) =>
    remove(serverId, songId),
);
ipcMain.handle('offline-resolve', (_event, serverId: string, songId: string) =>
    resolveOfflineSource(serverId, songId),
);
