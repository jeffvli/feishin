import assert from 'node:assert/strict';
import test from 'node:test';

import { analyzeRgbWaveform } from '../src/renderer/features/player/components/rgb-waveform.ts';

const SAMPLE_RATE = 12_000;

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const makeTone = (frequency) => {
    const samples = Float32Array.from({ length: SAMPLE_RATE }, (_, index) =>
        Math.sin((2 * Math.PI * frequency * index) / SAMPLE_RATE),
    );

    return {
        getChannelData: () => samples,
        length: samples.length,
        numberOfChannels: 1,
        sampleRate: SAMPLE_RATE,
    };
};

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const total = (values) => values.reduce((sum, value) => sum + value, 0);

for (const [frequency, expectedBand] of [
    [100, 'low'],
    [1000, 'mid'],
    [5000, 'high'],
]) {
    test(`${frequency} Hz is strongest in the ${expectedBand} band`, async () => {
        const analysis = await analyzeRgbWaveform(makeTone(frequency));
        const bands = {
            high: total(analysis.high),
            low: total(analysis.low),
            mid: total(analysis.mid),
        };
        const strongestBand = Object.entries(bands).sort((left, right) => right[1] - left[1])[0][0];
        assert.equal(strongestBand, expectedBand);
    });
}
