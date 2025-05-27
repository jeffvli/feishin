import { AppThemeConfiguration } from './app-theme-types';

export const defaultTheme: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(transparent 0%, rgb(0 0 0 / 75%) 100%), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgb(0 0 0 / 5%) 0%, var(--theme-colors-background) 100%), var(--theme-background-noise)',
        'root-font-size': '16px',
        'scrollbar-handle-active-background': 'rgba(160, 160, 160, 60%)',
        'scrollbar-handle-background': 'rgba(160, 160, 160, 30%)',
        'scrollbar-handle-border-radius': '0px',
        'scrollbar-handle-hover-background': 'rgba(160, 160, 160, 60%)',
        'scrollbar-size': '12px',
        'scrollbar-track-active-background': 'transparent',
        'scrollbar-track-background': 'transparent',
        'scrollbar-track-border-radius': '0',
        'scrollbar-track-hover-background': 'transparent',
    },
    colors: {
        background: 'rgb(16, 16, 16)',
        'background-alternate': 'rgb(0, 0, 0)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(225, 225, 225)',
        'foreground-muted': 'rgb(150, 150, 150)',
        'state-error': 'rgb(204, 50, 50)',
        'state-info': 'rgb(53, 116, 252)',
        'state-success': 'rgb(50, 204, 50)',
        'state-warning': 'rgb(255, 120, 120)',
        surface: 'rgb(24, 24, 24)',
        'surface-foreground': 'rgb(215, 215, 215)',
        white: 'rgb(255, 255, 255)',
    },
    mode: 'dark',
};
