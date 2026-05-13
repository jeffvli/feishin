import { nanoid } from 'nanoid';

import {
    BandGains,
    EQ_BAND_COUNT,
    EQ_GAIN_MAX,
    EQ_GAIN_MIN,
    EQ_PREAMP_MAX,
    EQ_PREAMP_MIN,
    EqualizerState,
} from './equalizer.types';
import { BUILTIN_PRESETS, FLAT_PRESET_ID } from './presets';

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const flatBands = (): BandGains => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

const findPreset = (id: string, custom: EqualizerState['customPresets']) =>
    BUILTIN_PRESETS.find((p) => p.id === id) ?? custom.find((p) => p.id === id);

const uniqueName = (base: string, taken: string[]): string => {
    if (!taken.includes(base)) return base;
    let i = 2;
    while (taken.includes(`${base} (${i})`)) i += 1;
    return `${base} (${i})`;
};

export const setBand = (state: EqualizerState, index: number, db: number): EqualizerState => {
    if (index < 0 || index >= EQ_BAND_COUNT) return state;
    const next = [...state.bands] as unknown as number[];
    next[index] = clamp(db, EQ_GAIN_MIN, EQ_GAIN_MAX);
    return { ...state, activePresetId: null, bands: next as unknown as BandGains };
};

export const setPreamp = (state: EqualizerState, db: number): EqualizerState => ({
    ...state,
    activePresetId: null,
    preamp: clamp(db, EQ_PREAMP_MIN, EQ_PREAMP_MAX),
});

export const setEnabled = (state: EqualizerState, enabled: boolean): EqualizerState => ({
    ...state,
    enabled,
});

export const applyPreset = (state: EqualizerState, id: string): EqualizerState => {
    const preset = findPreset(id, state.customPresets);
    if (!preset) return state;
    return {
        ...state,
        activePresetId: preset.id,
        bands: [...preset.bands] as unknown as BandGains,
        preamp: preset.preamp,
    };
};

export const reset = (state: EqualizerState): EqualizerState => ({
    ...state,
    activePresetId: FLAT_PRESET_ID,
    bands: flatBands(),
    preamp: 0,
});

export const saveCustomPreset = (state: EqualizerState, name: string): EqualizerState => {
    const taken = state.customPresets.map((p) => p.name);
    return {
        ...state,
        customPresets: [
            ...state.customPresets,
            {
                bands: [...state.bands] as unknown as BandGains,
                builtin: false,
                id: `user:${nanoid(8)}`,
                name: uniqueName(name, taken),
                preamp: state.preamp,
            },
        ],
    };
};

export const deleteCustomPreset = (state: EqualizerState, id: string): EqualizerState => ({
    ...state,
    activePresetId: state.activePresetId === id ? null : state.activePresetId,
    customPresets: state.customPresets.filter((p) => p.id !== id),
});
