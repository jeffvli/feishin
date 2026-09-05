import FFT from 'fft.js';

/**
 * Sample rate the whole matching pipeline runs at, for both the local track and every YouTube
 * candidate. Landmark hashes are only ever compared between fingerprints computed at this same
 * rate, so this also caps the highest frequency (~5.5 kHz) a landmark can be drawn from - plenty
 * for identifying a recording, since that is roughly where a lossy re-encode's high end already
 * starts rolling off.
 */
export const FINGERPRINT_SAMPLE_RATE = 11025;

/** STFT window size in samples (~93 ms at `FINGERPRINT_SAMPLE_RATE`), a power of two for `fft.js`. */
const WINDOW_SIZE = 1024;

/** STFT hop size in samples (~23 ms), i.e. successive windows overlap by 3/4. */
export const HOP_SIZE = 256;

// Bin 0 is DC and the next few carry hum/rumble that re-encoders treat very differently, so
// landmarks are only ever drawn from the band between here and Nyquist (WINDOW_SIZE / 2).
const MIN_BIN = 10;
const MAX_BIN = 511;
const BIN_COUNT = MAX_BIN - MIN_BIN + 1;

const LOG_MAGNITUDE_FLOOR = 1e-9;

// A peak must beat every bin within this many frames/bins of it to be picked as a landmark
// anchor - +-2 frames (~46 ms) and +-9 bins is small enough to find genuine local maxima in a
// dense spectrogram without an entire harmonic ridge collapsing into a single point.
const PEAK_FRAME_RADIUS = 2;
const PEAK_BIN_RADIUS = 9;

// A local maximum also has to clear the noise floor around it, or a flat/silent stretch would
// count as "full of peaks" once zoomed in far enough. 8 dB is a magnitude ratio of ~2.5x,
// expressed here as a natural-log difference to match the log-magnitude spectrogram below
// (dB is a base-10, factor-of-20 scale; ln(x) = log10(x) * ln(10)).
const PEAK_DB_MARGIN = 8;
const PEAK_LOG_MARGIN = (PEAK_DB_MARGIN / 20) * Math.log(10);

// Caps how many landmarks a single second of audio can contribute, so the loudest, busiest
// sections of a track can't crowd the hash table with duplicated ridges at the expense of
// quieter but still identifying passages.
const MAX_PEAKS_PER_SECOND = 25;
const FRAMES_PER_SECOND = FINGERPRINT_SAMPLE_RATE / HOP_SIZE;

// The "target zone": each anchor peak is paired with peaks shortly after it in time. Bounding
// both dt and the fan-out per anchor keeps the hash table's size roughly linear in track length
// rather than quadratic in peak count.
const TARGET_ZONE_MIN_DT = 1;
const TARGET_ZONE_MAX_DT = 63;
const TARGET_ZONE_MAX_BIN_DELTA = 128;
const TARGET_ZONE_FAN_OUT = 6;

export interface AudioFingerprint {
    /** Landmark hash -> every anchor frame index that produced it. */
    hashesByValue: Map<number, number[]>;
}

interface Peak {
    bin: number;
    frame: number;
    magnitude: number;
}

function createHannWindow(size: number): Float64Array {
    const window = new Float64Array(size);
    for (let i = 0; i < size; i += 1) {
        window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1));
    }
    return window;
}

const HANN_WINDOW = createHannWindow(WINDOW_SIZE);

/**
 * Computes a Shazam-style spectral-landmark fingerprint: STFT the samples, pick spectral peaks,
 * and hash pairs of nearby peaks into landmarks. `matchFingerprints` (`fingerprint-match.ts`) then
 * compares two fingerprints by looking for hash collisions rather than comparing the audio itself,
 * which is what makes the match tolerant of loudness normalization, bitrate, and container
 * differences between the local file and a YouTube rip.
 *
 * Takes raw samples rather than an `AudioBuffer` and does no resampling of its own, because the
 * audio arrives already at this rate from ffmpeg. That is what lets this run in a worker: there is
 * nothing here that needs the main thread, and a few thousand FFTs on the main thread is what made
 * a playing video drop frames while the next track was being analysed.
 */
