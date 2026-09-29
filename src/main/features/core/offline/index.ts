import type {
    OfflineAlbum,
    OfflineAlbumSyncRequest,
    OfflineAlbumSyncResult,
    OfflineBatchDownloadRequest,
    OfflineDownloadRequest,
    OfflineDownloadTask,
    OfflineEntry,
    OfflinePlaybackSource,
    OfflinePlaylist,
    OfflinePlaylistSyncRequest,
    OfflinePlaylistSyncResult,
    OfflineRetryRequest,
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
    albums: Record<string, OfflineAlbum>;
    entries: Record<string, OfflineEntry>;
    playlists: Record<string, OfflinePlaylist>;
    version: 3;
};

type OfflineManifestV1 = {
    entries: Record<
        string,
        Omit<OfflineEntry, 'albumIds' | 'fingerprint' | 'manual' | 'playlistIds'>
    >;
    version: 1;
};

type OfflineManifestV2 = {
    entries: Record<string, Omit<OfflineEntry, 'albumIds'>>;
    playlists: Record<string, OfflinePlaylist>;
    version: 2;
};

const EMPTY_MANIFEST: OfflineManifest = { albums: {}, entries: {}, playlists: {}, version: 3 };
const OFFLINE_DIRECTORY_SETTING = 'offline_download_directory';
const activeJobs = new Map<string, { cancelled: boolean; controllers: Set<AbortController> }>();
const downloadTasks = new Map<string, OfflineDownloadTask>();
const lastTaskEmit = new Map<string, number>();
let activeDownloadCount = 0;
let downloadTaskUpdate = Promise.resolve();
const downloadWaiters: Array<() => void> = [];
let tasksLoaded: null | Promise<void> = null;
let manifestUpdate = Promise.resolve();

const renameWithRetry = async (source: string, destination: string) => {
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            await fs.rename(source, destination);
            return;
        } catch (error) {
            const code = (error as NodeJS.ErrnoException).code;
            if ((code !== 'EBUSY' && code !== 'EPERM') || attempt === 2) throw error;
            await new Promise((resolve) => setTimeout(resolve, 25 * (attempt + 1)));
        }
    }
};

const replaceFile = async (temporaryPath: string, filePath: string) => {
    const backupPath = `${filePath}.bak`;
    await fs.rm(backupPath, { force: true });

    let hasBackup = false;
    try {
        await renameWithRetry(filePath, backupPath);
        hasBackup = true;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }

    try {
        await renameWithRetry(temporaryPath, filePath);
    } catch (error) {
        if (hasBackup) {
            await renameWithRetry(backupPath, filePath).catch((restoreError) => {
                log.error('Failed to restore a backup after replacing an offline data file', {
                    filePath,
                    restoreError,
                });
            });
        }
        throw error;
    }
    if (hasBackup) {
        await fs.rm(backupPath, { force: true }).catch((error) => {
            log.warn('Failed to remove an old offline data backup', { backupPath, error });
        });
    }
};

const readTextFileWithBackup = async (filePath: string) => {
    try {
        return await fs.readFile(filePath, 'utf8');
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        return fs.readFile(`${filePath}.bak`, 'utf8');
    }
};

const getDownloadTasksPath = () => path.join(app.getPath('userData'), 'offline-jobs.json');

const persistDownloadTasks = () => {
    const operation = downloadTaskUpdate.then(async () => {
        const tasks = [...downloadTasks.values()]
            .filter((task) => !task.silent)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .slice(0, 50);
        const filePath = getDownloadTasksPath();
        const temporaryPath = `${filePath}.tmp`;
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(temporaryPath, `${JSON.stringify(tasks, null, 2)}\n`, 'utf8');
        await replaceFile(temporaryPath, filePath);
    });
    const handledOperation = operation.catch((error) => {
        log.warn('Failed to persist offline download history', error);
    });
    downloadTaskUpdate = handledOperation;
    return handledOperation;
};

