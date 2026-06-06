import { app, BrowserWindow, dialog, ipcMain, net, protocol } from 'electron';
import { createReadStream, createWriteStream, promises as fs } from 'fs';
import path from 'path';

import { store } from '../settings';

import {
    DownloadedSong,
    downloadKey,
    DownloadProgress,
    DownloadsManifest,
    DownloadStatus,
    StartDownloadPayload,
} from '/@/shared/types/downloads';

const PROTOCOL = 'feishin-local';
const MAX_CONCURRENT = 3;
const MANIFEST_VERSION = 1 as const;
const MAX_RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 4000;

let downloadsRoot: string;
let manifestPath: string;
let manifest: DownloadsManifest;

const activeControllers = new Map<string, AbortController>();
const queue: StartDownloadPayload[] = [];
const retryAttempts = new Map<string, number>();
let activeCount = 0;
let retryDrainTimer: null | ReturnType<typeof setTimeout> = null;

const defaultDownloadsRoot = () => path.join(app.getPath('userData'), 'downloads');

const loadManifest = async (): Promise<DownloadsManifest> => {
    const storedFolder =
        (store.get('downloads_folder') as string | undefined) ?? defaultDownloadsRoot();
    downloadsRoot = storedFolder;
    manifestPath = path.join(downloadsRoot, 'manifest.json');

    await fs.mkdir(downloadsRoot, { recursive: true });

    try {
        const raw = await fs.readFile(manifestPath, 'utf8');
        const parsed = JSON.parse(raw) as DownloadsManifest;
        if (parsed.version !== MANIFEST_VERSION) {
            throw new Error('manifest version mismatch');
        }
        parsed.folder = downloadsRoot;
        return parsed;
    } catch {
        return { folder: downloadsRoot, songs: {}, version: MANIFEST_VERSION };
    }
};

const saveManifest = async () => {
    await fs.mkdir(downloadsRoot, { recursive: true });
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
};

const broadcast = (channel: string, payload: unknown) => {
    BrowserWindow.getAllWindows().forEach((w) => {
        w.webContents.send(channel, payload);
    });
};

const emitProgress = (p: DownloadProgress) => {
    broadcast('downloads-progress', p);
};

const extensionFromResponse = (contentType: null | string, url: string) => {
    const ct = (contentType ?? '').toLowerCase();
    if (ct.includes('flac')) return 'flac';
    if (ct.includes('mpeg')) return 'mp3';
    if (ct.includes('mp4') || ct.includes('m4a')) return 'm4a';
    if (ct.includes('ogg') || ct.includes('opus')) return 'ogg';
    if (ct.includes('wav')) return 'wav';
    const match = url.match(/\.([a-zA-Z0-9]{2,5})(?:\?|$)/);
    return match ? match[1].toLowerCase() : 'bin';
};

