import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const catppuccinLatte: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(rgb(239 241 245 / 50%) 0%, rgb(239 241 245 / 80%)), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgba(239, 241, 245, 5%) 0%, var(--theme-colors-background)), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(30, 102, 245, 30%)',
        'scrollbar-handle-hover-background': 'rgba(30, 102, 245, 60%)',
    },
    colors: {
        background: 'rgb(239, 241, 245)',
        'background-alternate': 'rgb(230, 233, 239)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(76, 79, 105)',
        'foreground-muted': 'rgb(108, 111, 133)',
        primary: 'rgb(30, 102, 245)',
        'state-error': 'rgb(210, 15, 57)',
        'state-info': 'rgb(30, 102, 245)',
        'state-success': 'rgb(64, 160, 43)',
        'state-warning': 'rgb(223, 142, 29)',
        surface: 'rgb(220, 224, 232)',
        'surface-foreground': 'rgb(76, 79, 105)',
        white: 'rgb(255, 255, 255)',
    },
    mantineOverride: {
        primaryShade: {
            light: 4,
        },
    },
    mode: 'light',
};
