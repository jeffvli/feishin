import type {
    OfflineDownloadRequest,
    OfflineEntry,
    OfflinePlaybackSource,
} from '/@/shared/types/offline';

import { app, ipcMain, net } from 'electron';
import { createHash } from 'node:crypto';
import { createWriteStream } from 'node:fs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import log from '/@/main/logger';

type OfflineManifest = {
    entries: Record<string, OfflineEntry>;
    version: 1;
};

const EMPTY_MANIFEST: OfflineManifest = { entries: {}, version: 1 };
let manifestUpdate = Promise.resolve();

const getOfflineRoot = () => path.join(app.getPath('userData'), 'offline');
const getManifestPath = () => path.join(getOfflineRoot(), 'manifest.json');
const getEntryKey = (serverId: string, songId: string) => `${serverId}:${songId}`;
const hashPart = (value: string) => createHash('sha256').update(value).digest('hex');

const resolveEntryPath = (fileName: string) => {
    const root = path.resolve(getOfflineRoot());
    const filePath = path.resolve(root, fileName);
    return filePath.startsWith(`${root}${path.sep}`) ? filePath : null;
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
        const parsed = JSON.parse(contents) as OfflineManifest;
        return parsed.version === 1 && parsed.entries ? parsed : EMPTY_MANIFEST;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            log.warn('Failed to read offline manifest; starting with an empty manifest', error);
        }
        return { ...EMPTY_MANIFEST, entries: {} };
    }
};

const writeManifest = async (manifest: OfflineManifest) => {
    await fs.mkdir(getOfflineRoot(), { recursive: true });
    const manifestPath = getManifestPath();
    const temporaryPath = `${manifestPath}.tmp`;
    await fs.writeFile(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
    await fs.rename(temporaryPath, manifestPath);
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

const download = async (request: OfflineDownloadRequest): Promise<OfflineEntry> => {
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

        await pipeline(
            Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]),
            createWriteStream(temporaryPath),
        );
        await fs.rm(destinationPath, { force: true });
        await fs.rename(temporaryPath, destinationPath);

        const stat = await fs.stat(destinationPath);
        const entry: OfflineEntry = {
            downloadedAt: new Date().toISOString(),
            fileName: relativeFileName,
            size: stat.size,
            song: { ...request.song, imageUrl: null },
        };
        await updateManifest((manifest) => {
            manifest.entries[getEntryKey(request.song._serverId, request.song.id)] = entry;
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

const remove = async (serverId: string, songId: string): Promise<boolean> => {
    return updateManifest(async (manifest) => {
        const key = getEntryKey(serverId, songId);
        const entry = manifest.entries[key];
        if (!entry) return false;

        const filePath = resolveEntryPath(entry.fileName);
        if (filePath) await fs.rm(filePath, { force: true });
        delete manifest.entries[key];
        return true;
    });
};

ipcMain.handle('offline-download', (_event, request: OfflineDownloadRequest) => download(request));
ipcMain.handle('offline-list', async (): Promise<OfflineEntry[]> => {
    const manifest = await readManifest();
    return Object.values(manifest.entries);
});
ipcMain.handle('offline-remove', (_event, serverId: string, songId: string) =>
    remove(serverId, songId),
);
ipcMain.handle('offline-resolve', (_event, serverId: string, songId: string) =>
    resolveOfflineSource(serverId, songId),
);
