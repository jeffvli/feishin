import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const nord: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(transparent 0%, rgb(46 52 64 / 85%) 100%), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgb(46 52 64 / 5%) 0%, var(--theme-colors-background) 100%), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(160, 160, 160, 20%)',
        'scrollbar-handle-hover-background': 'rgba(160, 160, 160, 40%)',
    },
    colors: {
        background: 'rgb(46, 52, 64)',
        'background-alternate': 'rgb(37, 41, 54)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(236, 239, 244)',
        'foreground-muted': 'rgb(216, 222, 233)',
        primary: 'rgb(136, 192, 208)',
        'state-error': 'rgb(191, 97, 106)',
        'state-info': 'rgb(136, 192, 208)',
        'state-success': 'rgb(163, 190, 140)',
        'state-warning': 'rgb(235, 203, 139)',
        surface: 'rgb(59, 66, 82)',
        'surface-foreground': 'rgb(236, 239, 244)',
        white: 'rgb(255, 255, 255)',
    },
    mode: 'dark',
};
