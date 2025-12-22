import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const solarizedDark: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(transparent 0%, rgb(0 43 54 / 85%) 100%), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgb(0 43 54 / 5%) 0%, var(--theme-colors-background) 100%), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(38, 139, 210, 20%)',
        'scrollbar-handle-hover-background': 'rgba(38, 139, 210, 40%)',
    },
    colors: {
        background: 'rgb(0, 43, 54)',
        'background-alternate': 'rgb(7, 54, 66)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(131, 148, 150)',
        'foreground-muted': 'rgb(88, 110, 117)',
        primary: 'rgb(38, 139, 210)',
        'state-error': 'rgb(220, 50, 47)',
        'state-info': 'rgb(38, 139, 210)',
        'state-success': 'rgb(133, 153, 0)',
        'state-warning': 'rgb(181, 137, 0)',
        surface: 'rgb(14, 65, 78)',
        'surface-foreground': 'rgb(131, 148, 150)',
        white: 'rgb(255, 255, 255)',
    },
    mode: 'dark',
};
