import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const gruvboxLight: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(rgb(251 241 199 / 50%) 0%, rgb(251 241 199 / 80%)), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgba(251, 241, 199, 5%) 0%, var(--theme-colors-background)), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(140, 140, 140, 30%)',
        'scrollbar-handle-hover-background': 'rgba(140, 140, 140, 60%)',
    },
    colors: {
        background: 'rgb(251, 241, 199)',
        'background-alternate': 'rgb(242, 229, 188)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(60, 56, 54)',
        'foreground-muted': 'rgb(124, 111, 100)',
        primary: 'rgb(214, 93, 14)',
        'state-error': 'rgb(204, 36, 29)',
        'state-info': 'rgb(7, 102, 120)',
        'state-success': 'rgb(121, 116, 14)',
        'state-warning': 'rgb(214, 93, 14)',
        surface: 'rgb(235, 219, 178)',
        'surface-foreground': 'rgb(60, 56, 54)',
        white: 'rgb(255, 255, 255)',
    },
    mantineOverride: {
        primaryShade: {
            light: 4,
        },
    },
    mode: 'light',
};
