import { AudioFingerprint, computeFingerprintFromSamples } from './audio-fingerprint';

export interface FingerprintRequest {
    id: number;
    samples: Float32Array;
}

export interface FingerprintResponse {
    error?: string;
    fingerprint?: AudioFingerprint;
    id: number;
}

self.onmessage = (event: MessageEvent<FingerprintRequest>) => {
    const { id, samples } = event.data;

    try {
        const fingerprint = computeFingerprintFromSamples(samples);
        (self as unknown as Worker).postMessage({ fingerprint, id } satisfies FingerprintResponse);
    } catch (error) {
        (self as unknown as Worker).postMessage({
            error: error instanceof Error ? error.message : String(error),
            id,
        } satisfies FingerprintResponse);
    }
};
