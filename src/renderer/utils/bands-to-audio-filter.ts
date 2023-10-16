import { AudioBand } from '/@/renderer/utils/audio-info';

export const bandsToAudioFilter = (bands: AudioBand[]): string => {
    return bands
        .map((info) => `lavfi=[equalizer=f=${info.frequency}:width_type=o:w=0.3333:g=${info.gain}]`)
        .join(',');
};
