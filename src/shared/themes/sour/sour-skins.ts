import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

// Sour Player skins: colour palettes (and for a few, a little extra CSS) that plug into the normal
// theme picker. The holiday ones switch on by themselves around each holiday (Sour Studio > Holidays).
type Rgb = [number, number, number];

const skin = (colors: {
    background: Rgb;
    css?: string;
    foreground: string;
    light?: boolean;
    muted: string;
    primary: string;
    sidebar: Rgb;
    surface: string;
}): AppThemeConfiguration => {
    const [r, g, b] = colors.background;
    const [sr, sg, sb] = colors.sidebar;
    return {
        app: {
            'overlay-header': `linear-gradient(transparent 0%, rgb(${r} ${g} ${b} / 85%) 100%), var(--theme-background-noise)`,
            'overlay-subheader': `linear-gradient(180deg, rgb(${r} ${g} ${b} / 5%) 0%, var(--theme-colors-background) 100%), var(--theme-background-noise)`,
            'scrollbar-handle-background': colors.light
                ? 'rgba(0, 0, 0, 18%)'
                : 'rgba(160, 160, 160, 20%)',
            'scrollbar-handle-hover-background': colors.light
                ? 'rgba(0, 0, 0, 30%)'
                : 'rgba(160, 160, 160, 40%)',
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
        mode: colors.light ? 'light' : 'dark',
        stylesheets: colors.css ? [colors.css] : undefined,
    };
};

export const sourLemon = skin({
    background: [24, 22, 10],
    foreground: 'rgb(255, 250, 225)',
    muted: 'rgb(214, 203, 150)',
    primary: 'rgb(242, 193, 78)',
    sidebar: [17, 15, 6],
    surface: 'rgb(44, 40, 18)',
});

export const sourLime = skin({
    background: [12, 24, 12],
    foreground: 'rgb(232, 252, 222)',
    muted: 'rgb(166, 204, 150)',
    primary: 'rgb(155, 208, 107)',
    sidebar: [7, 17, 7],
    surface: 'rgb(24, 44, 22)',
});

export const sourGrapefruit = skin({
    background: [34, 14, 16],
    foreground: 'rgb(255, 232, 228)',
    muted: 'rgb(222, 166, 160)',
    primary: 'rgb(255, 122, 107)',
    sidebar: [25, 9, 11],
    surface: 'rgb(56, 24, 27)',
});

export const sourBlueberry = skin({
    background: [14, 16, 36],
    foreground: 'rgb(230, 232, 255)',
    muted: 'rgb(160, 166, 218)',
    primary: 'rgb(124, 140, 255)',
    sidebar: [9, 10, 26],
    surface: 'rgb(26, 30, 62)',
});

export const sourMidnight = skin({
    background: [9, 11, 22],
    foreground: 'rgb(236, 238, 250)',
    muted: 'rgb(150, 156, 190)',
    primary: 'rgb(242, 193, 78)',
    sidebar: [5, 6, 14],
    surface: 'rgb(20, 24, 44)',
});

export const sourOled = skin({
    background: [0, 0, 0],
    foreground: 'rgb(240, 240, 240)',
    muted: 'rgb(150, 150, 150)',
    primary: 'rgb(242, 193, 78)',
    sidebar: [0, 0, 0],
    surface: 'rgb(16, 16, 16)',
});

export const sourVinyl = skin({
    background: [22, 17, 14],
    css: `#main-content { background-image: repeating-radial-gradient(circle at 120% 50%, rgb(255 255 255 / 1.5%) 0 2px, transparent 2px 5px); }`,
    foreground: 'rgb(250, 236, 220)',
    muted: 'rgb(200, 172, 145)',
    primary: 'rgb(232, 163, 61)',
    sidebar: [15, 11, 9],
    surface: 'rgb(40, 31, 25)',
});

export const sourRetro = skin({
    background: [36, 38, 48],
    css: `
#player-bar { background: linear-gradient(180deg, #4a4f5e 0%, #2b2e38 100%) !important; border-top: 2px solid #6b7183; }
#player-bar button { border-radius: 2px !important; }
#player-bar a, #player-bar p, #player-bar span { font-family: "Sour VT323", monospace; letter-spacing: 0.04em; }
#player-bar [class*='left-grid-item'] { background: #050805; border: 2px inset #6b7183; margin: 8px; color: #7cff6b; }
#player-bar [class*='left-grid-item'] a, #player-bar [class*='left-grid-item'] p { color: #7cff6b !important; font-size: 1.1rem; }`,
    foreground: 'rgb(214, 220, 232)',
    muted: 'rgb(150, 158, 176)',
    primary: 'rgb(124, 255, 107)',
    sidebar: [28, 30, 38],
    surface: 'rgb(58, 62, 74)',
});

export const sourGlass = skin({
    background: [16, 18, 28],
    css: `
#main-content { background: radial-gradient(circle at 15% 10%, rgb(120 90 255 / 22%), transparent 45%), radial-gradient(circle at 85% 90%, rgb(242 193 78 / 16%), transparent 45%), var(--theme-colors-background); }
[class*='mantine-Popover-dropdown'], [class*='mantine-Menu-dropdown'], [class*='mantine-Modal-content'], [class*='mantine-Drawer-content'] { background: rgb(28 30 44 / 70%) !important; backdrop-filter: blur(18px) saturate(1.4); }
#player-bar { background: rgb(20 22 34 / 75%) !important; backdrop-filter: blur(20px); }`,
    foreground: 'rgb(236, 238, 255)',
    muted: 'rgb(164, 168, 200)',
    primary: 'rgb(160, 140, 255)',
    sidebar: [12, 13, 22],
    surface: 'rgb(30, 33, 50)',
});

export const sourVaporwave = skin({
    background: [26, 12, 40],
    css: `#main-content { background: linear-gradient(180deg, var(--theme-colors-background) 60%, rgb(255 113 206 / 12%) 100%); }`,
    foreground: 'rgb(255, 230, 250)',
    muted: 'rgb(210, 160, 220)',
    primary: 'rgb(255, 113, 206)',
    sidebar: [18, 7, 30],
    surface: 'rgb(46, 22, 68)',
});

export const sourCherrySoda = skin({
    background: [30, 8, 14],
    foreground: 'rgb(255, 228, 234)',
    muted: 'rgb(220, 150, 166)',
    primary: 'rgb(255, 61, 110)',
    sidebar: [22, 5, 9],
    surface: 'rgb(52, 16, 26)',
});

export const sourMono = skin({
    background: [16, 16, 16],
    foreground: 'rgb(236, 236, 236)',
    muted: 'rgb(160, 160, 160)',
    primary: 'rgb(230, 230, 230)',
    sidebar: [10, 10, 10],
    surface: 'rgb(32, 32, 32)',
});

export const sourSunset = skin({
    background: [34, 16, 24],
    foreground: 'rgb(255, 236, 228)',
    muted: 'rgb(222, 170, 160)',
    primary: 'rgb(255, 159, 67)',
    sidebar: [25, 10, 17],
    surface: 'rgb(58, 28, 38)',
});

export const sourOcean = skin({
    background: [6, 22, 30],
    foreground: 'rgb(220, 248, 250)',
    muted: 'rgb(140, 190, 200)',
    primary: 'rgb(46, 211, 198)',
    sidebar: [3, 15, 21],
    surface: 'rgb(14, 40, 52)',
});

export const sourTerminal = skin({
    background: [4, 8, 4],
    css: `:root { --theme-content-font-family: "Sour VT323", "Sour Emoji", monospace !important; font-size: 1.08em; }`,
    foreground: 'rgb(156, 255, 156)',
    muted: 'rgb(90, 180, 90)',
    primary: 'rgb(57, 255, 20)',
    sidebar: [2, 5, 2],
    surface: 'rgb(10, 22, 10)',
});

export const sourCandy = skin({
    background: [255, 240, 246],
    foreground: 'rgb(60, 20, 40)',
    light: true,
    muted: 'rgb(140, 90, 115)',
    primary: 'rgb(232, 67, 147)',
    sidebar: [252, 228, 238],
    surface: 'rgb(255, 250, 252)',
});

export const sourLemonade = skin({
    background: [255, 250, 230],
    foreground: 'rgb(48, 42, 18)',
    light: true,
    muted: 'rgb(128, 116, 70)',
    primary: 'rgb(186, 145, 0)',
    sidebar: [250, 242, 210],
    surface: 'rgb(255, 253, 244)',
});

export const sourMatcha = skin({
    background: [240, 246, 232],
    foreground: 'rgb(30, 44, 22)',
    light: true,
    muted: 'rgb(100, 120, 88)',
    primary: 'rgb(90, 143, 41)',
    sidebar: [228, 238, 218],
    surface: 'rgb(250, 253, 246)',
});

// ---------- holidays ----------
export const sourHalloween = skin({
    background: [20, 10, 24],
    css: `h1 { font-family: "Sour Creepster", var(--theme-content-font-family) !important; letter-spacing: 0.03em; }`,
    foreground: 'rgb(255, 236, 220)',
    muted: 'rgb(200, 160, 190)',
    primary: 'rgb(255, 117, 24)',
    sidebar: [13, 6, 16],
    surface: 'rgb(40, 20, 46)',
});

export const sourWinter = skin({
    background: [10, 26, 20],
    css: `h1 { font-family: "Sour Mountains of Christmas", var(--theme-content-font-family) !important; }`,
    foreground: 'rgb(236, 250, 242)',
    muted: 'rgb(160, 200, 180)',
    primary: 'rgb(229, 56, 59)',
    sidebar: [6, 18, 13],
    surface: 'rgb(22, 48, 36)',
});

export const sourNewYear = skin({
    background: [10, 10, 18],
    foreground: 'rgb(255, 248, 228)',
    muted: 'rgb(200, 190, 160)',
    primary: 'rgb(255, 209, 102)',
    sidebar: [6, 6, 12],
    surface: 'rgb(26, 24, 40)',
});

export const sourValentine = skin({
    background: [36, 10, 22],
    css: `h1 { font-family: "Sour Pacifico", var(--theme-content-font-family) !important; font-weight: 400 !important; }`,
    foreground: 'rgb(255, 230, 240)',
    muted: 'rgb(226, 160, 190)',
    primary: 'rgb(255, 77, 141)',
    sidebar: [27, 6, 16],
    surface: 'rgb(60, 18, 38)',
});

export const sourShamrock = skin({
    background: [8, 26, 14],
    foreground: 'rgb(228, 252, 232)',
    muted: 'rgb(150, 200, 160)',
    primary: 'rgb(46, 204, 113)',
    sidebar: [4, 18, 9],
    surface: 'rgb(18, 46, 28)',
});

export const sourEaster = skin({
    background: [250, 246, 255],
    foreground: 'rgb(48, 36, 70)',
    light: true,
    muted: 'rgb(120, 104, 150)',
    primary: 'rgb(155, 123, 234)',
    sidebar: [242, 236, 252],
    surface: 'rgb(255, 253, 248)',
});

export const sourSummer = skin({
    background: [8, 30, 40],
    foreground: 'rgb(230, 250, 255)',
    muted: 'rgb(150, 196, 210)',
    primary: 'rgb(255, 201, 60)',
    sidebar: [4, 21, 29],
    surface: 'rgb(16, 52, 66)',
});

export const sourAutumn = skin({
    background: [30, 18, 10],
    foreground: 'rgb(255, 238, 220)',
    muted: 'rgb(214, 176, 140)',
    primary: 'rgb(217, 130, 43)',
    sidebar: [21, 12, 6],
    surface: 'rgb(52, 32, 18)',
});

export const sourLunar = skin({
    background: [36, 8, 8],
    foreground: 'rgb(255, 238, 214)',
    muted: 'rgb(224, 170, 140)',
    primary: 'rgb(255, 195, 0)',
    sidebar: [26, 5, 5],
    surface: 'rgb(60, 16, 14)',
});
