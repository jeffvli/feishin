import type { MantineThemeOverride } from '@mantine/core';

import { CSSProperties } from 'react';

export enum AppTheme {
    AYU_DARK = 'ayuDark',
    AYU_LIGHT = 'ayuLight',
    CATPPUCCIN_LATTE = 'catppuccinLatte',
    CATPPUCCIN_MOCHA = 'catppuccinMocha',
    DEFAULT_DARK = 'defaultDark',
    DEFAULT_LIGHT = 'defaultLight',
    DRACULA = 'dracula',
    EVERFOREST_DARK = 'everforestDark',
    EVERFOREST_LIGHT = 'everforestLight',
    GITHUB_DARK = 'githubDark',
    GITHUB_LIGHT = 'githubLight',
    GLASSY_DARK = 'glassyDark',
    GRUVBOX_DARK = 'gruvboxDark',
    GRUVBOX_LIGHT = 'gruvboxLight',
    HERMES_BLUE = 'hermesBlue',
    HERMES_CHERRY = 'hermesCherry',
    HERMES_FOREST = 'hermesForest',
    HERMES_MIDNIGHT = 'hermesMidnight',
    HERMES_OCEAN = 'hermesOcean',
    HERMES_SUNSET = 'hermesSunset',
    HIGH_CONTRAST_DARK = 'highContrastDark',
    HIGH_CONTRAST_LIGHT = 'highContrastLight',
    MATERIAL_DARK = 'materialDark',
    MATERIAL_LIGHT = 'materialLight',
    MONOKAI = 'monokai',
    NIGHT_OWL = 'nightOwl',
    NORD = 'nord',
    ONE_DARK = 'oneDark',
    ROSE_PINE = 'rosePine',
    ROSE_PINE_DAWN = 'rosePineDawn',
    ROSE_PINE_MOON = 'rosePineMoon',
    SHADES_OF_PURPLE = 'shadesOfPurple',
    SOLARIZED_DARK = 'solarizedDark',
    SOLARIZED_LIGHT = 'solarizedLight',
    SOUR_AUTUMN = 'sourAutumn',
    SOUR_BLUEBERRY = 'sourBlueberry',
    SOUR_CANDY = 'sourCandy',
    SOUR_CHERRY_SODA = 'sourCherrySoda',
    SOUR_EASTER = 'sourEaster',
    SOUR_GLASS = 'sourGlass',
    SOUR_GRAPEFRUIT = 'sourGrapefruit',
    SOUR_HALLOWEEN = 'sourHalloween',
    SOUR_LEMON = 'sourLemon',
    SOUR_LEMONADE = 'sourLemonade',
    SOUR_LIME = 'sourLime',
    SOUR_LUNAR = 'sourLunar',
    SOUR_MATCHA = 'sourMatcha',
    SOUR_MIDNIGHT = 'sourMidnight',
    SOUR_MONO = 'sourMono',
    SOUR_NEW_YEAR = 'sourNewYear',
    SOUR_OCEAN = 'sourOcean',
    SOUR_OLED = 'sourOled',
    SOUR_RETRO = 'sourRetro',
    SOUR_SHAMROCK = 'sourShamrock',
    SOUR_SUMMER = 'sourSummer',
    SOUR_SUNSET = 'sourSunset',
    SOUR_TERMINAL = 'sourTerminal',
    SOUR_VALENTINE = 'sourValentine',
    SOUR_VAPORWAVE = 'sourVaporwave',
    SOUR_VINYL = 'sourVinyl',
    SOUR_WINTER = 'sourWinter',
    TOKYO_NIGHT = 'tokyoNight',
    VSCODE_DARK_PLUS = 'vscodeDarkPlus',
    VSCODE_LIGHT_PLUS = 'vscodeLightPlus',
    ZENBURN = 'zenburn',
}

export type AppThemeConfiguration = Partial<BaseAppThemeConfiguration>;

export interface BaseAppThemeConfiguration {
    app: {
        'content-max-width'?: CSSProperties['maxWidth'];
        'overlay-header'?: CSSProperties['background'];
        'overlay-subheader'?: CSSProperties['background'];
        'root-font-size'?: CSSProperties['fontSize'];
        'scrollbar-handle-active-background'?: CSSProperties['background'];
        'scrollbar-handle-background'?: CSSProperties['background'];
        'scrollbar-handle-border-radius'?: CSSProperties['borderRadius'];
        'scrollbar-handle-hover-background'?: CSSProperties['background'];
        'scrollbar-size'?: CSSProperties['width'];
        'scrollbar-track-active-background'?: CSSProperties['background'];
        'scrollbar-track-background'?: CSSProperties['background'];
        'scrollbar-track-border-radius'?: CSSProperties['borderRadius'];
        'scrollbar-track-hover-background'?: CSSProperties['background'];
    };
    colors: {
        background?: CSSProperties['background'];
        'background-alternate'?: CSSProperties['background'];
        black?: CSSProperties['color'];
        foreground?: CSSProperties['color'];
        'foreground-muted'?: CSSProperties['color'];
        primary?: CSSProperties['color'];
        'state-error'?: CSSProperties['color'];
        'state-info'?: CSSProperties['color'];
        'state-success'?: CSSProperties['color'];
        'state-warning'?: CSSProperties['color'];
        surface?: CSSProperties['background'];
        'surface-foreground'?: CSSProperties['color'];
        white?: CSSProperties['color'];
    };
    mantineOverride?: MantineThemeOverride;
    mode: 'dark' | 'light';
    stylesheets?: string[];
}
