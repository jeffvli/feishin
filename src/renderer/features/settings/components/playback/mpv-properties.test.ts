import { describe, expect, it } from 'vitest';

import {
    getMpvProperties,
    getMpvSetting,
} from '/@/renderer/features/settings/components/playback/mpv-properties';

type MpvProperties = Parameters<typeof getMpvProperties>[0];

describe('getMpvProperties', () => {
    it('fills in mpv defaults for unset options', () => {
        expect(getMpvProperties({ audioSampleRateHz: 0 } as MpvProperties)).toEqual({
            'audio-exclusive': 'no',
            'gapless-audio': 'weak',
            replaygain: 'no',
            'replaygain-clip': 'no',
            'replaygain-preamp': 0,
        });
    });

    it('maps the configured options', () => {
        expect(
            getMpvProperties({
                audioExclusiveMode: 'yes',
                audioSampleRateHz: 48000,
                gaplessAudio: 'yes',
                replayGainClip: true,
                replayGainFallbackDB: -6,
                replayGainMode: 'album',
                replayGainPreampDB: 3,
            } as unknown as MpvProperties),
        ).toEqual({
            'audio-exclusive': 'yes',
            'audio-samplerate': 48000,
            'gapless-audio': 'yes',
            replaygain: 'album',
            'replaygain-clip': true,
            'replaygain-fallback': -6,
            'replaygain-preamp': 3,
        });
    });
});

describe('getMpvSetting', () => {
    it.each([
        ['audioExclusiveMode', undefined, { 'audio-exclusive': 'no' }],
        ['gaplessAudio', undefined, { 'gapless-audio': 'weak' }],
        ['replayGainMode', 'track', { replaygain: 'track' }],
        ['replayGainPreampDB', undefined, { 'replaygain-preamp': 0 }],
        ['audioSampleRateHz', 44100, { 'audio-samplerate': 44100 }],
        ['audioFormat', 's16', { 'audio-format': 's16' }],
    ] as const)('maps %s=%j', (key, value, expected) => {
        expect(getMpvSetting(key as Parameters<typeof getMpvSetting>[0], value)).toEqual(expected);
    });
});
