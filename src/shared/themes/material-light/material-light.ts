import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const materialLight: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(rgb(250 250 250 / 50%) 0%, rgb(250 250 250 / 80%)), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgba(250, 250, 250, 5%) 0%, var(--theme-colors-background)), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(140, 140, 140, 30%)',
        'scrollbar-handle-hover-background': 'rgba(140, 140, 140, 60%)',
    },
    colors: {
        background: 'rgb(250, 250, 250)',
        'background-alternate': 'rgb(255, 255, 255)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(33, 33, 33)',
        'foreground-muted': 'rgb(117, 117, 117)',
        primary: 'rgb(33, 150, 243)',
        'state-error': 'rgb(244, 67, 54)',
        'state-info': 'rgb(33, 150, 243)',
        'state-success': 'rgb(76, 175, 80)',
        'state-warning': 'rgb(255, 152, 0)',
        surface: 'rgb(245, 245, 245)',
        'surface-foreground': 'rgb(33, 33, 33)',
        white: 'rgb(255, 255, 255)',
    },
    mantineOverride: {
        primaryShade: {
            light: 4,
        },
    },
    mode: 'light',
};
