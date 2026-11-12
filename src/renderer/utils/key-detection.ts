// Port of libkeyfinder (https://github.com/mixxxdj/libkeyfinder, GPL-3.0), the key detector Mixxx uses:
// a chromagram over 6 octaves from C1, summed over the track and matched against tone profiles.

import { toCamelotKey } from '/@/renderer/utils/camelot-key';
import { Fft } from '/@/renderer/utils/fft';

/** The parts of a decoded AudioBuffer the detection reads. */
interface DecodedAudio {
    getChannelData: (channel: number) => Float32Array;
    length: number;
    numberOfChannels: number;
}

/** Sample rate the audio must be decoded at. Covers B6 (1975.5 Hz), the highest band analysed. */
export const KEY_DETECTION_SAMPLE_RATE = 4410;

const FFT_SIZE = 16384;
const HOP_SIZE = FFT_SIZE / 4;
const SEMITONES = 12;
const OCTAVES = 6;
const BANDS = SEMITONES * OCTAVES;

const MAJOR_PROFILE = [
    7.239005026181452, 3.503511667251587, 3.584451775366494, 2.845118164786763, 5.818988921185499,
    4.55865057415321, 2.447788505455065, 6.994731921468295, 3.391066136735049, 4.556142566551435,
    4.073926666635236, 4.459327573788869,
];

const MINOR_PROFILE = [
    7.002550450602844, 3.143602790159967, 4.359043197149625, 5.404181207189341, 3.672344208793061,
    4.089711849177979, 3.90791435991554, 6.199602885623165, 3.634246256252774, 2.872411910798756,
    5.354679997945427, 3.832420385950484,
];

const OCTAVE_WEIGHTS = [
    0.3999726755, 0.5563442524830065, 0.5249663634514354, 0.6084754838427773, 0.5989811568,
    0.4907243531796099,
];

const PITCH_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// Band 0 is C1, band 45 is A4
const bandFrequency = (band: number) => 440 * 2 ** ((band - 45) / SEMITONES);

const fft = new Fft(FFT_SIZE);

const blackmanWindow = Float64Array.from(
    { length: FFT_SIZE },
    (_, n) =>
        0.42 -
        0.5 * Math.cos((2 * Math.PI * n) / (FFT_SIZE - 1)) +
        0.08 * Math.cos((4 * Math.PI * n) / (FFT_SIZE - 1)),
);

// Direct spectral kernel: each band is a weighted sum of the FFT bins around its frequency
const createKernel = (sampleRate: number) => {
    const qFactor = 0.8 * (2 ** (1 / SEMITONES) - 1);

    return Array.from({ length: BANDS }, (_, band) => {
        const frequency = bandFrequency(band);
        const centre = (frequency * FFT_SIZE) / sampleRate;
        const width = centre * qFactor;
        const begin = centre - width / 2;
        const offset = Math.ceil(begin);
        const weights: number[] = [];

        for (let bin = offset; bin <= Math.floor(begin + width); bin++) {
            weights.push(1 - Math.cos((2 * Math.PI * (bin - begin)) / width));
        }

        const sum = weights.reduce((a, b) => a + b, 0);

        return { offset, weights: weights.map((weight) => (weight / sum) * frequency) };
    });
};

// ponytail: runs on the main thread, one frame at a time; move to a Web Worker if it ever janks the UI.
// MessageChannel rather than setTimeout because timers are throttled in a hidden window.
const yieldToMainThread = () =>
    new Promise<void>((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = () => {
            channel.port1.close();
            resolve();
        };
        channel.port2.postMessage(null);
    });

// Copies one frame of audio, zero padded past the end, through the Blackman window
const loadWindowedFrame = (
    samples: Float32Array,
    start: number,
    re: Float64Array,
    im: Float64Array,
) => {
    for (let i = 0; i < FFT_SIZE; i++) {
        re[i] = (samples[start + i] ?? 0) * blackmanWindow[i];
        im[i] = 0;
    }
};