const ensureTasksLoaded = () => {
    tasksLoaded ??= (async () => {
        try {
            const contents = await readTextFileWithBackup(getDownloadTasksPath());
            const tasks = JSON.parse(contents) as OfflineDownloadTask[];
            let changed = false;
            for (const task of tasks.slice(0, 50)) {
                if (task.state === 'downloading' || task.state === 'queued') {
                    task.state = 'error';
                    task.error = 'Download interrupted when KatiesAmp closed';
                    task.failedSongIds = task.songIds.filter(
                        (songId) => !task.completedSongIds?.includes(songId),
                    );
                    changed = true;
                }
                task.completedSongIds ??= [];
                task.failedSongIds ??= [];
                downloadTasks.set(task.id, task);
            }
            if (changed) await persistDownloadTasks();
        } catch (error) {
            if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
                log.warn('Failed to restore offline download history', error);
            }
        }
    })();
    return tasksLoaded;
};

const emitTask = (task: OfflineDownloadTask, force = false) => {
    const now = Date.now();
    if (!force && now - (lastTaskEmit.get(task.id) ?? 0) < 100) return;

    task.updatedAt = new Date(now).toISOString();
    lastTaskEmit.set(task.id, now);
    for (const window of BrowserWindow.getAllWindows()) {
        window.webContents.send('offline-download-progress', task);
    }
    if (force) void persistDownloadTasks();
};

const createTask = async (
    item: OfflineBatchDownloadRequest['item'],
    tracks: OfflineDownloadRequest[],
    silent = false,
): Promise<OfflineDownloadTask> => {
    await ensureTasksLoaded();
    const finishedTasks = [...downloadTasks.values()]
        .filter(
            (task) =>
                task.state === 'cancelled' || task.state === 'complete' || task.state === 'error',
        )
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
        completedSongIds: [],
        createdAt: now,
        error: null,
        failedSongIds: [],
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
    activeJobs.set(task.id, { cancelled: false, controllers: new Set() });
    emitTask(task, true);
    return task;
};

const acquireDownloadSlot = async () => {
    if (activeDownloadCount >= 3) {
        await new Promise<void>((resolve) => downloadWaiters.push(resolve));
    }
    activeDownloadCount += 1;
    return () => {
        activeDownloadCount -= 1;
        downloadWaiters.shift()?.();
    };
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
const getAlbumKey = (serverId: string, albumId: string) => `${serverId}:${albumId}`;
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
        const contents = await readTextFileWithBackup(getManifestPath());
        const parsed = JSON.parse(contents) as
            | OfflineManifest
            | OfflineManifestV1
            | OfflineManifestV2;
        if (parsed.version === 3 && parsed.albums && parsed.entries && parsed.playlists)
            return parsed;
        if (parsed.version === 2 && parsed.entries && parsed.playlists) {
            return {
                albums: {},
                entries: Object.fromEntries(
                    Object.entries(parsed.entries).map(([key, entry]) => [
                        key,
                        { ...entry, albumIds: [] },
                    ]),
                ),
                playlists: parsed.playlists,
                version: 3,
            };
        }
        if (parsed.version === 1 && parsed.entries) {
            return {
                albums: {},
                entries: Object.fromEntries(
                    Object.entries(parsed.entries).map(([key, entry]) => [
                        key,
                        {
                            ...entry,
                            albumIds: [],
                            fingerprint: getFingerprint(entry.song),
                            manual: true,
                            playlistIds: [],
                        },
                    ]),
                ),
                playlists: {},
                version: 3,
            };
        }
        return { ...EMPTY_MANIFEST, albums: {}, entries: {}, playlists: {} };
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            log.warn('Failed to read offline manifest; starting with an empty manifest', error);
        }
        return { ...EMPTY_MANIFEST, albums: {}, entries: {}, playlists: {} };
    }
};

