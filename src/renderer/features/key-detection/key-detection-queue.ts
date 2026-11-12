import { getDetectedKeyId, type SongRef } from '/@/renderer/features/key-detection/detected-keys';

type DetectionResult = 'detected' | 'failed' | 'none';

interface Job<T> {
    id: string;
    listeners: ((result: DetectionResult) => void)[];
    song: T;
}

interface KeyDetectionQueueOptions<T extends SongRef> {
    /** Camelot key of the song's audio, or null when it has none. */
    detect: (song: T) => Promise<null | string>;
    isAutoDetectEnabled: () => boolean;
    onDetected: (song: T, key: string) => void;
    onFailed: (song: T, error: unknown) => void;
}

/**
 * Detects one song at a time. The most recently requested song goes first, so rows on screen
 * beat rows scrolled past, and a song is never detected twice at once.
 */
export class KeyDetectionQueue<T extends SongRef> {
    // Songs the automatic detection already tried, so a failure is not retried on every render
    private readonly attempted = new Set<string>();
    private isRunning = false;
    // Map order is the queue order: the last entry runs next
    private readonly jobs = new Map<string, Job<T>>();
    private readonly options: KeyDetectionQueueOptions<T>;

    constructor(options: KeyDetectionQueueOptions<T>) {
        this.options = options;
    }

    /** Detects the songs in order, then reports how many keys were found and how many failed. */
    enqueueBatch(
        songs: T[],
        report: { detected: (count: number) => void; failed: (count: number) => void },
    ) {
        const results: DetectionResult[] = [];

        const onResult = (result: DetectionResult) => {
            results.push(result);

            if (results.length < songs.length) {
                return;
            }

            const detected = results.filter((r) => r === 'detected').length;
            const failed = results.filter((r) => r === 'failed').length;

            if (detected > 0) {
                report.detected(detected);
            }

            if (failed > 0) {
                report.failed(failed);
            }
        };

        // Last to first, since the most recent request runs first
        songs.toReversed().forEach((song) => this.add(song, onResult));
        void this.run();
    }

    /** Queues a song shown without a key, unless the automatic detection already tried it. */
    requestAutomatic(song: T | undefined, key: null | string) {
        if (song && !key && !this.attempted.has(getDetectedKeyId(song))) {
            this.add(song);
            void this.run();
        }
    }

    private add(song: T, listener?: (result: DetectionResult) => void) {
        const id = getDetectedKeyId(song);
        const job = this.jobs.get(id) ?? { id, listeners: [], song };

        if (listener) {
            job.listeners.push(listener);
        }

        // Re-inserting moves a waiting song to the front, and keeps a running one from starting again
        this.jobs.delete(id);
        this.jobs.set(id, job);
    }

    private async detect(song: T): Promise<DetectionResult> {
        try {
            const key = await this.options.detect(song);

            if (!key) {
                return 'none';
            }

            this.options.onDetected(song, key);
            return 'detected';
        } catch (error) {
            this.options.onFailed(song, error);
            return 'failed';
        }
    }

    private nextJob() {
        return Array.from(this.jobs.values()).at(-1);
    }

    private async run() {
        if (this.isRunning) {
            return;
        }

        this.isRunning = true;

        for (let job = this.nextJob(); job; job = this.nextJob()) {
            await this.runJob(job);
        }

        this.isRunning = false;
    }

    private async runJob(job: Job<T>) {
        // Automatic requests have no listeners; drop them once automatic detection is turned off
        if (job.listeners.length > 0 || this.options.isAutoDetectEnabled()) {
            const result = await this.detect(job.song);
            this.attempted.add(job.id);
            job.listeners.forEach((listener) => listener(result));
        }

        this.jobs.delete(job.id);
    }
}
