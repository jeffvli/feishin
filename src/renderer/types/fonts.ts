import { z } from 'zod';

import { SOUR_FONTS } from '/@/renderer/features/sour/fonts';

export type Font = {
    label: string;
    // only Sour Player profiles with this perk (from Hermes Music) can pick it
    perk?: string;
    value: string;
};

// every font bundled with Sour Player can be the app font (they're loaded as "Sour <name>")
const BUNDLED: Font[] = SOUR_FONTS.filter((f) => f.family.startsWith('"Sour ') && !f.perk).map((f) => ({
    label: f.label,
    value: f.family.split('"')[1],
}));

export const FONT_OPTIONS: Font[] = [
    { label: 'Inter', value: 'Inter' },
    { label: 'Poppins', value: 'Poppins' },
    ...BUNDLED,
    { label: 'Determination (admins)', perk: 'determination', value: 'Determination' },
    // Gavin's font, for the whole app too (not just his name)
    { label: 'Skyrim (Gavin)', perk: 'skyrim', value: 'Sour Skyrim' },
];

// the app fonts this profile may pick (perk fonts only for whoever has them, or already uses them)
export const fontOptions = (perks: string[] = [], current?: string): Font[] =>
    FONT_OPTIONS.filter((f) => !f.perk || perks.includes(f.perk) || f.value === current).map(
        ({ label, value }) => ({ label, value }),
    );

export const FontValueSchema = z.enum(
    FONT_OPTIONS.map((option) => option.value) as [string, ...string[]],
);
