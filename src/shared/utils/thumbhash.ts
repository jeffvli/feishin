/**
 * ThumbHash decoder (pure pixels; no canvas / DOM).
 *
 * Decodes a base64 ThumbHash string into RGBA pixels. Hand-rolled and adapted
 * from the published ThumbHash reference implementation (mariozan/thumbhash.js;
 * the algorithm is identical to evanw/thumbhash by Evan Wallace). Only the
 * decode path is included (this app never encodes).
 *
 * Reference: https://github.com/evanw/thumbhash
 */

export type ThumbHashImage = {
    height: number;
    rgba: Uint8Array;
    width: number;
};

// A valid ThumbHash decodes to 4..32 bytes.
const MIN_BYTES = 4;
const MAX_BYTES = 32;

/**
 * Decodes a base64 ThumbHash string into RGBA pixels.
 *
 * @param hash The base64 ThumbHash string.
 * @returns The rendered placeholder pixels (RGBA, not premultiplied), or null
 * if the string is not a valid base64 ThumbHash. Never throws.
 */
export function thumbHashToRgba(hash: string): null | ThumbHashImage {
    let bytes: Uint8Array;
    try {
        bytes = base64ToBytes(hash);
    } catch {
        return null;
    }

    if (bytes.length < MIN_BYTES || bytes.length > MAX_BYTES) return null;

    const { cos, max, min, PI, round } = Math;

    // Read the constants.
    const header24 = bytes[0] | (bytes[1] << 8) | (bytes[2] << 16);
    const header16 = bytes[3] | (bytes[4] << 8);
    const l_dc = (header24 & 63) / 63;
    const p_dc = ((header24 >> 6) & 63) / 31.5 - 1;
    const q_dc = ((header24 >> 12) & 63) / 31.5 - 1;
    const l_scale = ((header24 >> 18) & 31) / 31;
    const hasAlpha = header24 >> 23 !== 0;
    const p_scale = ((header16 >> 3) & 63) / 63;
    const q_scale = ((header16 >> 9) & 63) / 63;
    const isLandscape = header16 >> 15 !== 0;
    const lx = max(3, isLandscape ? (hasAlpha ? 5 : 7) : header16 & 7);
    const ly = max(3, isLandscape ? header16 & 7 : hasAlpha ? 5 : 7);
    const a_dc = hasAlpha ? (bytes[5] & 15) / 15 : 1;
    const a_scale = (bytes[5] >> 4) / 15;

    // Read the varying factors (boost saturation 1.25x to offset quantization).
    const ac_start = hasAlpha ? 6 : 5;
    let ac_index = 0;
    const decodeChannel = (nx: number, ny: number, scale: number): number[] => {
        const ac: number[] = [];
        for (let cy = 0; cy < ny; cy++) {
            for (let cx = cy ? 0 : 1; cx * ny < nx * (ny - cy); cx++) {
                const byte = bytes[ac_start + (ac_index >> 1)];
                const value = (byte >> ((ac_index++ & 1) << 2)) & 15;
                ac.push((value / 7.5 - 1) * scale);
            }
        }
        return ac;
    };
    const l_ac = decodeChannel(lx, ly, l_scale);
    const p_ac = decodeChannel(3, 3, p_scale * 1.25);
    const q_ac = decodeChannel(3, 3, q_scale * 1.25);
    const a_ac = hasAlpha ? decodeChannel(5, 5, a_scale) : [];

    // Decode the DCT terms into RGBA.
    const ratio = approximateAspectRatio(bytes);
    const width = round(ratio > 1 ? 32 : 32 * ratio);
    const height = round(ratio > 1 ? 32 / ratio : 32);
    const rgba = new Uint8Array(width * height * 4);
    const fx: number[] = [];
    const fy: number[] = [];

    for (let i = 0, y = 0; y < height; y++) {
        for (let x = 0; x < width; x++, i += 4) {
            let l = l_dc;
            let p = p_dc;
            let q = q_dc;
            let a = a_dc;

            // Precompute the cosine coefficients for this row / column.
            const fxCount = max(lx, hasAlpha ? 5 : 3);
            for (let cx = 0; cx < fxCount; cx++) {
                fx[cx] = cos((PI / width) * (x + 0.5) * cx);
            }
            const fyCount = max(ly, hasAlpha ? 5 : 3);
            for (let cy = 0; cy < fyCount; cy++) {
                fy[cy] = cos((PI / height) * (y + 0.5) * cy);
            }

            // Decode L.
            for (let cy = 0, j = 0; cy < ly; cy++) {
                const fy2 = fy[cy] * 2;
                for (let cx = cy ? 0 : 1; cx * ly < lx * (ly - cy); cx++, j++) {
                    l += l_ac[j] * fx[cx] * fy2;
                }
            }

            // Decode P and Q.
            for (let cy = 0, j = 0; cy < 3; cy++) {
                const fy2 = fy[cy] * 2;
                for (let cx = cy ? 0 : 1; cx < 3 - cy; cx++, j++) {
                    const f = fx[cx] * fy2;
                    p += p_ac[j] * f;
                    q += q_ac[j] * f;
                }
            }

            // Decode A.
            if (hasAlpha) {
                for (let cy = 0, j = 0; cy < 5; cy++) {
                    const fy2 = fy[cy] * 2;
                    for (let cx = cy ? 0 : 1; cx < 5 - cy; cx++, j++) {
                        a += a_ac[j] * fx[cx] * fy2;
                    }
                }
            }

            // Convert LPQA to RGB.
            const b = l - (2 / 3) * p;
            const r = (3 * l - b + q) / 2;
            const g = r - q;
            rgba[i] = max(0, 255 * min(1, r));
            rgba[i + 1] = max(0, 255 * min(1, g));
            rgba[i + 2] = max(0, 255 * min(1, b));
            rgba[i + 3] = max(0, 255 * min(1, a));
        }
    }

    return { height, rgba, width };
}

/**
 * Approximate aspect ratio (width / height) of the original image.
 * @param hash Raw decoded ThumbHash bytes.
 */
function approximateAspectRatio(hash: Uint8Array): number {
    const header = hash[3];
    const hasAlpha = (hash[2] & 0x80) !== 0;
    const isLandscape = (hash[4] & 0x80) !== 0;
    const lx = isLandscape ? (hasAlpha ? 5 : 7) : header & 7;
    const ly = isLandscape ? header & 7 : hasAlpha ? 5 : 7;
    return lx / ly;
}

function base64ToBytes(input: string): Uint8Array {
    const binary = atob(input);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}
