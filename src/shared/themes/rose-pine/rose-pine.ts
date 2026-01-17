import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const rosePine: AppThemeConfiguration = {
    app: {
        'scrollbar-handle-active-background': 'rgba(82, 79, 103, 0.7)',
        'scrollbar-handle-background': 'rgba(33, 32, 46, 0.5)',
    },
    colors: {
        background: '#191724', // base
        'background-alternate': '#191724', // base
        foreground: '#e0def4', // text
        'foreground-muted': '#6e6a86', // muted
        primary: '#ebbcba', // rose
        'state-error': '#eb6f92', // love
        'state-info': '#9ccfd8', // foam
        'state-success': '#31748f', // pine
        'state-warning': '#f6c177', // gold
        surface: '#1f1d2e', // surface
        'surface-foreground': '#908caa', // subtle
    },
    mode: 'dark',
};
