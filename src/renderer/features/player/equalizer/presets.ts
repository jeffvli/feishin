import { BandGains, EqualizerPreset } from './equalizer.types';

export const FLAT_PRESET_ID = 'builtin:flat';

const z = (): BandGains => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

export const BUILTIN_PRESETS: EqualizerPreset[] = [
    {
        bands: z(),
        builtin: true,
        id: FLAT_PRESET_ID,
        name: 'equalizer.preset.flat',
        preamp: 0,
    },
    {
        bands: [5, 4, 3, 1, -1, -1, 0, 2, 3, 3],
        builtin: true,
        id: 'builtin:rock',
        name: 'equalizer.preset.rock',
        preamp: -3,
    },
    {
        bands: [-1, 0, 2, 4, 4, 3, 1, 0, -1, -1],
        builtin: true,
        id: 'builtin:pop',
        name: 'equalizer.preset.pop',
        preamp: -2,
    },
    {
        bands: [3, 2, 1, 2, -1, -1, 0, 1, 2, 3],
        builtin: true,
        id: 'builtin:jazz',
        name: 'equalizer.preset.jazz',
        preamp: -2,
    },
    {
        bands: [4, 3, 2, 0, 0, 0, -1, -2, -2, -3],
        builtin: true,
        id: 'builtin:classical',
        name: 'equalizer.preset.classical',
        preamp: -2,
    },
    {
        bands: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0],
        builtin: true,
        id: 'builtin:bassBoost',
        name: 'equalizer.preset.bassBoost',
        preamp: -4,
    },
    {
        bands: [-2, -2, -1, 1, 3, 3, 2, 1, 0, -1],
        builtin: true,
        id: 'builtin:vocal',
        name: 'equalizer.preset.vocal',
        preamp: -2,
    },
];
