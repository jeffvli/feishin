import { execFile, ExecFileException } from 'child_process';
import { randomUUID } from 'crypto';
import { app, ipcMain, protocol } from 'electron';
import * as ffbinaries from 'ffbinaries';
import { createReadStream, createWriteStream } from 'fs';
import {
    access,
    chmod,
    mkdir,
    readdir,
    readFile,
    rename,
    rm,
    stat,
    unlink,
    utimes,
} from 'fs/promises';
import { get as httpsGet } from 'https';
import { tmpdir } from 'os';
import { isAbsolute, join } from 'path';
import { Readable } from 'stream';

import log from '../../../logger';
import { store } from '../settings';

const isWindows = process.platform === 'win32';
const YTDLP_FILENAME = isWindows ? 'yt-dlp.exe' : 'yt-dlp';
const FFMPEG_FILENAME = isWindows ? 'ffmpeg.exe' : 'ffmpeg';

// yt-dlp's actual per-platform standalone-build asset names on its GitHub releases - not the
// generic `yt-dlp` Python zipapp, which would need a system Python to run.
const YTDLP_RELEASE_ASSET = isWindows
    ? 'yt-dlp.exe'
    : process.platform === 'darwin'
      ? 'yt-dlp_macos'
      : 'yt-dlp_linux';

// Where a "Download"/"Update" click in Settings puts the binaries: no vendored binary and
// no install-time fetch, so a fresh install has neither until this feature is turned on.
const getBinDir = () => join(app.getPath('userData'), 'bin');

// Downloaded video files live here between plays, so a repeat play of the same track is just a
// local file read. The directory is bounded by `pruneVideoCache` rather than growing forever, and
// "Clear cached matches" in Settings empties it outright.
export const getMusicVideoCacheDir = () => join(app.getPath('userData'), 'musicVideoCache');
const getVideoCachePath = (videoId: string) => join(getMusicVideoCacheDir(), `${videoId}.mp4`);

// An in-progress download is named `<id>.<uuid>.tmp.mp4` and is not a cache entry yet: counting
// one toward the size, or evicting one out from under the download writing it, would both be
// wrong.
const CACHED_VIDEO_RE = /^[\w-]+\.mp4$/;

/**
 * Scheme the renderer points its `<video>` at. Registered as privileged in `main/index.ts`
 * alongside the existing `feishin` font scheme, which is what lets a `file://` page load from it
 * at all.
 *
 * A custom protocol rather than a local HTTP server: the renderer only needs to read files this
 * process already put on disk, and a protocol handler does that without opening a port or moving
 * the renderer off `file://`. The video id goes in the path, not the host, because a URL host is
 * lowercased and YouTube ids are case sensitive.
 */
export const MUSIC_VIDEO_PROTOCOL = 'feishin-video';

export const getMusicVideoUrl = (videoId: string) =>
    `${MUSIC_VIDEO_PROTOCOL}://cache/${videoId}.mp4`;

interface CachedVideo {
    bytes: number;
    name: string;
    /**
     * Modification time, which this module keeps as a last-used stamp: every play touches the
     * file it hits (see the `music-video-download-video` handler), so eviction by oldest mtime
     * is eviction of whatever has gone longest without being watched.
     */
    usedAt: number;
}

const readCachedVideos = async (): Promise<CachedVideo[]> => {
    const cacheDir = getMusicVideoCacheDir();

    let names: string[];
    try {
        names = await readdir(cacheDir);
    } catch {
        // No cache directory yet is an empty cache, not a failure.
        return [];
    }

    const entries = await Promise.all(
        names
            .filter((name) => CACHED_VIDEO_RE.test(name))
            .map(async (name): Promise<CachedVideo | null> => {
                try {
                    const info = await stat(join(cacheDir, name));
                    return { bytes: info.size, name, usedAt: info.mtimeMs };
                } catch {
                    return null;
                }
            }),
    );

    return entries.filter((entry): entry is CachedVideo => entry !== null);
};

