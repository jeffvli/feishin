import { useMemo } from 'react';

import { hashName } from '/@/renderer/features/discover/utils/hash-name';

/**
 * A ListenBrainz listener, drawn from their username alone.
 *
 * ListenBrainz has no avatars: there is no profile endpoint carrying one and the site itself
 * references neither Gravatar nor any image, so a picture has to be derived rather than fetched.
 * The initial over a colour hashed from the whole name is the densest identity a 20px circle can
 * carry, because a reader recognises a letter without decoding it. A pixel identicon is the
 * better answer when the entities are hashes with no human-readable name; these have names, and
 * throwing the name away spends the only asset on offer.
 *
 * Nothing here depends on who else is on screen, so a listener looks the same in every row,
 * every session and every library.
 */

interface ListenerChipProps {
    /** Rendered size in pixels. The design is tuned for 20, and holds down to about 16. */
    size?: number;
    username: string;
}

export function ListenerChip({ size = 20, username }: ListenerChipProps) {
    const { background, initial, letter } = useMemo(() => paletteFor(username), [username]);

    return (
        <svg aria-label={username} height={size} role="img" viewBox="0 0 100 100" width={size}>
            <circle cx="50" cy="50" fill={background} r="50" />
            <text
                fill={letter}
                fontFamily="var(--theme-content-font-family)"
                fontSize={FONT_SIZE}
                fontWeight={650}
                textAnchor="middle"
                x="50"
                y={BASELINE}
            >
                {initial}
            </text>
        </svg>
    );
}

function paletteFor(username: string) {
    const hash = hashName(username);
    const hue = (hash % HUE_COUNT) * (360 / HUE_COUNT);

    // A different slice of the hash, so tone and hue are independent rather than correlated.
    const tone = TONES[(hash >>> 8) % TONES.length];

    return {
        background: `oklch(${tone.background} ${hue})`,
        initial: (username.trim()[0] ?? '?').toUpperCase(),
        letter: `oklch(${tone.letter} ${hue})`,
    };
}

const FONT_SIZE = 58;

/**
 * Where the baseline sits, rather than where the centre does.
 *
 * `dominantBaseline="central"` centres the em box, and the em box reserves descender space that a
 * capital never occupies, so the glyph renders visibly low. Centring on cap height instead puts
 * the letter where the eye expects it.
 *
 * The ratio is measured rather than looked up, against the faces this app actually ships: through
 * canvas `actualBoundingBoxAscent`, Inter reports 0.741 and Poppins 0.721 averaged over A-Z and
 * 0-9, digits being the taller of the two in Poppins and usernames being free to start with one.
 * 0.72 splits them and leaves an eighth of a pixel of error at 20px.
 */
const CAP_HEIGHT_RATIO = 0.72;

const BASELINE = 50 + (FONT_SIZE * CAP_HEIGHT_RATIO) / 2;

/**
 * Hues are quantised rather than free-running because near-misses are what make two chips
 * confusable: eight degrees apart reads as the same colour, where two chips from a fixed palette
 * are either identical or obviously different, and identical is survivable because the letter is
 * still there.
 */
const HUE_COUNT = 16;

/**
 * Three tones per hue, because hue alone is not enough. Over 39 real ListenBrainz usernames,
 * sixteen hues still put `alastairp` and `arthur.lutz` on the same colour. Simulated across
 * 20,000 random follow lists, adding the tone axis takes a 25 person list from a 52% chance of
 * some collision to 21%.
 *
 * Collisions never reach zero, and that is the ceiling rather than a shortcoming: roughly fifty
 * appearances is all anyone can tell apart in a 20px circle. The letter is what multiplies that
 * by 26, and a tooltip resolves the remainder.
 *
 * Expressed in OKLCH because its lightness is perceptual: one letter lightness holds across the
 * whole wheel, where HSL would blow out the yellows and muddy the blues at identical settings.
 * The deepest tone flips to a light letter, since at that lightness a dark one has nowhere to go.
 */
const TONES = [
    { background: '0.79 0.115', letter: '0.3 0.095' },
    { background: '0.66 0.15', letter: '0.22 0.08' },
    { background: '0.44 0.135', letter: '0.93 0.04' },
];
