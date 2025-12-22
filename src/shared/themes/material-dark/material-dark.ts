import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const materialDark: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(transparent 0%, rgb(33 33 33 / 85%) 100%), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgb(33 33 33 / 5%) 0%, var(--theme-colors-background) 100%), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(33, 150, 243, 20%)',
        'scrollbar-handle-hover-background': 'rgba(33, 150, 243, 40%)',
    },
    colors: {
        background: 'rgb(33, 33, 33)',
        'background-alternate': 'rgb(18, 18, 18)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(255, 255, 255)',
        'foreground-muted': 'rgb(189, 189, 189)',
        primary: 'rgb(33, 150, 243)',
        'state-error': 'rgb(244, 67, 54)',
        'state-info': 'rgb(33, 150, 243)',
        'state-success': 'rgb(76, 175, 80)',
        'state-warning': 'rgb(255, 152, 0)',
        surface: 'rgb(48, 48, 48)',
        'surface-foreground': 'rgb(255, 255, 255)',
        white: 'rgb(255, 255, 255)',
    },
    mode: 'dark',
};
