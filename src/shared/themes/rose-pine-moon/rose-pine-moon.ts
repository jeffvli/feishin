import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const rosePineMoon: AppThemeConfiguration = {
    app: {
        'scrollbar-handle-active-background': 'rgba(86, 82, 110, 0.7)',
        'scrollbar-handle-background': 'rgba(42, 40, 62, 0.5)',
    },
    colors: {
        background: '#232136', // base
        'background-alternate': '#232136', // base
        foreground: '#e0def4', // text
        'foreground-muted': '#6e6a86', // muted
        primary: '#ea9a97', // rose
        'state-error': '#eb6f92', // love
        'state-info': '#9ccfd8', // foam
        'state-success': '#3e8fb0', // pine
        'state-warning': '#f6c177', // gold
        surface: '#191724', // surface
        'surface-foreground': '#908caa', // subtle
    },
    mode: 'dark',
};