/**
 * Evicts least-recently-watched videos until the cache fits `limitBytes`. `keepName` is the file
 * the caller has just downloaded and is about to play: it is the newest entry and so would
 * normally be evicted last anyway, but a single video larger than the whole limit would otherwise
 * be deleted before it ever played.
 */
const pruneVideoCache = async (limitBytes: number, keepName?: string): Promise<void> => {
    if (!Number.isFinite(limitBytes) || limitBytes <= 0) {
        return;
    }

    const entries = await readCachedVideos();
    let total = entries.reduce((sum, entry) => sum + entry.bytes, 0);

    if (total <= limitBytes) {
        return;
    }

    entries.sort((a, b) => a.usedAt - b.usedAt);

    for (const entry of entries) {
        if (total <= limitBytes) break;
        if (entry.name === keepName) continue;

        try {
            await unlink(join(getMusicVideoCacheDir(), entry.name));
            total -= entry.bytes;
            log.info(`Music video cache: evicted ${entry.name}`);
        } catch {
            // A file that vanished under us is already gone; keep going.
        }
    }
};

const fileExists = async (path: string): Promise<boolean> => {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
};

/**
 * Checked in order: the explicit `ytdlp_path` settings override, the copy this app already
 * downloaded into `userData/bin`, then a PATH lookup for anyone who has their own copy -
 * mirrors `resolveMpvBinaryPath` (`src/main/features/core/player/index.ts`) with the
 * downloaded-copy check added in between. `undefined` means none of the three worked.
 */
const resolveYtdlpBinaryPath = async (): Promise<string | undefined> => {
    const explicitPath = store.get('ytdlp_path') as string | undefined;

    if (explicitPath) {
        return explicitPath;
    }

    const downloadedPath = join(getBinDir(), YTDLP_FILENAME);

    if (await fileExists(downloadedPath)) {
        return downloadedPath;
    }

    try {
        await runBinary('yt-dlp', ['--version']);
        return 'yt-dlp';
    } catch {
        return undefined;
    }
};

// Same priority order as `resolveYtdlpBinaryPath`, since audio extraction's `-x` shells out
// to ffmpeg as a post-processor and needs it resolved the same way.
const resolveFfmpegPath = async (): Promise<string | undefined> => {
    const explicitPath = store.get('ffmpeg_path') as string | undefined;

    if (explicitPath) {
        return explicitPath;
    }

    const downloadedPath = join(getBinDir(), FFMPEG_FILENAME);

    if (await fileExists(downloadedPath)) {
        return downloadedPath;
    }

    try {
        await runBinary('ffmpeg', ['-version']);
        return 'ffmpeg';
    } catch {
        return undefined;
    }
};

// The rate the fingerprint works at, which both the local track and every candidate are extracted
// to directly. Handing the renderer audio that is already mono at this rate means nothing has to
// resample it there - no `AudioContext`, and the analysis can run in a worker - and it means both
// sides of a comparison went through the same resampler in the same way.
const FINGERPRINT_SAMPLE_RATE = 11025;

const MAX_DOWNLOAD_REDIRECTS = 5;

// GitHub's `/releases/latest/download/<asset>` redirects to the actual asset on
// `objects.githubusercontent.com`; `https.get` doesn't follow redirects on its own.
const downloadFile = (
    url: string,
    destPath: string,
    redirectsLeft = MAX_DOWNLOAD_REDIRECTS,
): Promise<void> => {
    return new Promise((resolve, reject) => {
        httpsGet(url, { headers: { 'User-Agent': 'Feishin' } }, (response) => {
            const { headers, statusCode } = response;

            if (statusCode && statusCode >= 300 && statusCode < 400 && headers.location) {
                response.resume();
                if (redirectsLeft <= 0) {
                    reject(new Error('Too many redirects downloading yt-dlp'));
                    return;
                }
                downloadFile(headers.location, destPath, redirectsLeft - 1).then(resolve, reject);
                return;
            }

            if (statusCode !== 200) {
                response.resume();
                reject(new Error(`Failed to download yt-dlp: HTTP ${statusCode}`));
                return;
            }

            const fileStream = createWriteStream(destPath);
            response.pipe(fileStream);
            fileStream.on('finish', () =>
                fileStream.close((error) => (error ? reject(error) : resolve())),
            );
            fileStream.on('error', reject);
        }).on('error', reject);
    });
};

