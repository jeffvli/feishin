import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const gruvboxDark: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(transparent 0%, rgb(40 40 40 / 85%) 100%), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgb(40 40 40 / 5%) 0%, var(--theme-colors-background) 100%), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(184, 187, 38, 20%)',
        'scrollbar-handle-hover-background': 'rgba(184, 187, 38, 40%)',
    },
    colors: {
        background: 'rgb(40, 40, 40)',
        'background-alternate': 'rgb(29, 32, 33)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(235, 219, 178)',
        'foreground-muted': 'rgb(189, 174, 147)',
        primary: 'rgb(250, 189, 47)',
        'state-error': 'rgb(251, 73, 52)',
        'state-info': 'rgb(131, 165, 152)',
        'state-success': 'rgb(184, 187, 38)',
        'state-warning': 'rgb(250, 189, 47)',
        surface: 'rgb(50, 48, 47)',
        'surface-foreground': 'rgb(235, 219, 178)',
        white: 'rgb(255, 255, 255)',
    },
    mode: 'dark',
};