export function computeFingerprintFromSamples(samples: Float32Array): AudioFingerprint {
    const frameCount = Math.max(1, Math.ceil(samples.length / HOP_SIZE));
    const spectrogram = new Float64Array(frameCount * BIN_COUNT);

    const fft = new FFT(WINDOW_SIZE);
    const frameBuffer = new Float64Array(WINDOW_SIZE);
    const fftOutput = new Float64Array(WINDOW_SIZE * 2);

    for (let frame = 0; frame < frameCount; frame += 1) {
        const start = frame * HOP_SIZE;
        const available = Math.min(WINDOW_SIZE, samples.length - start);

        for (let i = 0; i < WINDOW_SIZE; i += 1) {
            frameBuffer[i] = i < available ? samples[start + i] * HANN_WINDOW[i] : 0;
        }

        fft.realTransform(fftOutput, frameBuffer);

        const base = frame * BIN_COUNT;
        for (let bin = MIN_BIN; bin <= MAX_BIN; bin += 1) {
            const re = fftOutput[bin * 2];
            const im = fftOutput[bin * 2 + 1];
            spectrogram[base + (bin - MIN_BIN)] = Math.log(
                Math.sqrt(re * re + im * im) + LOG_MAGNITUDE_FLOOR,
            );
        }
    }

    return {
        hashesByValue: buildLandmarkHashes(pickPeaks(spectrogram, frameCount, BIN_COUNT)),
    };
}

/**
 * Pairs each anchor peak with up to `TARGET_ZONE_FAN_OUT` peaks shortly after it (the "target
 * zone") and hashes each pair into a single 32-bit int. Two recordings of the same audio produce
 * the same hash at the same relative offset even under moderate re-encoding noise, because the
 * hash only depends on which bins a landmark pair fell in and how far apart in time they were -
 * not on their absolute position in either track. `dt` fits in 6 bits (0-63) and each bin fits
 * in 9 bits (0-511, matching `MAX_BIN`), so the two bins and `dt` pack into 24 bits total.
 */
function buildLandmarkHashes(peaks: Peak[]): Map<number, number[]> {
    const hashesByValue = new Map<number, number[]>();

    for (let anchorIndex = 0; anchorIndex < peaks.length; anchorIndex += 1) {
        const anchor = peaks[anchorIndex];
        let pairCount = 0;

        for (
            let targetIndex = anchorIndex + 1;
            targetIndex < peaks.length && pairCount < TARGET_ZONE_FAN_OUT;
            targetIndex += 1
        ) {
            const target = peaks[targetIndex];
            const dt = target.frame - anchor.frame;

            // Peaks are time-ordered, so once dt overshoots the target zone every later
            // candidate will too.
            if (dt > TARGET_ZONE_MAX_DT) break;
            if (dt < TARGET_ZONE_MIN_DT) continue;
            if (Math.abs(target.bin - anchor.bin) >= TARGET_ZONE_MAX_BIN_DELTA) continue;

            const hash = (anchor.bin << 15) | (target.bin << 6) | dt;
            const anchors = hashesByValue.get(hash);
            if (anchors) {
                anchors.push(anchor.frame);
            } else {
                hashesByValue.set(hash, [anchor.frame]);
            }

            pairCount += 1;
        }
    }

    return hashesByValue;
}

/** Keeps only the strongest `MAX_PEAKS_PER_SECOND` peaks per one-second block, by magnitude. */
function capPeakDensity(peaks: Peak[]): Peak[] {
    const buckets = new Map<number, Peak[]>();

    for (const peak of peaks) {
        const bucket = Math.floor(peak.frame / FRAMES_PER_SECOND);
        const list = buckets.get(bucket);
        if (list) {
            list.push(peak);
        } else {
            buckets.set(bucket, [peak]);
        }
    }

    const capped: Peak[] = [];
    for (const list of buckets.values()) {
        list.sort((a, b) => b.magnitude - a.magnitude);
        capped.push(...list.slice(0, MAX_PEAKS_PER_SECOND));
    }

    // Hashing below relies on peaks being in time order to scan the target zone forward and
    // stop early, which the per-bucket magnitude sort just undid.
    capped.sort((a, b) => a.frame - b.frame || a.bin - b.bin);
    return capped;
}