const downloadYtdlp = async (): Promise<void> => {
    const binDir = getBinDir();
    await mkdir(binDir, { recursive: true });
    const destPath = join(binDir, YTDLP_FILENAME);

    await downloadFile(
        `https://github.com/yt-dlp/yt-dlp/releases/latest/download/${YTDLP_RELEASE_ASSET}`,
        destPath,
    );

    if (!isWindows) {
        await chmod(destPath, 0o755);
    }
};

const downloadFfmpeg = async (): Promise<void> => {
    const binDir = getBinDir();
    await mkdir(binDir, { recursive: true });

    await new Promise<void>((resolve, reject) => {
        ffbinaries.downloadBinaries(['ffmpeg'], { destination: binDir, force: true }, (error) => {
            if (error) {
                reject(new Error(error));
                return;
            }
            resolve();
        });
    });
};

const BINARY_TIMEOUT_MS = 30000;
// A full video download (unlike the 90s-capped audio extraction below) can easily run past
// the default timeout above on a slower connection.
const VIDEO_DOWNLOAD_TIMEOUT_MS = 5 * 60 * 1000;

// Tracked so a lookup or extraction still in flight is killed rather than outliving the
// app, the same cleanup precedent as the mpv child process in `core/player/index.ts`. A
// binary download isn't a tracked child process - it's a plain HTTP fetch, so there's
// nothing here to kill on quit beyond letting it get cut off with the process.
const activeProcesses = new Set<ReturnType<typeof execFile>>();

const runBinary = (
    binaryPath: string,
    args: string[],
    timeoutMs = BINARY_TIMEOUT_MS,
): Promise<string> => {
    return new Promise((resolve, reject) => {
        const child = execFile(
            binaryPath,
            args,
            { maxBuffer: 10 * 1024 * 1024, timeout: timeoutMs },
            (error: ExecFileException | null, stdout) => {
                activeProcesses.delete(child);

                if (error) {
                    reject(error);
                    return;
                }

                resolve(stdout);
            },
        );

        activeProcesses.add(child);
    });
};

const killActiveProcesses = () => {
    for (const child of activeProcesses) {
        child.kill('SIGTERM');
    }
    activeProcesses.clear();
};

app.on('before-quit', killActiveProcesses);
process.on('SIGINT', killActiveProcesses);
process.on('SIGTERM', killActiveProcesses);

export interface MusicVideoAssetStatus {
    ffmpeg: { path: null | string };
    ytdlp: { path: null | string; version: null | string };
}

export interface MusicVideoCacheStats {
    bytes: number;
    count: number;
}

export interface MusicVideoSearchResult {
    channel: null | string;
    durationSec: null | number;
    title: string;
    videoId: string;
}

// A YouTube video id is always 11 characters, but a little slack is kept here rather than
// hardcoding that, since it costs nothing and only guards against feeding an unrelated
// string to `execFile` as a URL path segment.
const YOUTUBE_VIDEO_ID_RE = /^[\w-]{6,20}$/;

const getYtdlpVersion = async (ytdlpPath: string): Promise<null | string> => {
    try {
        return (await runBinary(ytdlpPath, ['--version'])).trim();
    } catch {
        return null;
    }
};

