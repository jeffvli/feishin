export class RateLimitedFetch {
    private active = 0;
    private queue: Array<() => void> = [];

    constructor(private maxConcurrent: number = 6) {}

    async fetch(url: string, init?: RequestInit): Promise<Response> {
        await this.acquire();
        try {
            return await fetch(url, init);
        } finally {
            this.release();
        }
    }

    private acquire(): Promise<void> {
        if (this.active < this.maxConcurrent) {
            this.active++;
            return Promise.resolve();
        }
        return new Promise<void>((resolve) => {
            this.queue.push(() => {
                this.active++;
                resolve();
            });
        });
    }

    private release(): void {
        this.active--;
        const next = this.queue.shift();
        if (next) next();
    }
}
