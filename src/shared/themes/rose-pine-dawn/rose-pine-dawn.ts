import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const rosePineDawn: AppThemeConfiguration = {
    app: {
        'scrollbar-handle-active-background': 'rgba(206, 202, 205, 0.7)',
        'scrollbar-handle-background': 'rgba(244, 237, 232, 0.5)',
    },
    colors: {
        background: '#faf4ed', // base
        'background-alternate': '#faf4ed', // base
        foreground: '#575279', // text
        'foreground-muted': '#9893a5', // muted
        primary: '#d7827e', // rose
        'state-error': '#b4637a', // love
        'state-info': '#56949f', // foam
        'state-success': '#286983', // pine
        'state-warning': '#ea9d34', // gold
        surface: '#fffaf3', // surface
        'surface-foreground': '#797593', // subtle
    },
    mode: 'light',
};