const getAssetStatus = async (): Promise<MusicVideoAssetStatus> => {
    const ytdlpPath = await resolveYtdlpBinaryPath();
    const ffmpegPath = await resolveFfmpegPath();

    return {
        ffmpeg: { path: ffmpegPath ?? null },
        ytdlp: {
            path: ytdlpPath ?? null,
            version: ytdlpPath ? await getYtdlpVersion(ytdlpPath) : null,
        },
    };
};

ipcMain.handle('music-video-asset-status', async (): Promise<MusicVideoAssetStatus> => {
    return getAssetStatus();
});

ipcMain.handle(
    'music-video-download-asset',
    async (_event, asset: 'ffmpeg' | 'ytdlp'): Promise<MusicVideoAssetStatus> => {
        if (asset !== 'ffmpeg' && asset !== 'ytdlp') {
            throw new Error('Invalid asset');
        }

        try {
            await (asset === 'ytdlp' ? downloadYtdlp() : downloadFfmpeg());
        } catch (error) {
            log.error(`Music video ${asset} download failed`, error);
            throw new Error(`Failed to download ${asset}`);
        }

        return getAssetStatus();
    },
);

ipcMain.handle(
    'music-video-search',
    async (_event, query: string): Promise<MusicVideoSearchResult[]> => {
        const ytdlpPath = await resolveYtdlpBinaryPath();

        if (!ytdlpPath) {
            throw new Error('yt-dlp not found');
        }

        try {
            const stdout = await runBinary(ytdlpPath, [
                `ytsearch5:${query}`,
                '--dump-json',
                '--flat-playlist',
                '--no-warnings',
            ]);

            return stdout
                .split('\n')
                .filter((line) => line.trim().length > 0)
                .map((line) => JSON.parse(line))
                .filter((parsed) => typeof parsed.id === 'string')
                .map((parsed) => ({
                    channel: parsed.channel ?? parsed.uploader ?? null,
                    durationSec: typeof parsed.duration === 'number' ? parsed.duration : null,
                    title: parsed.title ?? '',
                    videoId: parsed.id as string,
                }));
        } catch (error) {
            log.error('Music video search failed', error);
            throw new Error('yt-dlp search failed');
        }
    },
);

ipcMain.handle(
    'music-video-extract-audio',
    async (_event, videoId: string): Promise<Uint8Array> => {
        if (!YOUTUBE_VIDEO_ID_RE.test(videoId)) {
            throw new Error('Invalid YouTube video id');
        }

        const ytdlpPath = await resolveYtdlpBinaryPath();

        if (!ytdlpPath) {
            throw new Error('yt-dlp not found');
        }

        const ffmpegPath = await resolveFfmpegPath();

        if (!ffmpegPath) {
            throw new Error('ffmpeg not found');
        }

        // Only the first ~90s is extracted: enough to fingerprint-match against, while bounding
        // both extraction time and the size of the buffer sent back over IPC.
        const tmpBase = join(tmpdir(), `feishin-music-video-${randomUUID()}`);
        const finalPath = `${tmpBase}.wav`;

        // yt-dlp checks `--ffmpeg-location` with a plain `os.path.exists()` rather than
        // searching PATH itself, so the bare `'ffmpeg'` fallback from `resolveFfmpegPath`
        // (meaning "found on PATH") would abort every run. Only pass the flag for a real
        // filesystem path and let yt-dlp do its own PATH search otherwise.
        const ffmpegLocationArgs = isAbsolute(ffmpegPath) ? ['--ffmpeg-location', ffmpegPath] : [];

        try {
            await runBinary(ytdlpPath, [
                `https://www.youtube.com/watch?v=${videoId}`,
                '--download-sections',
                '*0-90',
                '-x',
                '--audio-format',
                'wav',
                // Mono at the fingerprint's own rate rather than the source's stereo 44.1 kHz.
                // Nothing the matcher looks at is lost - it only draws landmarks from below
                // ~5.5 kHz - and the buffer that crosses IPC into the renderer drops from around
                // 15 MB per candidate to under 2 MB.
                '--postprocessor-args',
                `ExtractAudio:-ac 1 -ar ${FINGERPRINT_SAMPLE_RATE}`,
                ...ffmpegLocationArgs,
                '-o',
                `${tmpBase}.%(ext)s`,
                '--no-warnings',
                '--force-overwrites',
            ]);

            const buffer = await readFile(finalPath);
            // A Node `Buffer` doesn't reliably survive the contextBridge structured-clone
            // boundary, so this hands back a plain `Uint8Array` view over the same bytes.
            return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        } catch (error) {
            log.error('Music video audio extraction failed', error);
            throw new Error('yt-dlp extraction failed');
        } finally {
            await unlink(finalPath).catch(() => {
                // Nothing to clean up when extraction never produced a file.
            });
        }
    },
);

