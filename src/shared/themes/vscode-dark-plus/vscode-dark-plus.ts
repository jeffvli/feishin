import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const vscodeDarkPlus: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(transparent 0%, rgb(30 30 30 / 85%) 100%), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgb(30 30 30 / 5%) 0%, var(--theme-colors-background) 100%), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(160, 160, 160, 20%)',
        'scrollbar-handle-hover-background': 'rgba(160, 160, 160, 40%)',
    },
    colors: {
        background: 'rgb(30, 30, 30)',
        'background-alternate': 'rgb(24, 24, 24)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(212, 212, 212)',
        'foreground-muted': 'rgb(170, 170, 170)',
        primary: 'rgb(0, 122, 204)',
        'state-error': 'rgb(244, 63, 94)',
        'state-info': 'rgb(0, 122, 204)',
        'state-success': 'rgb(89, 185, 89)',
        'state-warning': 'rgb(255, 184, 108)',
        surface: 'rgb(37, 37, 38)',
        'surface-foreground': 'rgb(212, 212, 212)',
        white: 'rgb(255, 255, 255)',
    },
    mode: 'dark',
};
