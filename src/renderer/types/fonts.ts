import { z } from 'zod';

export type Font = {
    label: string;
    value: string;
};

export const FONT_OPTIONS: Font[] = [
    { label: 'Inter', value: 'Inter' },
    { label: 'Poppins', value: 'Poppins' },
    { label: 'Fredoka (Sour)', value: 'Sour Fredoka' },
    { label: 'Comfortaa (Sour)', value: 'Sour Comfortaa' },
    { label: 'Righteous (Sour)', value: 'Sour Righteous' },
    { label: 'Space Mono (Sour)', value: 'Sour Space Mono' },
    { label: 'Playfair Display (Sour)', value: 'Sour Playfair Display' },
    { label: 'Caveat (Sour)', value: 'Sour Caveat' },
    { label: 'VT323 (Sour)', value: 'Sour VT323' },
];

export const FontValueSchema = z.enum(
    FONT_OPTIONS.map((option) => option.value) as [string, ...string[]],
);
