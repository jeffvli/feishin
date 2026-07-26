import { createHash } from 'crypto';
import { net } from 'electron';
import { mkdir, readdir, readFile, rm, stat, unlink, writeFile } from 'fs/promises';
import { join } from 'path';

interface CachedImage {
    buffer: Buffer;
    contentType: string;
}

interface CacheEntry {
    contentType: string;
    hash: string;
    lastAccessed: number;
    size: number;
}

interface ImageCacheConfig {
    enabled?: boolean;
    maxSizeMB?: number;
    rateLimitBurst?: number;
    rateLimitMaxConcurrent?: number;
    rateLimitRefillPerSec?: number;
}

interface ImageCacheStats {
    entryCount: number;
    hitCount: number;
    missCount: number;
    totalSizeBytes: number;
}

interface PersistedIndex {
    entries: CacheEntry[];
    version: number;
}

interface TokenBucket {
    lastRefill: number;
    tokens: number;
}

// ---------------------------------------------------------------------------
// FetchQueue - deduplicated fetching with rate limiting
// ---------------------------------------------------------------------------

export class FetchQueue {
    private inFlight: Map<string, Promise<CachedImage>> = new Map();
    private rateLimiter: RateLimiter;

    constructor(rateLimiter: RateLimiter) {
        this.rateLimiter = rateLimiter;
    }

    async fetch(originalUrl: string): Promise<CachedImage> {
        const existing = this.inFlight.get(originalUrl);
        if (existing) {
            return existing;
        }

        const promise = this.doFetch(originalUrl);
        this.inFlight.set(originalUrl, promise);

        try {
            const result = await promise;
            return result;
        } finally {
            this.inFlight.delete(originalUrl);
        }
    }

    private async doFetch(originalUrl: string): Promise<CachedImage> {
        const serverBaseUrl = this.extractBaseUrl(originalUrl);
        await this.rateLimiter.acquire(serverBaseUrl);

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15_000);

            let response: Response;
            try {
                response = await net.fetch(originalUrl, { signal: controller.signal });
            } finally {
                clearTimeout(timeoutId);
            }

            if (!response.ok) {
                throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const contentType = response.headers.get('content-type') || 'application/octet-stream';

            return { buffer, contentType };
        } finally {
            this.rateLimiter.release();
        }
    }

    private extractBaseUrl(url: string): string {
        try {
            const parsed = new URL(url);
            return `${parsed.protocol}//${parsed.host}`;
        } catch {
            return 'unknown';
        }
    }
}

// ---------------------------------------------------------------------------
// ImageCache - disk-based LRU image cache
// ---------------------------------------------------------------------------

export class ImageCache {
    private cacheDir: string;
    private enabled: boolean = true;
    private hitCount: number = 0;
    private index: Map<string, CacheEntry> = new Map();
    private maxSizeBytes: number = 1000 * 1024 * 1024;
    private missCount: number = 0;
    private persistTimer: null | ReturnType<typeof setTimeout> = null;
    private totalSizeBytes: number = 0;

    constructor(cacheDir: string) {
        this.cacheDir = cacheDir;
    }

    async clear(): Promise<void> {
        if (this.persistTimer) {
            clearTimeout(this.persistTimer);
            this.persistTimer = null;
        }
        await rm(this.cacheDir, { force: true, recursive: true });
        await mkdir(this.cacheDir, { recursive: true });
        this.index.clear();
        this.totalSizeBytes = 0;
    }

    async get(url: string): Promise<CachedImage | null> {
        if (!this.enabled) {
            this.missCount++;
            return null;
        }

        const hash = this.hashUrl(url);
        const entry = this.index.get(hash);

        if (!entry) {
            this.missCount++;
            return null;
        }

        const subdir = hash.substring(0, 2);
        const filePath = join(this.cacheDir, subdir, `${hash}.bin`);

        try {
            const buffer = await readFile(filePath);
            entry.lastAccessed = Date.now();
            this.schedulePersist();
            this.hitCount++;
            return { buffer, contentType: entry.contentType };
        } catch {
            this.totalSizeBytes -= entry.size;
            this.index.delete(hash);
            this.schedulePersist();
            this.missCount++;
            return null;
        }
    }

