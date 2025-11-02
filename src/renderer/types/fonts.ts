import { z } from 'zod';

export type Font = {
    label: string;
    value: string;
};

export const FONT_OPTIONS: Font[] = [
    { label: 'Archivo', value: 'Archivo' },
    { label: 'Fredoka', value: 'Fredoka' },
    { label: 'Inter', value: 'Inter' },
    { label: 'League Spartan', value: 'League Spartan' },
    { label: 'Lexend', value: 'Lexend' },
    { label: 'Poppins', value: 'Poppins' },
    { label: 'Raleway', value: 'Raleway' },
    { label: 'Sora', value: 'Sora' },
    { label: 'Work Sans', value: 'Work Sans' },
];

export const FontValueSchema = z.enum(
    FONT_OPTIONS.map((option) => option.value) as [string, ...string[]],
);