ipcMain.handle(
    'music-video-download-video',
    async (
        _event,
        videoId: string,
        cacheLimitBytes?: number,
        maxHeightSetting?: number,
    ): Promise<void> => {
        if (!YOUTUBE_VIDEO_ID_RE.test(videoId)) {
            throw new Error('Invalid YouTube video id');
        }

        const maxHeight = resolveMaxHeight(maxHeightSetting);

        const destPath = getVideoCachePath(videoId);
        if (await fileExists(destPath)) {
            // This is the only moment the main process learns a cached video was watched again,
            // and `pruneVideoCache` evicts by mtime, so the touch is what stops a favourite
            // track's video ageing out purely because it was downloaded long ago.
            const now = new Date();
            await utimes(destPath, now, now).catch(() => {
                // A stamp that cannot be updated only costs this entry some eviction priority.
            });
            return;
        }

        const ytdlpPath = await resolveYtdlpBinaryPath();
        if (!ytdlpPath) {
            throw new Error('yt-dlp not found');
        }

        // Needed here as well as for audio extraction: merging the video and audio streams into
        // one mp4 is an ffmpeg job. Same `--ffmpeg-location` caveat as there - the flag is only
        // passed for a real filesystem path, since yt-dlp checks it with `os.path.exists()`
        // rather than searching PATH.
        const ffmpegPath = await resolveFfmpegPath();
        const ffmpegLocationArgs =
            ffmpegPath && isAbsolute(ffmpegPath) ? ['--ffmpeg-location', ffmpegPath] : [];

        const cacheDir = getMusicVideoCacheDir();
        await mkdir(cacheDir, { recursive: true });
        const tmpPath = join(cacheDir, `${videoId}.${randomUUID()}.tmp.mp4`);

        try {
            await runBinary(
                ytdlpPath,
                [
                    `https://www.youtube.com/watch?v=${videoId}`,
                    // The video codec is pinned to avc1, not just to an mp4 container. YouTube
                    // now serves AV1 inside mp4, so `[ext=mp4]` alone selected it - and Chromium
                    // has no hardware AV1 decoder on most machines, so those files play back in
                    // software and drop frames. Measured on this cache: an 854x480 AV1 file where
                    // an avc1 one was intended. avc1 is hardware-decoded essentially everywhere,
                    // which is worth more than the extra pixels a wider AV1 rendition would add -
                    // hence a resolution cap that selects among avc1 renditions rather than one
                    // that picks the largest of any codec.
                    //
                    // Muxing avc1 with m4a is a container copy rather than a re-encode, so it
                    // avoids the problem a webm/VP9 remux into mp4 has, where the seek and
                    // duration metadata comes out in a form Chromium's <video> element handles
                    // inconsistently - that surfaced as the video repeatedly restarting
                    // mid-playback instead of just failing outright.
                    //
                    // The audio track is downloaded even though the element is always muted and
                    // the sound comes from the app's own engine. Without one, Chromium treats the
                    // element as something it cannot take audio focus for, and the transport
                    // controls on its picture-in-picture window then do nothing at all - no
                    // `pause` event on the element and no Media Session action either.
                    // Widescreen renditions are preferred over merely-largest ones, because the
                    // panel and any picture-in-picture window are sized from whatever comes back:
                    // a 4:3 rendition makes both change shape between tracks. It is a preference,
                    // not a requirement - the later branches take whatever exists for an upload
                    // that has no 16:9 rendition at this height. An older yt-dlp without the
                    // `aspect_ratio` field simply matches nothing in the first branch and falls
                    // through, which is the same outcome.
                    '-f',
                    [
                        `bestvideo[height<=${maxHeight}][vcodec^=avc1][aspect_ratio>=1.7]+bestaudio[ext=m4a]`,
                        `bestvideo[height<=${maxHeight}][vcodec^=avc1]+bestaudio[ext=m4a]`,
                        `best[height<=${maxHeight}][vcodec^=avc1]`,
                        `best[height<=${maxHeight}][ext=mp4]`,
                    ].join('/'),
                    '--merge-output-format',
                    'mp4',
                    ...ffmpegLocationArgs,
                    '-o',
                    tmpPath,
                    '--no-warnings',
                    '--force-overwrites',
                ],
                VIDEO_DOWNLOAD_TIMEOUT_MS,
            );

            await rename(tmpPath, destPath);
        } catch (error) {
            log.error('Music video download failed', { error, videoId });
            throw new Error('yt-dlp video download failed');
        } finally {
            await unlink(tmpPath).catch(() => {
                // Nothing to clean up when the download never produced a file.
            });
        }

        // Pruned here rather than on a timer so the cache is only ever measured right after the
        // one event that can push it over: a new file landing in it.
        if (cacheLimitBytes) {
            await pruneVideoCache(cacheLimitBytes, `${videoId}.mp4`);
        }
    },
);

