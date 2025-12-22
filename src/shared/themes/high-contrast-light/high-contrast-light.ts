import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const highContrastLight: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(rgb(255 255 255 / 95%) 0%, rgb(255 255 255 / 100%)), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgba(255, 255, 255, 5%) 0%, var(--theme-colors-background)), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(0, 0, 0, 40%)',
        'scrollbar-handle-hover-background': 'rgba(0, 0, 0, 60%)',
    },
    colors: {
        background: 'rgb(255, 255, 255)',
        'background-alternate': 'rgb(255, 255, 255)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(0, 0, 0)',
        'foreground-muted': 'rgb(50, 50, 50)',
        primary: 'rgb(0, 0, 255)',
        'state-error': 'rgb(255, 0, 0)',
        'state-info': 'rgb(0, 0, 255)',
        'state-success': 'rgb(0, 128, 0)',
        'state-warning': 'rgb(255, 140, 0)',
        surface: 'rgb(240, 240, 240)',
        'surface-foreground': 'rgb(0, 0, 0)',
        white: 'rgb(255, 255, 255)',
    },
    mantineOverride: {
        primaryShade: {
            light: 4,
        },
    },
    mode: 'light',
};
