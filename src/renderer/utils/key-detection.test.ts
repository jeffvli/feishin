import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    chromagram,
    detectAudioCamelotKey,
    detectKey,
    KEY_DETECTION_SAMPLE_RATE,
} from '/@/renderer/utils/key-detection';

const PITCH_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];

// I-IV-V-I and i-iv-V-i (harmonic minor), as semitones above the tonic
const MAJOR_CADENCE = [
    [0, 4, 7],
    [5, 9, 12],
    [7, 11, 14],
    [0, 4, 7],
];
const MINOR_CADENCE = [
    [0, 3, 7],
    [5, 8, 12],
    [7, 11, 14],
    [0, 3, 7],
];

const midiFrequency = (note: number) => 440 * 2 ** ((note - 69) / 12);

/** Two seconds per chord, each note with three harmonics and a bass note on the root. */
const renderCadence = (tonic: number, cadence: number[][], repeats = 2) => {
    const chordLength = KEY_DETECTION_SAMPLE_RATE * 2;
    const samples = new Float32Array(chordLength * cadence.length * repeats);

    for (let chord = 0; chord < cadence.length * repeats; chord++) {
        const intervals = cadence[chord % cadence.length];
        const notes = [48 + tonic + intervals[0], ...intervals.map((i) => 60 + tonic + i)];

        for (let i = 0; i < chordLength; i++) {
            const time = i / KEY_DETECTION_SAMPLE_RATE;
            let sample = 0;
            for (const note of notes) {
                for (let harmonic = 1; harmonic <= 3; harmonic++) {
                    sample +=
                        Math.sin(2 * Math.PI * midiFrequency(note) * harmonic * time) / harmonic;
                }
            }
            samples[chord * chordLength + i] = sample * 0.05;
        }
    }

    return samples;
};

// Tones on and between the chroma bands, each with its own tremolo. Keep in sync with TONES in
// scripts/libkeyfinder-chroma.cpp, which prints LIBKEYFINDER_CHROMA from the same signal.
const REFERENCE_TONES = [
    [47.3, 0.5],
    [55.0, 1.0],
    [97.0, 0.6],
    [110.0, 0.8],
    [130.81, 0.6],
    [164.81, 0.7],
    [220.0, 1.0],
    [262.7, 0.5],
    [285.3, 0.4],
    [329.63, 0.7],
    [440.0, 0.9],
    [523.25, 0.5],
    [742.0, 0.4],
    [880.0, 0.6],
    [1234.5, 0.3],
    [1318.5, 0.4],
    [1600.0, 0.2],
    [1900.0, 0.2],
];

// libkeyfinder 2.2.8's chroma of the reference signal, scaled to a maximum of 1
const LIBKEYFINDER_CHROMA = [
    0.004001, 0.004498, 0.005143, 0.006039, 0.007443, 0.010349, 0.088456, 0.025499, 0.022045,
    0.756499, 0.017707, 0.006937, 0.003214, 0.001232, 0.001115, 0.002434, 0.004106, 0.006499,
    0.011825, 0.283519, 0.015352, 0.683575, 0.015574, 0.008958, 0.458687, 0.013501, 0.005315,
    0.002132, 0.509625, 0.012133, 0.006911, 0.004857, 0.006319, 0.775137, 0.010502, 0.006337,
    0.398317, 0.011533, 0.007901, 0.004209, 0.719225, 0.012224, 0.007548, 0.006352, 0.010078, 1,
    0.019089, 0.016281, 0.587158, 0.006235, 0.00423, 0.004131, 0.004776, 0.007914, 0.482768,
    0.00551, 0.00652, 0.774125, 0.015504, 0.008853, 0.005972, 0.003495, 0.004225, 0.304638,
    0.546191, 0.017788, 0.011171, 0.018743, 0.018268, 0.012377, 0.033031, 0.021765,
];

const renderReferenceSignal = () =>
    Float32Array.from({ length: KEY_DETECTION_SAMPLE_RATE * 6 }, (_, i) => {
        const time = i / KEY_DETECTION_SAMPLE_RATE;
        return REFERENCE_TONES.reduce(
            (sample, [frequency, amplitude], k) =>
                sample +
                amplitude *
                    (1 + 0.5 * Math.sin((2 * Math.PI * time) / (1.5 + k))) *
                    Math.sin(2 * Math.PI * frequency * time),
            0,
        );
    });

describe('chromagram', () => {
    it('matches libkeyfinder band by band', async () => {
        const chroma = await chromagram(renderReferenceSignal());
        const max = Math.max(...chroma);

        // libkeyfinder also low-pass filters the audio, which moves its top bands by up to 0.0007
        chroma.forEach((value, band) =>
            assert.ok(
                Math.abs(value / max - LIBKEYFINDER_CHROMA[band]) < 0.002,
                `band ${band}: ${value / max} vs ${LIBKEYFINDER_CHROMA[band]}`,
            ),
        );
    });
});

describe('detectKey', () => {
    it('finds the tonic and mode of a cadence in every key', async () => {
        for (let tonic = 0; tonic < 12; tonic++) {
            const name = PITCH_NAMES[tonic];
            assert.equal(await detectKey(renderCadence(tonic, MAJOR_CADENCE)), name);
            assert.equal(await detectKey(renderCadence(tonic, MINOR_CADENCE)), `${name}m`);
        }
    });

    it('finds the key at another sample rate', async () => {
        const sampleRate = KEY_DETECTION_SAMPLE_RATE * 2;
        const samples = new Float32Array(sampleRate * 8).map((_, i) => {
            const time = i / sampleRate;
            // A minor triad
            return [220, 261.63, 329.63].reduce(
                (sum, f) => sum + Math.sin(2 * Math.PI * f * time),
                0,
            );
        });

        assert.equal(await detectKey(samples, sampleRate), 'Am');
    });

    it('finds the same key in quiet and loud audio', async () => {
        const aMinor = renderCadence(9, MINOR_CADENCE);
        const cMajor = renderCadence(0, MAJOR_CADENCE);

        assert.equal(await detectKey(aMinor.map((sample) => sample * 1e-12)), 'Am');
        assert.equal(await detectKey(cMajor.map((sample) => sample * 1e-12)), 'C');
        assert.equal(await detectKey(aMinor.map((sample) => sample * 10)), 'Am');
    });

    it('returns null for silence and for no audio', async () => {
        assert.equal(await detectKey(new Float32Array(KEY_DETECTION_SAMPLE_RATE * 10)), null);
        assert.equal(await detectKey(new Float32Array(0)), null);
    });
});

describe('detectAudioCamelotKey', () => {
    const decoded = (...channels: Float32Array[]) => ({
        getChannelData: (channel: number) => channels[channel],
        length: channels[0].length,
        numberOfChannels: channels.length,
    });

    it('returns the Camelot key of every channel mixed together', async () => {
        const aMinor = renderCadence(9, MINOR_CADENCE);
        const silence = new Float32Array(aMinor.length);

        assert.equal(await detectAudioCamelotKey(decoded(aMinor)), '8A');
        assert.equal(await detectAudioCamelotKey(decoded(silence, aMinor)), '8A');
        assert.equal(await detectAudioCamelotKey(decoded(aMinor, silence)), '8A');
    });

    it('returns null for silent audio', async () => {
        const silence = new Float32Array(KEY_DETECTION_SAMPLE_RATE * 10);

        assert.equal(await detectAudioCamelotKey(decoded(silence, silence)), null);
    });
});
