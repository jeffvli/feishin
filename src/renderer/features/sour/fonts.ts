// Fonts for names, playlist titles and the app itself. The bundled ones live in assets/fonts/sour
// (SIL Open Font License or Apache 2.0, see the readme there) and are loaded in src/shared/styles/sour-fonts.css as
// "Sour <name>". Determination is a perk: only profiles Hermes Music allows can pick it.
export interface SourFont {
    family: string;
    id: string;
    label: string;
    perk?: boolean;
}

const bundled = (id: string, label: string, fallback: string): SourFont => ({
    family: `"Sour ${label}", ${fallback}`,
    id,
    label,
});

export const SOUR_FONTS: SourFont[] = [
    { family: 'inherit', id: 'default', label: 'Default' },
    { family: 'Georgia, "Times New Roman", serif', id: 'serif', label: 'Serif' },
    { family: 'ui-monospace, Consolas, monospace', id: 'mono', label: 'Mono' },
    { family: '"Trebuchet MS", "Comic Sans MS", sans-serif', id: 'rounded', label: 'Rounded' },
    { family: '"Brush Script MT", "Segoe Script", cursive', id: 'script', label: 'Script' },
    bundled('pacifico', 'Pacifico', 'cursive'),
    bundled('lobster', 'Lobster', 'cursive'),
    bundled('satisfy', 'Satisfy', 'cursive'),
    bundled('caveat', 'Caveat', 'cursive'),
    bundled('permanent-marker', 'Permanent Marker', 'cursive'),
    bundled('bangers', 'Bangers', 'sans-serif'),
    bundled('bebas-neue', 'Bebas Neue', 'sans-serif'),
    bundled('righteous', 'Righteous', 'sans-serif'),
    bundled('fredoka', 'Fredoka', 'sans-serif'),
    bundled('comfortaa', 'Comfortaa', 'sans-serif'),
    bundled('bungee', 'Bungee', 'sans-serif'),
    bundled('shrikhand', 'Shrikhand', 'serif'),
    bundled('abril-fatface', 'Abril Fatface', 'serif'),
    bundled('playfair-display', 'Playfair Display', 'serif'),
    bundled('cinzel', 'Cinzel', 'serif'),
    bundled('rye', 'Rye', 'serif'),
    bundled('special-elite', 'Special Elite', 'monospace'),
    bundled('space-mono', 'Space Mono', 'monospace'),
    bundled('major-mono-display', 'Major Mono Display', 'monospace'),
    bundled('vt323', 'VT323', 'monospace'),
    bundled('press-start-2p', 'Press Start 2P', 'monospace'),
    bundled('silkscreen', 'Silkscreen', 'monospace'),
    bundled('orbitron', 'Orbitron', 'sans-serif'),
    bundled('audiowide', 'Audiowide', 'sans-serif'),
    bundled('zen-dots', 'Zen Dots', 'sans-serif'),
    bundled('monoton', 'Monoton', 'sans-serif'),
    bundled('black-ops-one', 'Black Ops One', 'sans-serif'),
    bundled('creepster', 'Creepster', 'cursive'),
    bundled('nosifer', 'Nosifer', 'cursive'),
    bundled('mountains-of-christmas', 'Mountains of Christmas', 'cursive'),
    { family: 'Determination, monospace', id: 'determination', label: 'Determination', perk: true },
];

export const fontFamily = (id?: null | string) =>
    SOUR_FONTS.find((f) => f.id === id)?.family ?? 'inherit';

// choices for a font picker; perk fonts only for the profiles that have them
export const fontChoices = (perks: string[] = []) =>
    SOUR_FONTS.filter((f) => !f.perk || perks.includes(f.id)).map((f) => ({
        label: f.perk ? `${f.label} (only yours)` : f.label,
        value: f.id,
    }));
