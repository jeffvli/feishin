import { blurHashToRgba } from '/@/shared/utils/blurhash';
import { thumbHashToRgba } from '/@/shared/utils/thumbhash';

// Module-level cache of decoded PNG data URLs, capped FIFO (~1000 entries) so a
// long session over a large library does not accumulate unbounded data URLs.
const CACHE_CAP = 1000;
const urlCache = new Map<string, string>();

/**
 * Decodes a BlurHash string into a 32x32 PNG data URL. Each unique hash is
 * decoded once per session (module-level cache). Returns null for invalid or
 * empty input. Never throws.
 *
 * @param hash The BlurHash string.
 */
export function decodeBlurHashDataUrl(hash: string): null | string {
    const key = `blurhash:${hash}`;
    const cached = cacheGet(key);
    if (cached) return cached;

    const rgba = blurHashToRgba(hash);
    if (!rgba) return null;

    const url = rgbaToCanvasDataUrl(32, 32, rgba);
    if (!url) return null;
    cacheSet(key, url);
    return url;
}

/**
 * Picks a hash to render by field, never by sniffing the string: `thumbHash`
 * wins, then `blurHash`. This is the single decode entry point the image-hash
 * hook calls. Returns null when neither field yields a decodable hash. Never
 * throws.
 *
 * @param thumbHash A base64 ThumbHash, or null when the item has none.
 * @param blurHash A BlurHash string, or null when the item has none.
 */
export function decodeImageHashDataUrl(
    thumbHash: null | string,
    blurHash: null | string,
): null | string {
    if (thumbHash) {
        const url = decodeThumbHashDataUrl(thumbHash);
        if (url) return url;
    }
    if (blurHash) {
        const url = decodeBlurHashDataUrl(blurHash);
        if (url) return url;
    }
    return null;
}

/**
 * Decodes a base64 ThumbHash string into a PNG data URL. Each unique hash is
 * decoded once per session (module-level cache). Returns null for invalid or
 * empty input. Never throws.
 *
 * @param hash The base64 ThumbHash string.
 */
export function decodeThumbHashDataUrl(hash: string): null | string {
    const key = `thumbhash:${hash}`;
    const cached = cacheGet(key);
    if (cached) return cached;

    const image = thumbHashToRgba(hash);
    if (!image) return null;

    const url = rgbaToCanvasDataUrl(image.width, image.height, image.rgba);
    if (!url) return null;
    cacheSet(key, url);
    return url;
}

function cacheGet(key: string): null | string {
    return urlCache.get(key) ?? null;
}

function cacheSet(key: string, url: string): void {
    // FIFO: existing keys are not re-ordered on a hit; the oldest is evicted on
    // overflow before a new entry is added.
    if (urlCache.has(key)) return;
    if (urlCache.size >= CACHE_CAP) {
        const oldest = urlCache.keys().next().value;
        if (oldest !== undefined) urlCache.delete(oldest);
    }
    urlCache.set(key, url);
}

// Blits RGBA pixels into a throwaway (off-DOM) canvas and returns a PNG data URL.
// Returns null if a 2d context is unavailable (should not happen in a browser).
function rgbaToCanvasDataUrl(
    width: number,
    height: number,
    rgba: ArrayLike<number>,
): null | string {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    const imageData = ctx.createImageData(width, height);
    imageData.data.set(rgba);
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL('image/png');
}