// Bumped whenever the download format changes in a way that makes already-cached files wrong:
// generation 2 added the audio track the picture-in-picture transport controls need, generation 3
// pinned the video codec to avc1. Cached files carry no record of which format produced them, so
// the whole cache is dropped once per bump and refetched on demand.
const CACHE_FORMAT_GENERATION = 3;

// Heights offered in Settings. Validated against this rather than trusted, since the value is
// interpolated into a yt-dlp format selector on a command line.
const ALLOWED_MAX_HEIGHTS = [360, 480, 720, 1080];
const DEFAULT_MAX_HEIGHT = 480;

const resolveMaxHeight = (requested?: number): number =>
    requested && ALLOWED_MAX_HEIGHTS.includes(requested) ? requested : DEFAULT_MAX_HEIGHT;

const resetCacheIfFormatChanged = async (): Promise<void> => {
    if (store.get('music_video_cache_generation') === CACHE_FORMAT_GENERATION) {
        return;
    }

    await rm(getMusicVideoCacheDir(), { force: true, recursive: true }).catch(() => {
        // A cache that cannot be removed is stale, not broken; the flag is still advanced so this
        // does not retry on every launch.
    });
    store.set('music_video_cache_generation', CACHE_FORMAT_GENERATION);
    log.info('Music video cache: cleared for a download-format change');
};

app.whenReady().then(resetCacheIfFormatChanged);

/**
 * `<video>` playback issues byte-range requests to buffer and to seek, not one whole-file fetch,
 * so this answers them. A handler that ignored `Range` and returned the whole file every time
 * would leave Chromium's media pipeline seeing the stream restart from byte 0 whenever it asked
 * for a later chunk, which shows up as the video jumping back to the start on its own.
 */
