import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const ayuLight: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(rgb(253 253 253 / 50%) 0%, rgb(253 253 253 / 80%)), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgba(253, 253, 253, 5%) 0%, var(--theme-colors-background)), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(140, 140, 140, 30%)',
        'scrollbar-handle-hover-background': 'rgba(140, 140, 140, 60%)',
    },
    colors: {
        background: 'rgb(253, 253, 253)',
        'background-alternate': 'rgb(250, 250, 250)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(57, 58, 52)',
        'foreground-muted': 'rgb(128, 128, 128)',
        primary: 'rgb(86, 156, 214)',
        'state-error': 'rgb(255, 51, 51)',
        'state-info': 'rgb(55, 118, 171)',
        'state-success': 'rgb(86, 171, 47)',
        'state-warning': 'rgb(255, 153, 0)',
        surface: 'rgb(255, 255, 255)',
        'surface-foreground': 'rgb(57, 58, 52)',
        white: 'rgb(255, 255, 255)',
    },
    mantineOverride: {
        primaryShade: {
            light: 4,
        },
    },
    mode: 'light',
};
