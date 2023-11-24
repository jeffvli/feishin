import { AudioBand, Octave, octaveEnumToFloat } from '/@/renderer/utils/audio-info';

export const bandsToAudioFilter = (bands: AudioBand[], octave: Octave): string => {
    const width = octaveEnumToFloat(octave);
    return bands
        .map(
            (info) =>
                `lavfi=[equalizer=f=${info.frequency}:width_type=o:w=${width}:g=${info.gain}:precision=f64]`,
        )
        .join(',');
};
