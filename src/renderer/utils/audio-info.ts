export type AudioBand = {
    frequency: number;
    gain: number;
};

export enum Octave {
    Full = 'full',
    Third = 'third',
}

// Bands from https://ia601608.us.archive.org/27/items/gov.law.ansi.s1.11.2004/ansi.s1.11.2004.pdf#page=23
export const AudioFrequencies = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 20000];

const OctaveToQ = {
    [Octave.Full]: 1.414214,
    [Octave.Third]: 4.318473,
};

export const octaveToQFactor = (octave: Octave): number => {
    return OctaveToQ[octave];
};

const OctaveEnumToOctave = {
    [Octave.Full]: 1,
    [Octave.Third]: 0.333333,
};

export const octaveEnumToFloat = (octave: Octave): number => {
    return OctaveEnumToOctave[octave];
};
