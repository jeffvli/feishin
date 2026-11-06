export type AccentAlgorithm = 'dominant' | 'simple' | 'sqrt';

export type AccentCandidate = { algorithm: AccentAlgorithm; rgb: RgbColor };

export type RgbColor = [number, number, number];

export const ACCENT_ALGORITHMS: AccentAlgorithm[] = ['dominant', 'sqrt', 'simple'];

type Band = { maxLightness: number; minLightness: number; minSaturation: number };

const STAGE_BANDS: Record<'dark' | 'light', Band[]> = {
    dark: [
        { maxLightness: 80, minLightness: 30, minSaturation: 25 },
        { maxLightness: 85, minLightness: 28, minSaturation: 20 },
        { maxLightness: 88, minLightness: 25, minSaturation: 15 },
    ],
    light: [
        { maxLightness: 65, minLightness: 25, minSaturation: 25 },
        { maxLightness: 65, minLightness: 20, minSaturation: 20 },
        { maxLightness: 65, minLightness: 15, minSaturation: 15 },
    ],
};

const DOMINANT_BONUS = 8;
const MAX_CHANNEL = 255;
const MAX_HUE = 360;
const MAX_PERCENT = 100;
const MIN_BACKGROUND_DIFFERENCE = 15;
const MIN_SATURATION_FOR_HUE = 10;

interface HslColor {
    hue: number;
    lightness: number;
    saturation: number;
}

export function parseRgb(value: null | string | undefined): null | RgbColor {
    const text = value?.trim() ?? '';

    const hex = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(text);
    if (hex) {
        const digits = hex[1];
        const pairs =
            digits.length === 3
                ? [digits[0] + digits[0], digits[1] + digits[1], digits[2] + digits[2]]
                : [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 6)];
        return [parseInt(pairs[0], 16), parseInt(pairs[1], 16), parseInt(pairs[2], 16)];
    }

    const rgb =
        /^rgba?\(\s*(\d{1,3})[ ,]+(\d{1,3})[ ,]+(\d{1,3})\s*(?:[,/]\s*[\d.]+%?\s*)?\)$/.exec(text);
    if (rgb) {
        const channels = [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
        if (channels.every((channel) => channel <= MAX_CHANNEL)) {
            return [channels[0], channels[1], channels[2]];
        }
    }

    const hsl =
        /^hsla?\(\s*(\d{1,3})[ ,]+(\d{1,3})%[ ,]+(\d{1,3})%\s*(?:[,/]\s*[\d.]+\s*)?\)$/.exec(text);
    if (hsl) {
        const hue = Number(hsl[1]);
        const saturation = Number(hsl[2]);
        const lightness = Number(hsl[3]);
        if (hue <= MAX_HUE && saturation <= MAX_PERCENT && lightness <= MAX_PERCENT) {
            return hslToRgb(hue, saturation, lightness);
        }
    }

    return null;
}

export function rgbString(color: RgbColor): string {
    return `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
}

const hslToRgb = (hue: number, saturation: number, lightness: number): RgbColor => {
    const chroma = (1 - Math.abs((2 * lightness) / MAX_PERCENT - 1)) * (saturation / MAX_PERCENT);
    const hueSector = (hue % MAX_HUE) / 60;
    const intermediate = chroma * (1 - Math.abs((hueSector % 2) - 1));
    const match = lightness / MAX_PERCENT - chroma / 2;

    const [red, green, blue] =
        hueSector < 1
            ? [chroma, intermediate, 0]
            : hueSector < 2
              ? [intermediate, chroma, 0]
              : hueSector < 3
                ? [0, chroma, intermediate]
                : hueSector < 4
                  ? [0, intermediate, chroma]
                  : hueSector < 5
                    ? [intermediate, 0, chroma]
                    : [chroma, 0, intermediate];

    return [
        Math.round((red + match) * MAX_CHANNEL),
        Math.round((green + match) * MAX_CHANNEL),
        Math.round((blue + match) * MAX_CHANNEL),
    ];
};

const toHsl = (color: RgbColor): HslColor => {
    const red = color[0] / MAX_CHANNEL;
    const green = color[1] / MAX_CHANNEL;
    const blue = color[2] / MAX_CHANNEL;
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const lightness = (max + min) / 2;

    if (max === min) {
        return { hue: 0, lightness: lightness * 100, saturation: 0 };
    }

    const delta = max - min;
    const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

    let hue: number;
    if (max === red) {
        hue = (green - blue) / delta + (green < blue ? 6 : 0);
    } else if (max === green) {
        hue = (blue - red) / delta + 2;
    } else {
        hue = (red - green) / delta + 4;
    }

    return {
        hue: (hue * 60 + 360) % 360,
        lightness: lightness * 100,
        saturation: saturation * 100,
    };
};

const hueGap = (a: HslColor, b: HslColor): number => {
    if (a.saturation < MIN_SATURATION_FOR_HUE || b.saturation < MIN_SATURATION_FOR_HUE) {
        return 0;
    }

    const distance = Math.abs(a.hue - b.hue) % 360;
    return distance > 180 ? 360 - distance : distance;
};

const percentageDifferent = (a: RgbColor, b: RgbColor): number => {
    const red = Math.abs(a[0] - b[0]);
    const green = Math.abs(a[1] - b[1]);
    const blue = Math.abs(a[2] - b[2]);
    const largest = Math.max(red, green, blue);
    const average = (red + green + blue) / 3;

    return (largest + average) / 2;
};

// ponytail: three samples per cover and one fixed set of weights. The upgrade
// path is a tuned weight table or a richer palette, not more machinery here.
export function pickAccentColor(
    candidates: AccentCandidate[] | null,
    options: { background: null | RgbColor; mode: 'dark' | 'light' },
): null | RgbColor {
    if (!candidates || candidates.length === 0) {
        return null;
    }

    const bands = STAGE_BANDS[options.mode];
    let survivors: AccentCandidate[] = [];

    for (const band of bands) {
        survivors = candidates.filter((candidate) => {
            const hsl = toHsl(candidate.rgb);
            return (
                hsl.saturation >= band.minSaturation &&
                hsl.lightness >= band.minLightness &&
                hsl.lightness <= band.maxLightness
            );
        });

        if (survivors.length > 0) {
            break;
        }
    }

    const background = options.background ? toHsl(options.background) : null;

    if (options.background) {
        survivors = survivors.filter(
            (candidate) =>
                percentageDifferent(candidate.rgb, options.background!) >=
                MIN_BACKGROUND_DIFFERENCE,
        );
    }

    let best: null | RgbColor = null;
    let bestScore = -1;

    for (const candidate of survivors) {
        const hsl = toHsl(candidate.rgb);
        const lightnessGap = background ? Math.abs(hsl.lightness - background.lightness) : 0;
        const gap = background ? hueGap(hsl, background) : 0;
        const bonus = candidate.algorithm === 'dominant' ? DOMINANT_BONUS : 0;
        const score = 0.5 * hsl.saturation + 0.3 * lightnessGap + 0.2 * gap + bonus;

        if (score > bestScore) {
            bestScore = score;
            best = candidate.rgb;
        }
    }

    return best;
}