const addFrameChroma = (
    chroma: Float64Array,
    kernel: ReturnType<typeof createKernel>,
    re: Float64Array,
    im: Float64Array,
) => {
    for (let band = 0; band < BANDS; band++) {
        const { offset, weights } = kernel[band];
        for (let j = 0; j < weights.length; j++) {
            const bin = offset + j;
            chroma[band] += Math.sqrt(re[bin] ** 2 + im[bin] ** 2) * weights[j];
        }
    }
};

/** Chroma of the whole track: the spectral energy of each of the 72 bands, summed over every frame. */
export const chromagram = async (samples: Float32Array, sampleRate = KEY_DETECTION_SAMPLE_RATE) => {
    const kernel = createKernel(sampleRate);
    const chroma = new Float64Array(BANDS);
    const re = new Float64Array(FFT_SIZE);
    const im = new Float64Array(FFT_SIZE);
    const hops = Math.ceil(samples.length / HOP_SIZE);

    for (let hop = 0; hop < hops; hop++) {
        loadWindowedFrame(samples, hop * HOP_SIZE, re, im);
        fft.transform(re, im);
        addFrameChroma(chroma, kernel, re, im);
        await yieldToMainThread();
    }

    return chroma;
};

// Weight of a band in a key's tone profile: the tonic rotates the profile, the octave scales it
const profileWeight = (band: number, tonic: number, profile: number[]) =>
    OCTAVE_WEIGHTS[Math.floor(band / SEMITONES)] * profile[(band - tonic + BANDS) % SEMITONES];

// The same for every tonic, since the tonic only rotates the profile
const profileNorm = (profile: number[]) =>
    Math.hypot(...Array.from({ length: BANDS }, (_, band) => profileWeight(band, 0, profile)));

const MAJOR_NORM = profileNorm(MAJOR_PROFILE);
const MINOR_NORM = profileNorm(MINOR_PROFILE);

const KEYS = PITCH_NAMES.flatMap((name, tonic) => [
    { name, norm: MAJOR_NORM, profile: MAJOR_PROFILE, tonic },
    { name: `${name}m`, norm: MINOR_NORM, profile: MINOR_PROFILE, tonic },
]);

// Cosine similarity, without the chroma's own norm: it is the same for every key, so it never
// changes which key scores highest
const similarity = (chroma: Float64Array, key: (typeof KEYS)[number]) => {
    let dot = 0;

    for (let band = 0; band < BANDS; band++) {
        dot += chroma[band] * profileWeight(band, key.tonic, key.profile);
    }

    return dot / key.norm;
};

// The key whose tone profile is closest to the chroma; null when none scores above silence
const classify = (chroma: Float64Array) => {
    let best: null | string = null;
    let bestScore = 0;

    for (const key of KEYS) {
        const score = similarity(chroma, key);
        if (score > bestScore) {
            bestScore = score;
            best = key.name;
        }
    }

    return best;
};

/**
 * Detects the key of mono audio sampled at KEY_DETECTION_SAMPLE_RATE.
 * Returns the key in standard notation ("Am", "F#") or null for silence.
 */
export const detectKey = async (
    samples: Float32Array,
    sampleRate = KEY_DETECTION_SAMPLE_RATE,
): Promise<null | string> => classify(await chromagram(samples, sampleRate));

// A sum rather than an average: the detection does not depend on the level
const toMono = (audio: DecodedAudio) => {
    const mono = new Float32Array(audio.length);

    for (let channel = 0; channel < audio.numberOfChannels; channel++) {
        audio.getChannelData(channel).forEach((sample, i) => {
            mono[i] += sample;
        });
    }

    return mono;
};

/** Camelot key of audio decoded at KEY_DETECTION_SAMPLE_RATE, or null for silence. */
export const detectAudioCamelotKey = async (audio: DecodedAudio): Promise<null | string> => {
    const key = await detectKey(toMono(audio));

    return key && toCamelotKey(key);
};