    getStats(): ImageCacheStats {
        return {
            entryCount: this.index.size,
            hitCount: this.hitCount,
            missCount: this.missCount,
            totalSizeBytes: this.totalSizeBytes,
        };
    }

    async init(): Promise<void> {
        await mkdir(this.cacheDir, { recursive: true });
        const indexPath = join(this.cacheDir, 'index.json');

        try {
            const raw = await readFile(indexPath, 'utf-8');
            const persisted: PersistedIndex = JSON.parse(raw);

            if (persisted && persisted.version === 1 && Array.isArray(persisted.entries)) {
                this.index.clear();
                this.totalSizeBytes = 0;
                for (const entry of persisted.entries) {
                    if (
                        entry.hash &&
                        typeof entry.size === 'number' &&
                        typeof entry.contentType === 'string' &&
                        typeof entry.lastAccessed === 'number'
                    ) {
                        this.index.set(entry.hash, entry);
                        this.totalSizeBytes += entry.size;
                    }
                }
                return;
            }
            throw new Error('Invalid index structure');
        } catch {
            await this.rebuildIndex();
        }
    }

    async put(url: string, buffer: Buffer, contentType: string): Promise<void> {
        if (!this.enabled) return;

        const hash = this.hashUrl(url);
        const subdir = hash.substring(0, 2);
        const dirPath = join(this.cacheDir, subdir);
        const filePath = join(this.cacheDir, subdir, `${hash}.bin`);

        await mkdir(dirPath, { recursive: true });
        await writeFile(filePath, buffer);

        const existing = this.index.get(hash);
        if (existing) {
            this.totalSizeBytes -= existing.size;
        }

        const entry: CacheEntry = {
            contentType,
            hash,
            lastAccessed: Date.now(),
            size: buffer.length,
        };

        this.index.set(hash, entry);
        this.totalSizeBytes += entry.size;
        this.schedulePersist();

        if (this.totalSizeBytes > this.maxSizeBytes) {
            await this.evict();
        }
    }

    async shutdown(): Promise<void> {
        if (this.persistTimer) {
            clearTimeout(this.persistTimer);
            this.persistTimer = null;
        }
        await this.persistIndex();
    }

    updateConfig(config: ImageCacheConfig): void {
        if (config.maxSizeMB !== undefined) {
            this.maxSizeBytes = config.maxSizeMB * 1024 * 1024;
        }
        if (config.enabled !== undefined) {
            this.enabled = config.enabled;
        }
    }

    private async evict(): Promise<void> {
        if (this.totalSizeBytes <= this.maxSizeBytes) return;

        const entries = Array.from(this.index.values()).sort(
            (a, b) => a.lastAccessed - b.lastAccessed,
        );

        const deletePromises: Promise<void>[] = [];
        for (const entry of entries) {
            if (this.totalSizeBytes <= this.maxSizeBytes) break;
            const subdir = entry.hash.substring(0, 2);
            const filePath = join(this.cacheDir, subdir, `${entry.hash}.bin`);
            deletePromises.push(unlink(filePath).catch(() => {}));
            this.totalSizeBytes -= entry.size;
            this.index.delete(entry.hash);
        }
        await Promise.all(deletePromises);
        this.schedulePersist();
    }

    private hashUrl(url: string): string {
        return createHash('sha256').update(url).digest('hex');
    }

    private async persistIndex(): Promise<void> {
        const persisted: PersistedIndex = {
            entries: Array.from(this.index.values()),
            version: 1,
        };
        const indexPath = join(this.cacheDir, 'index.json');
        try {
            await writeFile(indexPath, JSON.stringify(persisted), 'utf-8');
        } catch {
            // Non-fatal - index can be rebuilt from disk on next startup
        }
    }

