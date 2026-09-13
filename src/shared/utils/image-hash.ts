import { blurHashToRgba } from '/@/shared/utils/blurhash';
import { thumbHashToRgba } from '/@/shared/utils/thumbhash';

export const IMAGE_PLACEHOLDER_PRIORITIES = [
    'blurhash',
    'dominantColor',
    'off',
    'thumbhash',
] as const;

export type ImagePlaceholderPriority = (typeof IMAGE_PLACEHOLDER_PRIORITIES)[number];

const PRIORITY_FALLBACK_ORDER: Record<
    ImagePlaceholderPriority,
    readonly ImagePlaceholderPriority[]
> = {
    blurhash: ['blurhash', 'thumbhash', 'dominantColor'],
    dominantColor: ['dominantColor', 'thumbhash', 'blurhash'],
    off: [],
    thumbhash: ['thumbhash', 'blurhash', 'dominantColor'],
};

// Module-level cache of decoded PNG data URLs, capped FIFO (~1000 entries) so a
// long session over a large library does not accumulate unbounded data URLs.
const CACHE_CAP = 5000;
const urlCache = new Map<string, string>();

/**
 * Decodes a BlurHash string into a 32x32 PNG data URL. Each unique hash is
 * decoded once per session (module-level cache). Returns null only if the 2d
 * canvas context is unavailable.
 *
 * @param hash A valid BlurHash string.
 */
export function decodeBlurHashDataUrl(hash: string): null | string {
    const key = `blurhash:${hash}`;
    const cached = cacheGet(key);
    if (cached) return cached;

    const url = rgbaToCanvasDataUrl(32, 32, blurHashToRgba(hash));
    if (!url) return null;
    cacheSet(key, url);
    return url;
}

/**
 * Picks a placeholder to render by field, never by sniffing the string.
 * By default `thumbHash` wins, then `blurHash`, then a solid `dominantColor`
 * swatch; `priority` moves one source to the front of that order, or is
 * `'off'` to disable placeholders. This is the single decode entry point the
 * image-hash hook calls. Returns null when no field yields a placeholder.
 *
 * @param thumbHash A base64 ThumbHash, or null when the item has none.
 * @param blurHash A BlurHash string, or null when the item has none.
 * @param dominantColor A hex color, or null when the item has none.
 * @param priority Which source to try first when the item has several.
 */
export function decodeImageHashDataUrl(
    thumbHash: null | string,
    blurHash: null | string,
    dominantColor: null | string | undefined = null,
    priority: ImagePlaceholderPriority = 'thumbhash',
): null | string {
    const decoders: Record<ImagePlaceholderPriority, () => null | string> = {
        blurhash: () => (blurHash ? decodeBlurHashDataUrl(blurHash) : null),
        dominantColor: () => (dominantColor ? dominantColorToDataUrl(dominantColor) : null),
        off: () => null,
        thumbhash: () => (thumbHash ? decodeThumbHashDataUrl(thumbHash) : null),
    };

    for (const source of PRIORITY_FALLBACK_ORDER[priority]) {
        const url = decoders[source]();
        if (url) return url;
    }

    return null;
}

/**
 * Decodes a base64 ThumbHash string into a PNG data URL. Each unique hash is
 * decoded once per session (module-level cache). Returns null only if the 2d
 * canvas context is unavailable.
 *
 * @param hash A valid base64 ThumbHash string.
 */
export function decodeThumbHashDataUrl(hash: string): null | string {
    const key = `thumbhash:${hash}`;
    const cached = cacheGet(key);
    if (cached) return cached;

    const image = thumbHashToRgba(hash);
    const url = rgbaToCanvasDataUrl(image.width, image.height, image.rgba);
    if (!url) return null;
    cacheSet(key, url);
    return url;
}

/**
 * Builds a solid-color SVG data URL for use as an image placeholder. No cache
 * needed: the string is built inline and memoized by the calling hook. The
 * quotes must stay %-encoded: the URL is consumed unquoted inside a CSS
 * `url(...)` where a raw `'` makes the whole declaration drop out.
 *
 * @param color A hex color, e.g. `#1a2b3c` (3, 6, or 8 digits).
 */
export function dominantColorToDataUrl(color: string): string {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'><rect width='1' height='1' fill='${color}' /></svg>`;
    return `data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27')}`;
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
