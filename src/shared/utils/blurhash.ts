/**
 * BlurHash decoder (pure pixels; no canvas / DOM).
 *
 * Decodes a BlurHash string into RGBA pixels. Hand-rolled and adapted from the
 * published BlurHash TypeScript reference (woltapp/blurhash, used by
 * moldycrew's JS port). Only the decode path is included (this app never
 * encodes).
 *
 * Reference: https://github.com/woltapp/blurhash
 */

// Base-83 alphabet (order matters). See the BlurHash spec.
const BASE83_ALPHABET =
    '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~';

type Color = [number, number, number];

/**
 * Decodes a BlurHash string into RGBA pixels (opaque, alpha 255).
 *
 * @param blurhash The BlurHash string.
 * @param width Output width in pixels (default 32).
 * @param height Output height in pixels (default 32).
 * @returns The rendered pixels, or null if the string is not a valid BlurHash.
 * Never throws.
 */
export function blurHashToRgba(
    blurhash: string,
    width = 32,
    height = 32,
): null | Uint8ClampedArray {
    try {
        validateBlurHash(blurhash);
    } catch {
        return null;
    }

    const sizeFlag = decode83(blurhash[0]);
    const numY = Math.floor(sizeFlag / 9) + 1;
    const numX = (sizeFlag % 9) + 1;

    const quantisedMaximumValue = decode83(blurhash[1]);
    const maximumValue = (quantisedMaximumValue + 1) / 166;

    const colors: Color[] = new Array(numX * numY);
    for (let i = 0; i < colors.length; i++) {
        if (i === 0) {
            colors[i] = decodeDC(decode83(blurhash.substring(2, 6)));
        } else {
            colors[i] = decodeAC(decode83(blurhash.substring(4 + i * 2, 6 + i * 2)), maximumValue);
        }
    }

    const bytesPerRow = width * 4;
    const pixels = new Uint8ClampedArray(bytesPerRow * height);

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            let r = 0;
            let g = 0;
            let b = 0;
            for (let j = 0; j < numY; j++) {
                const basisY = Math.cos((Math.PI * y * j) / height);
                for (let i = 0; i < numX; i++) {
                    const basis = Math.cos((Math.PI * x * i) / width) * basisY;
                    const color = colors[i + j * numX];
                    r += color[0] * basis;
                    g += color[1] * basis;
                    b += color[2] * basis;
                }
            }

            const offset = 4 * x + y * bytesPerRow;
            pixels[offset] = linearTosRGB(r);
            pixels[offset + 1] = linearTosRGB(g);
            pixels[offset + 2] = linearTosRGB(b);
            pixels[offset + 3] = 255;
        }
    }

    return pixels;
}

function decode83(input: string): number {
    let value = 0;
    for (let i = 0; i < input.length; i++) {
        value = value * 83 + BASE83_ALPHABET.indexOf(input[i]);
    }
    return value;
}

function decodeAC(value: number, maximumValue: number): Color {
    const quantR = Math.floor(value / (19 * 19));
    const quantG = Math.floor(value / 19) % 19;
    const quantB = value % 19;
    return [
        signPow((quantR - 9) / 9, 2.0) * maximumValue,
        signPow((quantG - 9) / 9, 2.0) * maximumValue,
        signPow((quantB - 9) / 9, 2.0) * maximumValue,
    ];
}

function decodeDC(value: number): Color {
    const r = value >> 16;
    const g = (value >> 8) & 255;
    const b = value & 255;
    return [sRGBToLinear(r), sRGBToLinear(g), sRGBToLinear(b)];
}

function linearTosRGB(value: number): number {
    const v = Math.max(0, Math.min(1, value));
    return v <= 0.0031308
        ? Math.trunc(v * 12.92 * 255 + 0.5)
        : Math.trunc((1.055 * Math.pow(v, 1 / 2.4) - 0.055) * 255 + 0.5);
}

function sign(n: number): number {
    return n < 0 ? -1 : 1;
}

function signPow(value: number, exponent: number): number {
    return sign(value) * Math.pow(Math.abs(value), exponent);
}

function sRGBToLinear(value: number): number {
    const v = value / 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

/** Throws if the string is not structurally a valid BlurHash. */
function validateBlurHash(blurhash: string): void {
    if (!blurhash || blurhash.length < 6) {
        throw new Error('blurhash must be at least 6 characters');
    }
    const sizeFlag = decode83(blurhash[0]);
    const numY = Math.floor(sizeFlag / 9) + 1;
    const numX = (sizeFlag % 9) + 1;
    if (blurhash.length !== 4 + 2 * numX * numY) {
        throw new Error('blurhash length mismatch');
    }
}
