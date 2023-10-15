import type { AudioBand } from '/@/renderer/store';

export const bandsToAudioFilter = (bands: AudioBand[]): string => {
    return bands
        .map(
            (info) =>
                `lavfi=[equalizer=f=${info.frequency}:width_type=o:w=${info.quality}:g=${info.gain}]`,
        )
        .join(',');
};
