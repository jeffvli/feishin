import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

// Hermes Music edition presets: one palette per mood, all dark, with matching menu (surface)
// and background colours.
const palette = (colors: {
    background: [number, number, number];
    foreground: string;
    muted: string;
    primary: string;
    sidebar: [number, number, number];
    surface: string;
}): AppThemeConfiguration => {
    const [r, g, b] = colors.background;
    const [sr, sg, sb] = colors.sidebar;
    return {
        app: {
            'overlay-header': `linear-gradient(transparent 0%, rgb(${r} ${g} ${b} / 85%) 100%), var(--theme-background-noise)`,
            'overlay-subheader': `linear-gradient(180deg, rgb(${r} ${g} ${b} / 5%) 0%, var(--theme-colors-background) 100%), var(--theme-background-noise)`,
            'scrollbar-handle-background': 'rgba(160, 160, 160, 20%)',
            'scrollbar-handle-hover-background': 'rgba(160, 160, 160, 40%)',
        },
        colors: {
            background: `rgb(${r}, ${g}, ${b})`,
            'background-alternate': `rgb(${sr}, ${sg}, ${sb})`,
            black: 'rgb(0, 0, 0)',
            foreground: colors.foreground,
            'foreground-muted': colors.muted,
            primary: colors.primary,
            'state-error': 'rgb(248, 113, 113)',
            'state-info': colors.primary,
            'state-success': 'rgb(74, 222, 128)',
            'state-warning': 'rgb(251, 191, 36)',
            surface: colors.surface,
            'surface-foreground': colors.foreground,
            white: 'rgb(255, 255, 255)',
        },
        mode: 'dark',
    };
};

// the blue of the Hermes Music request page
export const hermesBlue = palette({
    background: [11, 22, 48],
    foreground: 'rgb(226, 234, 255)',
    muted: 'rgb(148, 168, 210)',
    primary: 'rgb(96, 165, 250)',
    sidebar: [7, 15, 34],
    surface: 'rgb(20, 36, 72)',
});

export const hermesCherry = palette({
    background: [30, 10, 16],
    foreground: 'rgb(255, 228, 233)',
    muted: 'rgb(214, 160, 172)',
    primary: 'rgb(251, 113, 133)',
    sidebar: [22, 6, 11],
    surface: 'rgb(50, 18, 28)',
});

export const hermesForest = palette({
    background: [12, 26, 18],
    foreground: 'rgb(222, 247, 230)',
    muted: 'rgb(150, 190, 165)',
    primary: 'rgb(74, 222, 128)',
    sidebar: [7, 18, 12],
    surface: 'rgb(22, 44, 31)',
});

export const hermesMidnight = palette({
    background: [18, 12, 36],
    foreground: 'rgb(237, 228, 255)',
    muted: 'rgb(176, 160, 214)',
    primary: 'rgb(167, 139, 250)',
    sidebar: [12, 7, 26],
    surface: 'rgb(33, 23, 62)',
});

export const hermesOcean = palette({
    background: [6, 26, 32],
    foreground: 'rgb(220, 248, 252)',
    muted: 'rgb(140, 192, 202)',
    primary: 'rgb(34, 211, 238)',
    sidebar: [3, 18, 23],
    surface: 'rgb(13, 44, 54)',
});

export const hermesSunset = palette({
    background: [32, 16, 12],
    foreground: 'rgb(255, 237, 225)',
    muted: 'rgb(218, 172, 150)',
    primary: 'rgb(251, 146, 60)',
    sidebar: [23, 10, 7],
    surface: 'rgb(54, 27, 20)',
});
