import { z } from 'zod';

import {
    EQ_BAND_COUNT,
    EQ_GAIN_MAX,
    EQ_GAIN_MIN,
    EQ_PREAMP_MAX,
    EQ_PREAMP_MIN,
    EqualizerState,
} from './equalizer.types';
import { FLAT_PRESET_ID } from './presets';

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

const clampedBand = z.number().transform((v) => clamp(v, EQ_GAIN_MIN, EQ_GAIN_MAX));
const clampedPreamp = z.number().transform((v) => clamp(v, EQ_PREAMP_MIN, EQ_PREAMP_MAX));

const PresetSchema = z.object({
    bands: z.array(clampedBand).length(EQ_BAND_COUNT),
    builtin: z.boolean(),
    id: z.string(),
    name: z.string(),
    preamp: clampedPreamp,
});

export const DEFAULT_EQUALIZER_STATE: EqualizerState = {
    activePresetId: FLAT_PRESET_ID,
    bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    customPresets: [],
    enabled: false,
    preamp: 0,
};

const RawEqualizerSchema = z.object({
    activePresetId: z.string().nullable(),
    bands: z.array(clampedBand).length(EQ_BAND_COUNT),
    customPresets: z.array(PresetSchema),
    enabled: z.boolean(),
    preamp: clampedPreamp,
});

export const EqualizerSettingsSchema = z.unknown().transform((input): EqualizerState => {
    const parsed = RawEqualizerSchema.safeParse(input);
    return parsed.success ? (parsed.data as unknown as EqualizerState) : DEFAULT_EQUALIZER_STATE;
});
