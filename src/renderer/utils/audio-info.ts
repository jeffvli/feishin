export type AudioBand = {
    frequency: number;
    gain: number;
};

// Bands from https://ia601608.us.archive.org/27/items/gov.law.ansi.s1.11.2004/ansi.s1.11.2004.pdf#page=23
export const AudioFrequencies = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 20000];

// equivalent to 1/3 octave band
export const AudioQuality = 4.318473;
