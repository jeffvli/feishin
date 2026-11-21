const reverseBits = (value: number, bits: number) => {
    let reversed = 0;
    for (let bit = 0; bit < bits; bit++) {
        reversed |= ((value >> bit) & 1) << (bits - 1 - bit);
    }
    return reversed;
};

/** In-place radix-2 FFT for one power of two size, with its tables computed once. */
export class Fft {
    private readonly bitReversal: Uint32Array;
    private readonly cos: Float64Array;
    private readonly scratchIm: Float64Array;
    private readonly scratchRe: Float64Array;
    private readonly sin: Float64Array;
    private readonly size: number;

    constructor(size: number) {
        const bits = Math.log2(size);

        this.size = size;
        this.bitReversal = Uint32Array.from({ length: size }, (_, i) => reverseBits(i, bits));
        this.cos = Float64Array.from({ length: size / 2 }, (_, i) =>
            Math.cos((2 * Math.PI * i) / size),
        );
        this.sin = Float64Array.from({ length: size / 2 }, (_, i) =>
            Math.sin((2 * Math.PI * i) / size),
        );
        this.scratchRe = new Float64Array(size);
        this.scratchIm = new Float64Array(size);
    }

    /** Replaces re and im, both of the transform's size, with their forward transform. */
    transform(re: Float64Array, im: Float64Array) {
        this.reorder(re, im);

        for (let half = 1; half < this.size; half *= 2) {
            this.combine(re, im, half);
        }
    }

    // Merges each pair of neighbouring transforms of length `half` into one of twice the length
    private combine(re: Float64Array, im: Float64Array, half: number) {
        const step = this.size / (half * 2);

        for (let start = 0; start < this.size; start += half * 2) {
            for (let k = 0; k < half; k++) {
                const a = start + k;
                const b = a + half;
                const cos = this.cos[k * step];
                const sin = this.sin[k * step];
                const tRe = re[b] * cos + im[b] * sin;
                const tIm = im[b] * cos - re[b] * sin;
                re[b] = re[a] - tRe;
                im[b] = im[a] - tIm;
                re[a] += tRe;
                im[a] += tIm;
            }
        }
    }

    private reorder(re: Float64Array, im: Float64Array) {
        this.scratchRe.set(re);
        this.scratchIm.set(im);
        this.bitReversal.forEach((from, to) => {
            re[to] = this.scratchRe[from];
            im[to] = this.scratchIm[from];
        });
    }
}
