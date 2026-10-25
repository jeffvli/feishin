import { describe, expect, it } from 'vitest';

import {
    buildMpvAudioFilters,
    CompressorSettings,
    EqSettings,
} from '/@/renderer/features/settings/components/playback/mpv-audio-filters';

const eq = (fields: Partial<EqSettings> = {}): EqSettings => ({
    bands: [],
    enabled: true,
    preamp: 0,
    ...fields,
});

const compressor = (fields: Partial<CompressorSettings> = {}): CompressorSettings => ({
    attack: 20,
    enabled: false,
    knee: 2.5,
    makeup: 0,
    ratio: 4,
    release: 250,
    threshold: -20,
    ...fields,
});

describe('buildMpvAudioFilters', () => {
    it('returns an empty chain when everything is off', () => {
        expect(
            buildMpvAudioFilters(
                eq({ bands: [{ freq: 1000, gain: 6 }], enabled: false, preamp: -3 }),
                compressor(),
            ),
        ).toBe('');
    });

    it('skips a zero preamp and flat bands', () => {
        expect(
            buildMpvAudioFilters(
                eq({
                    bands: [
                        { freq: 63, gain: 0 },
                        { freq: 1000, gain: -4 },
                    ],
                }),
                compressor(),
            ),
        ).toBe('lavfi=[equalizer=f=1000:width_type=o:w=1:g=-4]');
    });

    it('applies the preamp before the bands, using per-band octave widths', () => {
        expect(
            buildMpvAudioFilters(
                eq({
                    bands: [
                        { freq: 31.5, gain: 3 },
                        { freq: 16000, gain: 2 },
                        { freq: 777, gain: 1 },
                    ],
                    preamp: -6,
                }),
                compressor(),
            ),
        ).toBe(
            [
                'volume=-6dB',
                'lavfi=[equalizer=f=31.5:width_type=o:w=1.9:g=3]',
                'lavfi=[equalizer=f=16000:width_type=o:w=1.5:g=2]',
                // Unknown frequency falls back to a one-octave width
                'lavfi=[equalizer=f=777:width_type=o:w=1:g=1]',
            ].join(','),
        );
    });

    it('adds the compressor last, converting dB to linear gain', () => {
        expect(
            buildMpvAudioFilters(
                eq({ preamp: 2 }),
                compressor({ enabled: true, makeup: 6, threshold: -20 }),
            ),
        ).toBe(
            'volume=2dB,lavfi=[acompressor=threshold=0.100000:ratio=4:attack=20:release=250:makeup=1.995262:knee=2.5]',
        );
    });

    it('runs the compressor alone when the EQ is off', () => {
        expect(buildMpvAudioFilters(eq({ enabled: false }), compressor({ enabled: true }))).toMatch(
            /^lavfi=\[acompressor=/,
        );
    });
});