const writeManifest = async (manifest: OfflineManifest) => {
    await fs.mkdir(getDefaultOfflineRoot(), { recursive: true });
    const manifestPath = getManifestPath();
    const temporaryPath = `${manifestPath}.tmp`;
    await fs.writeFile(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    await replaceFile(temporaryPath, manifestPath);
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
    ownership: { albumId?: string; manual?: boolean; playlistId?: string } = { manual: true },
    onBytes?: (bytes: number) => void,
    signal?: AbortSignal,
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
        const response = await net.fetch(request.url, { signal });
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
            { signal },
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
            const albumIds = new Set(existing?.albumIds ?? []);
            if (ownership.albumId) albumIds.add(ownership.albumId);
            const playlistIds = new Set(existing?.playlistIds ?? []);
            if (ownership.playlistId) playlistIds.add(ownership.playlistId);

            const nextEntry: OfflineEntry = {
                albumIds: [...albumIds],
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
        if (!signal?.aborted) {
            log.error('Failed to download track for offline playback', {
                error,
                serverId: request.song._serverId,
                songId: request.song.id,
            });
        }
        throw error;
    }
};

const runDownloads = async (
    task: OfflineDownloadTask,
    tracks: OfflineDownloadRequest[],
    ownership: { albumId?: string; manual?: boolean; playlistId?: string },
): Promise<OfflineEntry[]> => {
    const entries: OfflineEntry[] = [];
    const job = activeJobs.get(task.id);
    let nextIndex = 0;

    if (!job) throw new Error('Download job is unavailable');
    task.state = 'downloading';
    emitTask(task, true);

    const worker = async () => {
        while (!job.cancelled) {
            const track = tracks[nextIndex];
            nextIndex += 1;
            if (!track) return;

            const release = await acquireDownloadSlot();
            if (job.cancelled) {
                release();
                return;
            }

            const controller = new AbortController();
            job.controllers.add(controller);
            let trackBytes = 0;
            try {
                const entry = await download(
                    track,
                    ownership,
                    (bytes) => {
                        trackBytes += bytes;
                        task.bytesDownloaded += bytes;
                        emitTask(task);
                    },
                    controller.signal,
                );
                entries.push(entry);
                task.completed += 1;
                task.completedSongIds.push(track.song.id);
            } catch (error) {
                task.bytesDownloaded = Math.max(0, task.bytesDownloaded - trackBytes);
                if (!job.cancelled) {
                    task.error ??= error instanceof Error ? error.message : 'Download failed';
                    task.failedSongIds.push(track.song.id);
                }
            } finally {
                job.controllers.delete(controller);
                release();
                emitTask(task, true);
            }
        }
    };

    await Promise.all(Array.from({ length: Math.min(3, tracks.length) }, () => worker()));
    activeJobs.delete(task.id);

    if (job.cancelled) {
        task.state = 'cancelled';
    } else if (task.failedSongIds.length > 0) {
        task.state = 'error';
    } else {
        task.bytesTotal = Math.max(task.bytesTotal, task.bytesDownloaded);
        task.bytesDownloaded = task.bytesTotal;
        task.state = 'complete';
    }
    emitTask(task, true);
    return entries;
};

const downloadBatch = async (request: OfflineBatchDownloadRequest): Promise<OfflineEntry[]> => {
    const tracks = [...new Map(request.tracks.map((track) => [track.song.id, track])).values()];
    const task = await createTask(request.item, tracks);

    const entries = await runDownloads(task, tracks, { manual: true });
    if (task.state === 'cancelled') throw new Error('Download cancelled');
    if (task.state === 'error') throw new Error(task.error || 'Download failed');
    return entries;
};

const cancelDownload = async (taskId: string): Promise<boolean> => {
    await ensureTasksLoaded();
    const task = downloadTasks.get(taskId);
    const job = activeJobs.get(taskId);
    if (!task || !job || (task.state !== 'downloading' && task.state !== 'queued')) return false;

    job.cancelled = true;
    task.state = 'cancelled';
    for (const controller of job.controllers) controller.abort();
    emitTask(task, true);
    return true;
};

const retryDownload = async (request: OfflineRetryRequest): Promise<OfflineEntry[]> => {
    await ensureTasksLoaded();
    const previous = downloadTasks.get(request.taskId);
    if (!previous) throw new Error('Download history item was not found');

    const retryIds = new Set(
        previous.failedSongIds.length > 0
            ? previous.failedSongIds
            : previous.songIds.filter((songId) => !previous.completedSongIds.includes(songId)),
    );
    const tracks = request.tracks.filter((track) => retryIds.has(track.song.id));
    if (tracks.length === 0) return [];

    return downloadBatch({
        item: {
            ids: previous.itemIds,
            name: previous.name,
            serverId: previous.serverId,
            type: previous.itemType,
        },
        tracks,
    });
};

const clearDownloadHistory = async (): Promise<number> => {
    await ensureTasksLoaded();
    let removed = 0;
    for (const [taskId, task] of downloadTasks) {
        if (task.state === 'downloading' || task.state === 'queued') continue;
        downloadTasks.delete(taskId);
        lastTaskEmit.delete(taskId);
        removed += 1;
    }
    await persistDownloadTasks();
    return removed;
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
        for (const album of Object.values(manifest.albums)) {
            if (album.serverId === serverId) {
                album.songIds = album.songIds.filter((id) => id !== songId);
            }
        }
        return true;
    });
};