const handleVideoRequest = async (request: Request): Promise<Response> => {
    const fileName = decodeURIComponent(new URL(request.url).pathname.replace(/^\//, ''));

    if (!CACHED_VIDEO_RE.test(fileName)) {
        return new Response(null, { status: 404 });
    }

    const filePath = join(getMusicVideoCacheDir(), fileName);

    let size: number;
    try {
        ({ size } = await stat(filePath));
    } catch {
        return new Response(null, { status: 404 });
    }

    const range = request.headers.get('range')?.match(/^bytes=(\d*)-(\d*)$/);

    if (!range) {
        return new Response(Readable.toWeb(createReadStream(filePath)) as ReadableStream, {
            headers: {
                'accept-ranges': 'bytes',
                // The still-image check draws a frame to a canvas and reads it back, which a
                // cross-origin video taints and blocks. This scheme is a different origin from
                // the page, so the response has to opt in or that check silently stops working -
                // it throws, reports nothing readable, and every candidate passes.
                'access-control-allow-origin': '*',
                'content-length': String(size),
                'content-type': 'video/mp4',
            },
            status: 200,
        });
    }

    const start = range[1] ? Number(range[1]) : 0;
    const end = range[2] ? Number(range[2]) : size - 1;

    return new Response(
        Readable.toWeb(createReadStream(filePath, { end, start })) as ReadableStream,
        {
            headers: {
                'accept-ranges': 'bytes',
                // See the note on the whole-file response above.
                'access-control-allow-origin': '*',
                'content-length': String(end - start + 1),
                'content-range': `bytes ${start}-${end}/${size}`,
                'content-type': 'video/mp4',
            },
            status: 206,
        },
    );
};

app.whenReady().then(() => {
    protocol.handle(MUSIC_VIDEO_PROTOCOL, handleVideoRequest);
});

ipcMain.handle('music-video-cache-stats', async (): Promise<MusicVideoCacheStats> => {
    const entries = await readCachedVideos();

    return {
        bytes: entries.reduce((sum, entry) => sum + entry.bytes, 0),
        count: entries.length,
    };
});

// Exposed separately from the download path so lowering the limit in Settings takes effect
// immediately, instead of waiting for the next track that happens to need a download.
ipcMain.handle('music-video-prune-cache', async (_event, limitBytes: number): Promise<void> => {
    await pruneVideoCache(limitBytes);
});

/**
 * Decodes the local track straight to the shape the fingerprint wants, in this process.
 *
 * The renderer used to fetch the stream URL itself and hand the bytes to `decodeAudioData`, which
 * meant a cross-origin request from the renderer's own origin and a decoded buffer of the entire
 * track - tens of megabytes for one lossless file. ffmpeg is already a requirement here, the
 * stream URL already carries its own authentication, and the fingerprint only looks at mono audio
 * below about 5.5 kHz, so trimming and downmixing here costs nothing it uses and hands back a few
 * megabytes instead.
 */
ipcMain.handle(
    'music-video-extract-local-audio',
    async (_event, streamUrl: string, maxSeconds: number): Promise<Uint8Array> => {
        const ffmpegPath = await resolveFfmpegPath();

        if (!ffmpegPath) {
            throw new Error('ffmpeg not found');
        }

        const outputPath = join(tmpdir(), `feishin-local-audio-${randomUUID()}.wav`);

        try {
            await runBinary(ffmpegPath, [
                '-i',
                streamUrl,
                '-t',
                String(maxSeconds),
                '-ac',
                '1',
                '-ar',
                String(FINGERPRINT_SAMPLE_RATE),
                '-f',
                'wav',
                '-y',
                outputPath,
            ]);

            const buffer = await readFile(outputPath);
            return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
        } catch (error) {
            log.error('Music video local audio extraction failed', error);
            throw new Error('ffmpeg local audio extraction failed');
        } finally {
            await unlink(outputPath).catch(() => {
                // Nothing to clean up when extraction never produced a file.
            });
        }
    },
);

ipcMain.handle('music-video-clear-video-cache', async (): Promise<void> => {
    await rm(getMusicVideoCacheDir(), { force: true, recursive: true });
});