const runOne = async (job: StartDownloadPayload) => {
    const key = downloadKey(job.song._serverId, job.song.id);
    const controller = new AbortController();
    activeControllers.set(key, controller);

    const status = (s: DownloadStatus, extra: Partial<DownloadProgress> = {}) =>
        emitProgress({
            bytesReceived: 0,
            bytesTotal: 0,
            serverId: job.song._serverId,
            songId: job.song.id,
            status: s,
            title: job.song.name,
            ...extra,
        });

    status('downloading');

    let tmpPath: null | string = null;
    try {
        const request = net.request({
            method: 'GET',
            url: job.downloadUrl,
        });
        request.setHeader('User-Agent', 'Feishin');

        const response = await new Promise<Electron.IncomingMessage>((resolve, reject) => {
            request.on('response', resolve);
            request.on('error', reject);
            controller.signal.addEventListener('abort', () => {
                request.abort();
                reject(new Error('cancelled'));
            });
            request.end();
        });

        if (response.statusCode < 200 || response.statusCode >= 300) {
            throw new Error(`HTTP ${response.statusCode}`);
        }

        const contentTypeRaw = response.headers['content-type'];
        const ct = Array.isArray(contentTypeRaw) ? contentTypeRaw[0] : (contentTypeRaw ?? null);
        const ext = extensionFromResponse(ct, job.downloadUrl);

        const serverDir = path.join(downloadsRoot, job.song._serverId);
        await fs.mkdir(serverDir, { recursive: true });

        const finalRel = path.join(job.song._serverId, `${job.song.id}.${ext}`);
        const finalPath = path.join(downloadsRoot, finalRel);
        tmpPath = `${finalPath}.part`;

        const contentLengthRaw = response.headers['content-length'];
        const bytesTotal =
            Number(
                Array.isArray(contentLengthRaw) ? contentLengthRaw[0] : (contentLengthRaw ?? 0),
            ) || 0;

        let bytesReceived = 0;
        let windowStartBytes = 0;
        let windowStartTime = Date.now();
        let lastEmitTime = 0;
        let bytesPerSecond = 0;
        const out = createWriteStream(tmpPath);

        await new Promise<void>((resolve, reject) => {
            response.on('data', (chunk: Buffer) => {
                bytesReceived += chunk.length;
                out.write(chunk);

                const now = Date.now();
                if (now - windowStartTime >= 500) {
                    const elapsed = (now - windowStartTime) / 1000;
                    bytesPerSecond = Math.round(
                        (bytesReceived - windowStartBytes) / Math.max(elapsed, 0.001),
                    );
                    windowStartBytes = bytesReceived;
                    windowStartTime = now;
                }

                // Throttle UI updates to ~10/s per song.
                if (now - lastEmitTime >= 100) {
                    lastEmitTime = now;
                    emitProgress({
                        bytesPerSecond,
                        bytesReceived,
                        bytesTotal,
                        serverId: job.song._serverId,
                        songId: job.song.id,
                        status: 'downloading',
                        title: job.song.name,
                    });
                }
            });
            response.on('end', () => {
                out.end(() => resolve());
            });
            response.on('error', reject);
            controller.signal.addEventListener('abort', () => {
                out.destroy();
                reject(new Error('cancelled'));
            });
        });

        await fs.rename(tmpPath, finalPath);
        tmpPath = null;

        const stat = await fs.stat(finalPath);
        const record: DownloadedSong = {
            absolutePath: finalPath,
            bytes: stat.size,
            downloadedAt: Date.now(),
            relativePath: finalRel,
            serverId: job.song._serverId,
            serverType: job.serverType,
            songId: job.song.id,
            sourceAlbum: job.song.album ?? undefined,
            sourceArtist: job.song.artistName ?? undefined,
            sourceTitle: job.song.name,
        };

        manifest.songs[key] = record;
        await saveManifest();

        emitProgress({
            bytesReceived,
            bytesTotal: bytesTotal || stat.size,
            serverId: job.song._serverId,
            songId: job.song.id,
            status: 'completed',
            title: job.song.name,
        });
    } catch (err) {
        if (tmpPath) {
            await fs.rm(tmpPath, { force: true }).catch(() => {});
        }
        const wasCancelled = controller.signal.aborted;
        if (wasCancelled) {
            retryAttempts.delete(key);
            status('cancelled');
        } else {
            const attempts = retryAttempts.get(key) ?? 0;
            if (attempts < MAX_RETRY_ATTEMPTS) {
                retryAttempts.set(key, attempts + 1);
                failedRetryQueue.push(job);
                status('failed', {
                    error: `${(err as Error).message} (will retry)`,
                });
                scheduleRetryDrain();
            } else {
                retryAttempts.delete(key);
                status('failed', {
                    error: (err as Error).message,
                });
            }
        }
    } finally {
        activeControllers.delete(key);
        activeCount -= 1;
        pump();
    }
};

const pump = () => {
    while (activeCount < MAX_CONCURRENT && queue.length > 0) {
        const next = queue.shift()!;
        activeCount += 1;
        void runOne(next);
    }
};

const failedRetryQueue: StartDownloadPayload[] = [];

const scheduleRetryDrain = () => {
    if (retryDrainTimer) return;
    retryDrainTimer = setTimeout(() => {
        retryDrainTimer = null;
        drainRetryQueue();
    }, RETRY_DELAY_MS);
};

const drainRetryQueue = () => {
    if (activeCount > 0 || queue.length > 0) {
        // Wait for the main queue to empty.
        scheduleRetryDrain();
        return;
    }
    const batch = failedRetryQueue.splice(0, failedRetryQueue.length);
    for (const payload of batch) {
        const key = downloadKey(payload.song._serverId, payload.song.id);
        if (manifest.songs[key]) continue;
        queue.push(payload);
        emitProgress({
            bytesReceived: 0,
            bytesTotal: 0,
            serverId: payload.song._serverId,
            songId: payload.song.id,
            status: 'queued',
            title: payload.song.name,
        });
    }
    pump();
};

const enqueue = (payload: StartDownloadPayload) => {
    const key = downloadKey(payload.song._serverId, payload.song.id);
    if (manifest.songs[key]) {
        emitProgress({
            bytesReceived: manifest.songs[key].bytes,
            bytesTotal: manifest.songs[key].bytes,
            serverId: payload.song._serverId,
            songId: payload.song.id,
            status: 'completed',
        });
        return;
    }
    if (
        activeControllers.has(key) ||
        queue.some((j) => downloadKey(j.song._serverId, j.song.id) === key)
    ) {
        return;
    }
    queue.push(payload);
    emitProgress({
        bytesReceived: 0,
        bytesTotal: 0,
        serverId: payload.song._serverId,
        songId: payload.song.id,
        status: 'queued',
        title: payload.song.name,
    });
    pump();
};

