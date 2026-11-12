import type { Song } from '/@/shared/types/domain-types';

const PITCH_CLASS: Record<string, number> = { A: 9, B: 11, C: 0, D: 2, E: 4, F: 5, G: 7 };
const ACCIDENTAL: Record<string, number> = { '': 0, '#': 1, '♭': -1, '♯': 1, b: -1 };

// Groups: note, accidental, minor marker
const STANDARD_KEY = /^([A-G])([#♯b♭]?)\s*(?:(m|min|minor)|maj|major)?$/i;
const CAMELOT_KEY = /^0?(1[0-2]|[1-9])\s*([AB])$/i;
const OPEN_KEY = /^(1[0-2]|[1-9])\s*([dm])$/i;

// Camelot numbers walk the circle of fifths: C major is 8B and each fifth up adds 1.
// A minor key shares its number with its relative major (3 semitones up).
const toCamelotNumber = (pitchClass: number) => ((7 * pitchClass + 7) % 12) + 1;

const parseKey = (value: string): null | string => {
    const camelot = CAMELOT_KEY.exec(value);
    if (camelot) {
        return `${Number(camelot[1])}${camelot[2].toUpperCase()}`;
    }

    // Open Key (Traktor): 1d = C major = 8B, 1m = A minor = 8A
    const openKey = OPEN_KEY.exec(value);
    if (openKey) {
        const letter = openKey[2].toLowerCase() === 'd' ? 'B' : 'A';
        return `${((Number(openKey[1]) + 6) % 12) + 1}${letter}`;
    }

    const standard = STANDARD_KEY.exec(value);
    if (!standard) {
        return null;
    }

    const pitchClass =
        PITCH_CLASS[standard[1].toUpperCase()] + ACCIDENTAL[standard[2].toLowerCase()];

    return standard[3]
        ? `${toCamelotNumber(pitchClass + 3)}A`
        : `${toCamelotNumber(pitchClass + 12)}B`;
};

/** Converts a musical key tag ("Am", "C# minor", "8A", "1m", "8A - Am") to Camelot notation. */
export const toCamelotKey = (value: string): null | string => {
    for (const part of value.trim().split(/\s+-\s+|\//)) {
        const key = parseKey(part.trim());
        if (key) {
            return key;
        }
    }

    return null;
};

// Camelot wheel colors by number (1A/1B, 2A/2B, ...), from Mixxx's "Mixed In Key - Key Colors" palette.
const CAMELOT_COLORS = [
    '#00EECB',
    '#20EF7F',
    '#7FF448',
    '#E0CA6D',
    '#FDA078',
    '#FF8693',
    '#FD7EB3',
    '#F17EDB',
    '#D18BFD',
    '#9EB4FD',
    '#4DD3F8',
    '#01EAEC',
];

/** Wheel color of a Camelot key ("8A"), or null for anything else. */
export const getCamelotKeyColor = (key: string): null | string => {
    const match = /^(1[0-2]|[1-9])[AB]$/.exec(key);

    return match ? CAMELOT_COLORS[Number(match[1]) - 1] : null;
};

/** Camelot key of the song's key tag, or the raw tag when it can't be converted. */
export const getSongCamelotKey = (song: Pick<Song, 'tags'>): null | string => {
    const key = song.tags?.key?.[0]?.trim();
    if (!key) {
        return null;
    }

    return toCamelotKey(key) ?? key;
};
