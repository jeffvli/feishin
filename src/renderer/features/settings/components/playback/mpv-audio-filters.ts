// Builds the MPV `af` audio filter chain string for EQ and compressor.
// Uses FFmpeg lavfi filters, which MPV exposes natively.

export interface CompressorSettings {
    attack: number; // ms
    enabled: boolean;
    knee: number; // dB soft-knee width
    makeup: number; // dB post-compression gain
    ratio: number; // e.g. 4 (means 4:1)
    release: number; // ms
    threshold: number; // dB, e.g. -24
}

export interface EqBand {
    freq: number;
    gain: number; // dB, clamped to [-12, 12]
}

export interface EqSettings {
    bands: EqBand[];
    enabled: boolean;
    preamp: number; // dB pre-gain before bands, clamped to [-12, 12]
}

// Octave widths for each band — tuned so 10 bands cover 20Hz–20kHz
// with no gaps and gentle overlap.
const BAND_WIDTHS: Record<number, number> = {
    31.5: 1.9,
    63: 1.3,
    125: 1.0,
    250: 1.0,
    500: 1.0,
    1000: 1.0,
    2000: 1.0,
    3000: 1.0,
    4000: 1.0,
    6300: 1.2,
    10000: 1.2,
    16000: 1.5,
};

/**
 * Returns the MPV `af` property value for the given EQ + compressor settings.
 * An empty string clears all filters (pass-through).
 */
export function buildMpvAudioFilters(eq: EqSettings, compressor: CompressorSettings): string {
    const parts: string[] = [];

    if (eq.enabled) {
        // Apply preamp as a straight input gain before the band filters.
        // The user is responsible for setting a negative preamp value when
        // boosting bands to avoid clipping — matching the behaviour of VLC,
        // foobar2000, and hardware EQs. The UI preamp slider exists for this purpose.
        if (eq.preamp !== 0) {
            parts.push(`volume=${eq.preamp}dB`);
        }

        // One parametric EQ filter per non-zero band
        for (const band of eq.bands) {
            if (band.gain === 0) continue;
            const w = BAND_WIDTHS[band.freq] ?? 1.0;
            parts.push(`lavfi=[equalizer=f=${band.freq}:width_type=o:w=${w}:g=${band.gain}]`);
        }
    }

    if (compressor.enabled) {
        const threshLinear = Math.pow(10, compressor.threshold / 20);
        const makeupLinear = Math.pow(10, compressor.makeup / 20);
        parts.push(
            `lavfi=[acompressor=` +
                `threshold=${threshLinear.toFixed(6)}:` +
                `ratio=${compressor.ratio}:` +
                `attack=${compressor.attack}:` +
                `release=${compressor.release}:` +
                `makeup=${makeupLinear.toFixed(6)}:` +
                `knee=${compressor.knee}` +
                `]`,
        );
    }

    return parts.join(',');
}
