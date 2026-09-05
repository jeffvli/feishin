import type { FingerprintRequest, FingerprintResponse } from './fingerprint-worker';

import { AudioFingerprint } from './audio-fingerprint';
import { decodeMonoPcmWav } from './wav';

// One worker, created on first use and kept. Analysis is sequential anyway - one candidate is
// scored before the next is fetched - so a pool would only add idle threads, and tearing the
// worker down between tracks would pay its startup cost on every lookup.
let worker: null | Worker = null;
let nextRequestId = 0;

const pending = new Map<
    number,
    { reject: (error: Error) => void; resolve: (value: AudioFingerprint) => void }
>();

/**
 * Fingerprints a mono wav extracted by the main process, off the main thread.
 *
 * The samples are transferred rather than copied, so `bytes` must not be used again afterwards.
 */
export function fingerprintWav(bytes: Uint8Array): Promise<AudioFingerprint> {
    const samples = decodeMonoPcmWav(bytes);
    const id = nextRequestId;
    nextRequestId += 1;

    return new Promise<AudioFingerprint>((resolve, reject) => {
        pending.set(id, { reject, resolve });
        getWorker().postMessage({ id, samples } satisfies FingerprintRequest, [samples.buffer]);
    });
}

function getWorker(): Worker {
    if (worker) return worker;

    worker = new Worker(new URL('./fingerprint-worker.ts', import.meta.url), { type: 'module' });

    worker.onmessage = (event: MessageEvent<FingerprintResponse>) => {
        const { error, fingerprint, id } = event.data;
        const request = pending.get(id);
        if (!request) return;

        pending.delete(id);
        if (fingerprint) {
            request.resolve(fingerprint);
        } else {
            request.reject(new Error(error ?? 'fingerprint failed'));
        }
    };

    worker.onerror = () => {
        // A worker that has died takes every request in flight with it, and a replacement is made
        // on the next call rather than here - there is nothing to retry against until then.
        for (const request of pending.values()) {
            request.reject(new Error('fingerprint worker failed'));
        }
        pending.clear();
        worker?.terminate();
        worker = null;
    };

    return worker;
}
