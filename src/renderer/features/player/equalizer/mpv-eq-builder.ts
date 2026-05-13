import { EQ_BAND_Q, EQ_FREQUENCIES, EqualizerState } from './equalizer.types';

export const buildMpvAfString = (state: EqualizerState): string => {
    if (!state.enabled) return '';
    const isFlat = state.preamp === 0 && state.bands.every((g) => g === 0);
    if (isFlat) return '';

    const parts: string[] = [`volume=${state.preamp}dB`];
    EQ_FREQUENCIES.forEach((freq, i) => {
        parts.push(`equalizer=f=${freq}:width_type=o:width=${EQ_BAND_Q * 2}:g=${state.bands[i]}`);
    });
    return parts.join(',');
};
