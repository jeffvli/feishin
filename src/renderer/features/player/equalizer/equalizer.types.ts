export const EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] as const;
export const EQ_BAND_COUNT = EQ_FREQUENCIES.length;
export const EQ_GAIN_MIN = -12;
export const EQ_GAIN_MAX = 12;
export const EQ_PREAMP_MIN = -12;
export const EQ_PREAMP_MAX = 12;
export const EQ_BAND_Q = 1.0;

export type BandGains = readonly [
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
    number,
];

export interface EqualizerPreset {
    bands: BandGains;
    builtin: boolean;
    id: string;
    name: string;
    preamp: number;
}

export interface EqualizerState {
    activePresetId: null | string;
    bands: BandGains;
    customPresets: EqualizerPreset[];
    enabled: boolean;
    preamp: number;
}