/** Max over the rectangle `[frame +- PEAK_FRAME_RADIUS, bin +- PEAK_BIN_RADIUS]` for every cell. */
function computeNeighborhoodMax(
    spectrogram: Float64Array,
    frameCount: number,
    binCount: number,
): Float64Array {
    const rowMax = new Float64Array(spectrogram.length);
    for (let frame = 0; frame < frameCount; frame += 1) {
        const base = frame * binCount;
        rowMax.set(
            slidingWindowMax(spectrogram.subarray(base, base + binCount), PEAK_BIN_RADIUS),
            base,
        );
    }

    const columnMax = new Float64Array(spectrogram.length);
    const column = new Float64Array(frameCount);
    for (let bin = 0; bin < binCount; bin += 1) {
        for (let frame = 0; frame < frameCount; frame += 1) {
            column[frame] = rowMax[frame * binCount + bin];
        }

        const maxed = slidingWindowMax(column, PEAK_FRAME_RADIUS);
        for (let frame = 0; frame < frameCount; frame += 1) {
            columnMax[frame * binCount + bin] = maxed[frame];
        }
    }

    return columnMax;
}

/**
 * Median of the same rectangular neighborhood peak-picking maxima are tested against. Only ever
 * called for a cell that already passed the far cheaper neighborhood-max test - true local
 * maxima are a small fraction of a spectrogram - so sorting a small array per call stays cheap.
 */
function localMedian(
    spectrogram: Float64Array,
    frameCount: number,
    binCount: number,
    frame: number,
    bin: number,
): number {
    const values: number[] = [];

    for (let df = -PEAK_FRAME_RADIUS; df <= PEAK_FRAME_RADIUS; df += 1) {
        const f = frame + df;
        if (f < 0 || f >= frameCount) continue;

        for (let db = -PEAK_BIN_RADIUS; db <= PEAK_BIN_RADIUS; db += 1) {
            const b = bin + db;
            if (b < 0 || b >= binCount) continue;
            values.push(spectrogram[f * binCount + b]);
        }
    }

    values.sort((a, b) => a - b);
    return values[Math.floor(values.length / 2)];
}

function pickPeaks(spectrogram: Float64Array, frameCount: number, binCount: number): Peak[] {
    const neighborhoodMax = computeNeighborhoodMax(spectrogram, frameCount, binCount);
    const peaks: Peak[] = [];

    for (let frame = 0; frame < frameCount; frame += 1) {
        for (let bin = 0; bin < binCount; bin += 1) {
            const index = frame * binCount + bin;
            const value = spectrogram[index];

            // Ties with the neighborhood max are, in practice, never anything but the point
            // itself - real FFT magnitudes essentially never land on the exact same float twice.
            // A perfectly flat run (e.g. true digital silence) would tie every cell in it, but
            // the median-margin check just below rejects those anyway.
            if (value !== neighborhoodMax[index]) continue;
            if (
                value - localMedian(spectrogram, frameCount, binCount, frame, bin) <
                PEAK_LOG_MARGIN
            )
                continue;

            peaks.push({ bin: bin + MIN_BIN, frame, magnitude: value });
        }
    }

    return capPeakDensity(peaks);
}

/**
 * Maximum over the sliding window `[i - radius, i + radius]` for every `i`, computed in one
 * linear pass with a monotonic deque (the standard "sliding window maximum" trick) instead of
 * the naive `O(n * radius)` scan. Applying this once along bins and once along frames is what
 * makes 2D peak-picking over a whole spectrogram cheap enough to run inline - a rectangular max
 * filter is exactly the max of those two 1D passes.
 */
function slidingWindowMax(values: Float64Array, radius: number): Float64Array {
    const { length } = values;
    const result = new Float64Array(length);
    const dequeIndices = new Int32Array(length);
    let head = 0;
    let tail = 0;

    for (let i = 0; i < length + radius; i += 1) {
        if (i < length) {
            while (tail > head && values[dequeIndices[tail - 1]] <= values[i]) {
                tail -= 1;
            }
            dequeIndices[tail] = i;
            tail += 1;
        }

        const center = i - radius;
        if (center >= 0 && center < length) {
            while (dequeIndices[head] < center - radius) {
                head += 1;
            }
            result[center] = values[dequeIndices[head]];
        }
    }

    return result;
}
