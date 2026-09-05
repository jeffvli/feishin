// Frames are compared at a deliberately tiny size: the question is only whether anything in the
// picture moves at all, and downscaling to a thumbnail averages away compression noise and film
// grain that would otherwise register as motion in a genuinely still image.
const SAMPLE_SIZE = 32;

// Spread far enough apart that a slow crossfade or a held camera shot still registers as motion,
// and repeated enough that one unlucky pair of identical frames can't decide the answer.
const SAMPLE_COUNT = 4;
const SAMPLE_INTERVAL_MS = 600;

// Mean per-pixel luma difference (0-255) below which two frames are treated as the same picture.
// Not zero: even a still image re-encodes with slight frame-to-frame variation.
const STATIC_MEAN_LUMA_DIFF = 1.5;

// Sampled from here into the video rather than from the start, because the opening seconds of a
// real music video are very often a title card or a fade from black - which is a still picture,
// and would fail an honest candidate.
const PROBE_START_FRACTION = 0.4;

// A candidate that will not load, seek or play within this is not worth waiting on any longer;
// it is reported as not-static so it takes the ordinary playback path and fails there if it is
// going to, rather than being disqualified on a timeout.
const PROBE_TIMEOUT_MS = 20000;

/**
 * Reports whether a downloaded candidate is one still image held for the length of the song -
 * an album-art upload rather than a music video - which is no more useful than the cover art the
 * app already shows.
 *
 * The candidate is probed on its own detached element rather than on the one the panel is
 * showing. That matters for two reasons. Committing each candidate to the visible element to test
 * it meant every rejected one was shown, and shown at its own dimensions, which made the panel
 * flicker between candidates and the picture-in-picture window resize itself each time. And a
 * video element that is currently presenting into a picture-in-picture window does not hand its
 * frames back through `drawImage`, so probing that element returned the same picture every time
 * and disqualified every candidate on a track - which is exactly what it did.
 */
export async function isStaticVideoSource(src: string): Promise<boolean> {
    const video = document.createElement('video');
    // Without this the frames cannot be read back off a canvas: the video is served from a custom
    // scheme, which is a different origin from the page, and a cross-origin video taints the
    // canvas it is drawn to. The handler sends the matching `access-control-allow-origin`.
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    const canvas = document.createElement('canvas');
    canvas.height = SAMPLE_SIZE;
    canvas.width = SAMPLE_SIZE;

    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return false;

    try {
        return await withTimeout(probe(video, canvas, context, src), PROBE_TIMEOUT_MS);
    } catch {
        // A candidate that never became playable is not a still image; it is a broken download,
        // and the ordinary playback path reports that on its own terms.
        return false;
    } finally {
        video.pause();
        video.removeAttribute('src');
        video.load();
    }
}

function meanAbsoluteDifference(a: Float32Array, b: Float32Array): number {
    let total = 0;
    for (let i = 0; i < a.length; i += 1) {
        total += Math.abs(a[i] - b[i]);
    }
    return total / a.length;
}

function once(video: HTMLVideoElement, event: string): Promise<void> {
    return new Promise((resolve, reject) => {
        video.addEventListener(event, () => resolve(), { once: true });
        video.addEventListener('error', () => reject(new Error(`video ${event} failed`)), {
            once: true,
        });
    });
}

async function probe(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
    src: string,
): Promise<boolean> {
    video.src = src;
    await once(video, 'loadedmetadata');

    if (Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = video.duration * PROBE_START_FRACTION;
        await once(video, 'seeked');
    }

    await video.play();

    let previous: Float32Array | null = null;
    let comparisons = 0;

    for (let sample = 0; sample < SAMPLE_COUNT; sample += 1) {
        const luma = sampleLuma(video, canvas, context);

        if (luma && previous) {
            comparisons += 1;
            if (meanAbsoluteDifference(luma, previous) >= STATIC_MEAN_LUMA_DIFF) {
                return false;
            }
        }

        previous = luma ?? previous;

        await new Promise((resolve) => {
            setTimeout(resolve, SAMPLE_INTERVAL_MS);
        });
    }

    // Every sampled pair was the same picture, and enough pairs were actually compared for that
    // to mean something. One readable frame on its own says nothing.
    return comparisons >= 2;
}

function sampleLuma(
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D,
): Float32Array | null {
    try {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
        const luma = new Float32Array(canvas.width * canvas.height);

        for (let i = 0; i < luma.length; i += 1) {
            const offset = i * 4;
            luma[i] = 0.299 * data[offset] + 0.587 * data[offset + 1] + 0.114 * data[offset + 2];
        }

        return luma;
    } catch {
        // A frame that isn't decodable yet just means there is nothing to compare this round.
        return null;
    }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_resolve, reject) => {
            setTimeout(() => reject(new Error('probe timed out')), ms);
        }),
    ]);
}
