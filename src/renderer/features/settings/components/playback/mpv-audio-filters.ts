// Builds the MPV `af` audio filter chain string for EQ and compressor.
// Uses FFmpeg lavfi filters, which MPV exposes natively.

export interface EqBand {
    freq: number;
    gain: number; // dB, clamped to [-12, 12]
}

export interface EqSettings {
    enabled: boolean;
    preamp: number; // dB pre-gain before bands, clamped to [-12, 12]
    bands: EqBand[];
}

export interface CompressorSettings {
    enabled: boolean;
    threshold: number; // dB, e.g. -24
    ratio: number;     // e.g. 4 (means 4:1)
    attack: number;    // ms
    release: number;   // ms
    makeup: number;    // dB post-compression gain
    knee: number;      // dB soft-knee width
}

// Octave widths for each band — tuned so 10 bands cover 20Hz–20kHz
// with no gaps and gentle overlap.
const BAND_WIDTHS: Record<number, number> = {
    31.5:  1.9,
    63:    1.3,
    125:   1.0,
    250:   1.0,
    500:   1.0,
    1000:  1.0,
    2000:  1.0,
    3000:  1.0,
    4000:  1.0,
    6300:  1.2,
    10000: 1.2,
    16000: 1.5,
};

/**
 * Returns the MPV `af` property value for the given EQ + compressor settings.
 * An empty string clears all filters (pass-through).
 */
export function buildMpvAudioFilters(
    eq: EqSettings,
    compressor: CompressorSettings,
): string {
    const parts: string[] = [];

    if (eq.enabled) {
        // Preamp: insert a volume filter first so EQ boosts don't clip
        if (eq.preamp !== 0) {
            parts.push(`volume=${eq.preamp}dB`);
        }

        // One parametric EQ filter per non-zero band
        for (const band of eq.bands) {
            if (band.gain === 0) continue;
            const w = BAND_WIDTHS[band.freq] ?? 1.0;
            // MPV lavfi equalizer: f=<Hz>:width_type=o:w=<octaves>:g=<dB>
            parts.push(
                `lavfi=[equalizer=f=${band.freq}:width_type=o:w=${w}:g=${band.gain}]`,
            );
        }
    }

    if (compressor.enabled) {
        // FFmpeg acompressor expects threshold and makeup in linear amplitude
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
