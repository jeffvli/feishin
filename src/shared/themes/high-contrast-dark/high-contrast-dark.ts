import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const highContrastDark: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(transparent 0%, rgb(0 0 0 / 95%) 100%), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgb(0 0 0 / 5%) 0%, var(--theme-colors-background) 100%), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(255, 255, 255, 40%)',
        'scrollbar-handle-hover-background': 'rgba(255, 255, 255, 60%)',
    },
    colors: {
        background: 'rgb(0, 0, 0)',
        'background-alternate': 'rgb(0, 0, 0)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(255, 255, 255)',
        'foreground-muted': 'rgb(200, 200, 200)',
        primary: 'rgb(0, 191, 255)',
        'state-error': 'rgb(255, 0, 0)',
        'state-info': 'rgb(0, 191, 255)',
        'state-success': 'rgb(0, 255, 0)',
        'state-warning': 'rgb(255, 255, 0)',
        surface: 'rgb(20, 20, 20)',
        'surface-foreground': 'rgb(255, 255, 255)',
        white: 'rgb(255, 255, 255)',
    },
    mode: 'dark',
};
