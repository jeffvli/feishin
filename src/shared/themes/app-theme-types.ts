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
    GITHUB_DARK = 'githubDark',
    GITHUB_LIGHT = 'githubLight',
    GRUVBOX_DARK = 'gruvboxDark',
    GRUVBOX_LIGHT = 'gruvboxLight',
    HIGH_CONTRAST_DARK = 'highContrastDark',
    HIGH_CONTRAST_LIGHT = 'highContrastLight',
    MATERIAL_DARK = 'materialDark',
    MATERIAL_LIGHT = 'materialLight',
    MONOKAI = 'monokai',
    NIGHT_OWL = 'nightOwl',
    NORD = 'nord',
    ONE_DARK = 'oneDark',
    SHADES_OF_PURPLE = 'shadesOfPurple',
    SOLARIZED_DARK = 'solarizedDark',
    SOLARIZED_LIGHT = 'solarizedLight',
    TOKYO_NIGHT = 'tokyoNight',
    VSCODE_DARK_PLUS = 'vscodeDarkPlus',
    VSCODE_LIGHT_PLUS = 'vscodeLightPlus',
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
