import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const vscodeLightPlus: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(rgb(255 255 255 / 50%) 0%, rgb(255 255 255 / 80%)), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgba(255, 255, 255, 5%) 0%, var(--theme-colors-background)), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(140, 140, 140, 30%)',
        'scrollbar-handle-hover-background': 'rgba(140, 140, 140, 60%)',
    },
    colors: {
        background: 'rgb(255, 255, 255)',
        'background-alternate': 'rgb(250, 250, 250)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(0, 0, 0)',
        'foreground-muted': 'rgb(113, 113, 113)',
        primary: 'rgb(0, 122, 204)',
        'state-error': 'rgb(229, 20, 0)',
        'state-info': 'rgb(0, 122, 204)',
        'state-success': 'rgb(16, 124, 16)',
        'state-warning': 'rgb(191, 136, 0)',
        surface: 'rgb(243, 243, 243)',
        'surface-foreground': 'rgb(0, 0, 0)',
        white: 'rgb(255, 255, 255)',
    },
    mantineOverride: {
        primaryShade: {
            light: 9,
        },
    },
    mode: 'light',
};