const removeCollection = async (
    serverId: string,
    collectionId: string,
    type: 'album' | 'playlist',
): Promise<number> => {
    return updateManifest(async (manifest) => {
        const key =
            type === 'album'
                ? getAlbumKey(serverId, collectionId)
                : getPlaylistKey(serverId, collectionId);
        const collections = type === 'album' ? manifest.albums : manifest.playlists;
        if (!collections[key]) return 0;

        let removed = 0;
        for (const [entryKey, entry] of Object.entries(manifest.entries)) {
            const ownershipIds = type === 'album' ? entry.albumIds : entry.playlistIds;
            if (entry.song._serverId !== serverId || !ownershipIds.includes(collectionId)) {
                continue;
            }

            if (type === 'album') {
                entry.albumIds = entry.albumIds.filter((id) => id !== collectionId);
            } else {
                entry.playlistIds = entry.playlistIds.filter((id) => id !== collectionId);
            }
            if (!entry.manual && entry.albumIds.length === 0 && entry.playlistIds.length === 0) {
                const filePath = resolveEntryPath(entry.fileName);
                if (filePath) await fs.rm(filePath, { force: true });
                delete manifest.entries[entryKey];
                removed += 1;
            }
        }
        delete collections[key];
        return removed;
    });
};

const removeAlbum = (serverId: string, albumId: string) =>
    removeCollection(serverId, albumId, 'album');

const removePlaylist = (serverId: string, playlistId: string) =>
    removeCollection(serverId, playlistId, 'playlist');

