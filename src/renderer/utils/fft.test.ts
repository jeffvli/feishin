import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Fft } from '/@/renderer/utils/fft';

// Deterministic noise, so a failure can be reproduced
const noise = (length: number, seed: number) => {
    let state = seed;
    return Float64Array.from({ length }, () => {
        state = (state * 1103515245 + 12345) % 2 ** 31;
        return state / 2 ** 30 - 1;
    });
};

// The definition: X[k] = sum of x[n] * e^(-2 pi i k n / N)
const naiveDft = (re: Float64Array, im: Float64Array) => {
    const size = re.length;
    const outRe = new Float64Array(size);
    const outIm = new Float64Array(size);

    for (let k = 0; k < size; k++) {
        for (let n = 0; n < size; n++) {
            const angle = (2 * Math.PI * k * n) / size;
            outRe[k] += re[n] * Math.cos(angle) + im[n] * Math.sin(angle);
            outIm[k] += im[n] * Math.cos(angle) - re[n] * Math.sin(angle);
        }
    }

    return { im: outIm, re: outRe };
};

describe('Fft', () => {
    for (const size of [2, 8, 64, 1024]) {
        it(`matches the discrete Fourier transform for ${size} complex samples`, () => {
            const re = noise(size, size);
            const im = noise(size, size + 1);
            const expected = naiveDft(re, im);

            new Fft(size).transform(re, im);

            for (let k = 0; k < size; k++) {
                assert.ok(Math.abs(re[k] - expected.re[k]) < 1e-9, `re[${k}] of ${size}`);
                assert.ok(Math.abs(im[k] - expected.im[k]) < 1e-9, `im[${k}] of ${size}`);
            }
        });
    }
});
