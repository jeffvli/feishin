import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const githubLight: AppThemeConfiguration = {
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
        'background-alternate': 'rgb(246, 248, 250)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(31, 35, 40)',
        'foreground-muted': 'rgb(101, 109, 118)',
        primary: 'rgb(9, 105, 218)',
        'state-error': 'rgb(212, 5, 17)',
        'state-info': 'rgb(9, 105, 218)',
        'state-success': 'rgb(26, 127, 100)',
        'state-warning': 'rgb(191, 136, 0)',
        surface: 'rgb(250, 252, 254)',
        'surface-foreground': 'rgb(31, 35, 40)',
        white: 'rgb(255, 255, 255)',
    },
    mantineOverride: {
        primaryShade: {
            light: 4,
        },
    },
    mode: 'light',
};