    private async rebuildIndex(): Promise<void> {
        this.index.clear();
        this.totalSizeBytes = 0;

        try {
            const topEntries = await readdir(this.cacheDir, { withFileTypes: true });
            for (const topEntry of topEntries) {
                if (!topEntry.isDirectory()) continue;
                if (!/^[0-9a-f]{2}$/.test(topEntry.name)) continue;

                const subdirPath = join(this.cacheDir, topEntry.name);
                let files: string[];
                try {
                    files = await readdir(subdirPath);
                } catch {
                    continue;
                }

                for (const file of files) {
                    if (!file.endsWith('.bin')) continue;
                    const hash = file.slice(0, -4);
                    const filePath = join(subdirPath, file);
                    try {
                        const fileStat = await stat(filePath);
                        const entry: CacheEntry = {
                            contentType: 'application/octet-stream',
                            hash,
                            lastAccessed: fileStat.mtimeMs,
                            size: fileStat.size,
                        };
                        this.index.set(hash, entry);
                        this.totalSizeBytes += entry.size;
                    } catch {
                        // Skip files we can't stat
                    }
                }
            }
        } catch {
            this.index.clear();
            this.totalSizeBytes = 0;
        }

        await this.persistIndex();
    }

    private schedulePersist(): void {
        if (this.persistTimer) {
            clearTimeout(this.persistTimer);
        }
        this.persistTimer = setTimeout(() => {
            this.persistTimer = null;
            this.persistIndex();
        }, 30_000);
    }
}

// ---------------------------------------------------------------------------
// RateLimiter - token bucket per server base URL + concurrency semaphore
// ---------------------------------------------------------------------------

export class RateLimiter {
    private buckets: Map<string, TokenBucket> = new Map();
    private burstSize: number;
    private concurrentCount: number = 0;
    private concurrentWaiters: Array<() => void> = [];
    private maxConcurrent: number;
    private refillPerSec: number;

    constructor(burstSize: number = 10, refillPerSec: number = 5, maxConcurrent: number = 6) {
        this.burstSize = burstSize;
        this.refillPerSec = refillPerSec;
        this.maxConcurrent = maxConcurrent;
    }

    async acquire(serverBaseUrl: string): Promise<void> {
        await this.acquireToken(serverBaseUrl);
        await this.acquireConcurrencySlot();
    }

    release(): void {
        this.concurrentCount--;
        if (this.concurrentWaiters.length > 0) {
            const next = this.concurrentWaiters.shift()!;
            this.concurrentCount++;
            next();
        }
    }

    updateConfig(config: {
        burstSize?: number;
        maxConcurrent?: number;
        refillPerSec?: number;
    }): void {
        if (config.burstSize !== undefined) this.burstSize = config.burstSize;
        if (config.refillPerSec !== undefined) this.refillPerSec = config.refillPerSec;
        if (config.maxConcurrent !== undefined) this.maxConcurrent = config.maxConcurrent;
    }

    private acquireConcurrencySlot(): Promise<void> {
        if (this.concurrentCount < this.maxConcurrent) {
            this.concurrentCount++;
            return Promise.resolve();
        }
        return new Promise<void>((resolve) => {
            this.concurrentWaiters.push(() => {
                resolve();
            });
        });
    }

    private acquireToken(serverBaseUrl: string): Promise<void> {
        let bucket = this.buckets.get(serverBaseUrl);
        if (!bucket) {
            bucket = { lastRefill: Date.now(), tokens: this.burstSize };
            this.buckets.set(serverBaseUrl, bucket);
        }

        this.refillBucket(bucket);

        if (bucket.tokens >= 1) {
            bucket.tokens -= 1;
            return Promise.resolve();
        }

        const tokensNeeded = 1 - bucket.tokens;
        const waitMs = (tokensNeeded / this.refillPerSec) * 1000;

        return new Promise<void>((resolve) => {
            setTimeout(() => {
                this.refillBucket(bucket);
                bucket.tokens = Math.max(0, bucket.tokens - 1);
                resolve();
            }, Math.ceil(waitMs));
        });
    }

    private refillBucket(bucket: TokenBucket): void {
        const now = Date.now();
        const elapsedSec = (now - bucket.lastRefill) / 1000;
        const newTokens = elapsedSec * this.refillPerSec;
        bucket.tokens = Math.min(this.burstSize, bucket.tokens + newTokens);
        bucket.lastRefill = now;
    }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

export function createImageCacheSystem(cacheDir: string): {
    fetchQueue: FetchQueue;
    imageCache: ImageCache;
    rateLimiter: RateLimiter;
} {
    const imageCache = new ImageCache(cacheDir);
    const rateLimiter = new RateLimiter();
    const fetchQueue = new FetchQueue(rateLimiter);
    return { fetchQueue, imageCache, rateLimiter };
}