const registerProtocol = () => {
    protocol.handle(PROTOCOL, async (request) => {
        try {
            const url = new URL(request.url);
            // URL form: feishin-local://song/<serverId>/<songId>
            const [, segServer, segSong] = url.pathname.split('/');
            const key = downloadKey(
                decodeURIComponent(segServer ?? ''),
                decodeURIComponent(segSong ?? ''),
            );
            const record = manifest.songs[key];
            if (!record) {
                return new Response('not found', { status: 404 });
            }
            const absolutePath = path.join(downloadsRoot, record.relativePath);

            // Defense-in-depth: ensure resolved path stays under downloads root.
            // Manifest is the source of truth so this should never fail in practice,
            // but a tampered manifest with `..` in relativePath could escape.
            const relCheck = path.relative(downloadsRoot, absolutePath);
            if (relCheck.startsWith('..') || path.isAbsolute(relCheck)) {
                return new Response('forbidden', { status: 403 });
            }

            const stat = await fs.stat(absolutePath);
            const stream = createReadStream(absolutePath);
            // Wrap the Node stream into a Web ReadableStream so we don't load
            // multi-gigabyte files into memory at once.
            const body = new ReadableStream<Uint8Array>({
                cancel() {
                    stream.destroy();
                },
                start(controller) {
                    stream.on('data', (chunk) => {
                        if (typeof chunk === 'string') {
                            controller.enqueue(new TextEncoder().encode(chunk));
                        } else {
                            controller.enqueue(new Uint8Array(chunk));
                        }
                    });
                    stream.on('end', () => controller.close());
                    stream.on('error', (err) => controller.error(err));
                },
            });
            return new Response(body, {
                headers: {
                    'Content-Length': String(stat.size),
                },
                status: 200,
            });
        } catch (err) {
            return new Response((err as Error).message, { status: 500 });
        }
    });
};

ipcMain.handle('downloads-list', () => manifest);

ipcMain.handle('downloads-enqueue', (_e, payloads: StartDownloadPayload[]) => {
    payloads.forEach(enqueue);
});

ipcMain.handle('downloads-cancel', (_e, songIds: Array<{ serverId: string; songId: string }>) => {
    songIds.forEach(({ serverId, songId }) => {
        const key = downloadKey(serverId, songId);
        const ctrl = activeControllers.get(key);
        if (ctrl) ctrl.abort();
        const qi = queue.findIndex((j) => downloadKey(j.song._serverId, j.song.id) === key);
        if (qi >= 0) {
            queue.splice(qi, 1);
            emitProgress({
                bytesReceived: 0,
                bytesTotal: 0,
                serverId,
                songId,
                status: 'cancelled',
            });
        }
    });
});

ipcMain.handle(
    'downloads-delete',
    async (
        _e,
        songIds: Array<{ serverId: string; songId: string }>,
    ): Promise<DownloadsManifest> => {
        for (const { serverId, songId } of songIds) {
            const key = downloadKey(serverId, songId);
            const record = manifest.songs[key];
            if (!record) continue;
            const absolutePath = path.join(downloadsRoot, record.relativePath);
            await fs.rm(absolutePath, { force: true }).catch(() => {});
            delete manifest.songs[key];
        }
        await saveManifest();
        return manifest;
    },
);

ipcMain.handle('downloads-pick-folder', async (): Promise<DownloadsManifest> => {
    const result = await dialog.showOpenDialog({
        defaultPath: downloadsRoot,
        properties: ['openDirectory', 'createDirectory'],
    });
    if (result.canceled || !result.filePaths[0]) return manifest;
    const newRoot = result.filePaths[0];
    store.set('downloads_folder', newRoot);
    downloadsRoot = newRoot;
    manifestPath = path.join(downloadsRoot, 'manifest.json');
    await fs.mkdir(downloadsRoot, { recursive: true });
    manifest = { ...manifest, folder: downloadsRoot };
    await saveManifest();
    return manifest;
});

ipcMain.handle('downloads-reconcile', async (): Promise<DownloadsManifest> => {
    let changed = false;
    for (const [key, record] of Object.entries(manifest.songs)) {
        const absolutePath = path.join(downloadsRoot, record.relativePath);
        try {
            await fs.access(absolutePath);
            // Re-sync absolutePath in case downloads folder moved.
            if (record.absolutePath !== absolutePath) {
                manifest.songs[key] = { ...record, absolutePath };
                changed = true;
            }
        } catch {
            delete manifest.songs[key];
            changed = true;
        }
    }
    if (changed) await saveManifest();
    return manifest;
});

export const registerDownloadsProtocolScheme = () => {
    protocol.registerSchemesAsPrivileged([
        {
            privileges: {
                bypassCSP: true,
                secure: true,
                standard: true,
                stream: true,
                supportFetchAPI: true,
            },
            scheme: PROTOCOL,
        },
    ]);
};

export const initDownloads = async () => {
    manifest = await loadManifest();
    registerProtocol();
};