const syncCollection = async (
    type: 'album' | 'playlist',
    collection: { id: string; name: string; serverId: string },
    requestedTracks: OfflineDownloadRequest[],
    silent = false,
) => {
    const tracks = [...new Map(requestedTracks.map((track) => [track.song.id, track])).values()];
    const task = await createTask(
        {
            ids: [collection.id],
            name: collection.name,
            serverId: collection.serverId,
            type,
        },
        tracks,
        silent,
    );

    try {
        const manifest = await readManifest();
        const trackStates = await Promise.all(
            tracks.map(async (track) => {
                const entry = manifest.entries[getEntryKey(collection.serverId, track.song.id)];
                const filePath = entry && resolveEntryPath(entry.fileName);
                const fileExists = filePath
                    ? await fs
                          .access(filePath)
                          .then(() => true)
                          .catch(() => false)
                    : false;
                return {
                    changed:
                        !entry || !fileExists || entry.fingerprint !== getFingerprint(track.song),
                    track,
                };
            }),
        );
        const changedTracks = trackStates.filter((item) => item.changed).map((item) => item.track);
        const unchangedTracks = trackStates
            .filter((item) => !item.changed)
            .map((item) => item.track);

        if (unchangedTracks.length > 0) {
            await updateManifest((nextManifest) => {
                for (const track of unchangedTracks) {
                    const entry =
                        nextManifest.entries[getEntryKey(collection.serverId, track.song.id)];
                    if (!entry) continue;
                    if (type === 'album') {
                        entry.albumIds = [...new Set([collection.id, ...entry.albumIds])];
                    } else {
                        entry.playlistIds = [...new Set([collection.id, ...entry.playlistIds])];
                    }
                    entry.song = { ...track.song, imageUrl: null };
                }
            });
            task.completed = unchangedTracks.length;
            task.completedSongIds.push(...unchangedTracks.map((track) => track.song.id));
            task.bytesDownloaded = unchangedTracks.reduce(
                (total, track) => total + Math.max(0, track.song.size || 0),
                0,
            );
            emitTask(task, true);
        }

        const downloadedEntries = await runDownloads(task, changedTracks, {
            albumId: type === 'album' ? collection.id : undefined,
            manual: false,
            playlistId: type === 'playlist' ? collection.id : undefined,
        });
        if (task.state === 'cancelled') throw new Error('Download cancelled');
        if (task.state === 'error') throw new Error(task.error || 'Download failed');

        const songIds = tracks.map((track) => track.song.id);
        let removed = 0;
        const syncedCollection = await updateManifest(async (nextManifest) => {
            const key =
                type === 'album'
                    ? getAlbumKey(collection.serverId, collection.id)
                    : getPlaylistKey(collection.serverId, collection.id);
            const collections = type === 'album' ? nextManifest.albums : nextManifest.playlists;
            const previousSongIds = new Set(collections[key]?.songIds ?? []);
            const currentSongIds = new Set(songIds);

            for (const songId of previousSongIds) {
                if (currentSongIds.has(songId)) continue;
                const entryKey = getEntryKey(collection.serverId, songId);
                const entry = nextManifest.entries[entryKey];
                if (!entry) continue;

                if (type === 'album') {
                    entry.albumIds = entry.albumIds.filter((id) => id !== collection.id);
                } else {
                    entry.playlistIds = entry.playlistIds.filter((id) => id !== collection.id);
                }
                if (
                    !entry.manual &&
                    entry.albumIds.length === 0 &&
                    entry.playlistIds.length === 0
                ) {
                    const filePath = resolveEntryPath(entry.fileName);
                    if (filePath) await fs.rm(filePath, { force: true });
                    delete nextManifest.entries[entryKey];
                    removed += 1;
                }
            }

            const nextCollection = {
                ...collection,
                songIds,
                syncedAt: new Date().toISOString(),
            };
            collections[key] = nextCollection;
            return nextCollection;
        });

        emitTask(task, true);
        return {
            collection: syncedCollection,
            downloaded: downloadedEntries.length,
            removed,
            unchanged: unchangedTracks.length,
        };
    } catch (error) {
        const job = activeJobs.get(task.id);
        if (job) {
            job.cancelled = true;
            for (const controller of job.controllers) controller.abort();
            activeJobs.delete(task.id);
        }
        if (task.state !== 'cancelled' && task.state !== 'error') {
            task.error = error instanceof Error ? error.message : 'Download failed';
            task.state = 'error';
        }
        emitTask(task, true);
        throw error;
    }
};

const syncAlbum = async (request: OfflineAlbumSyncRequest): Promise<OfflineAlbumSyncResult> => {
    const result = await syncCollection('album', request.album, request.tracks, request.silent);
    return { ...result, album: result.collection as OfflineAlbum };
};

const syncPlaylist = async (
    request: OfflinePlaylistSyncRequest,
): Promise<OfflinePlaylistSyncResult> => {
    const result = await syncCollection(
        'playlist',
        request.playlist,
        request.tracks,
        request.silent,
    );
    return { ...result, playlist: result.collection as OfflinePlaylist };
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
ipcMain.handle('offline-download-tasks', async (): Promise<OfflineDownloadTask[]> => {
    await ensureTasksLoaded();
    return [...downloadTasks.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
});
ipcMain.handle('offline-download-cancel', (_event, taskId: string) => cancelDownload(taskId));
ipcMain.handle('offline-download-retry', (_event, request: OfflineRetryRequest) =>
    retryDownload(request),
);
ipcMain.handle('offline-download-history-clear', () => clearDownloadHistory());
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
ipcMain.handle('offline-album-list', async (): Promise<OfflineAlbum[]> => {
    const manifest = await readManifest();
    return Object.values(manifest.albums);
});
ipcMain.handle('offline-album-remove', (_event, serverId: string, albumId: string) =>
    removeAlbum(serverId, albumId),
);
ipcMain.handle('offline-album-sync', (_event, request: OfflineAlbumSyncRequest) =>
    syncAlbum(request),
);
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
