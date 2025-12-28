import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const oneDark: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(transparent 0%, rgb(40 44 52 / 85%) 100%), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgb(40 44 52 / 5%) 0%, var(--theme-colors-background) 100%), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(160, 160, 160, 20%)',
        'scrollbar-handle-hover-background': 'rgba(160, 160, 160, 40%)',
    },
    colors: {
        background: 'rgb(40, 44, 52)',
        'background-alternate': 'rgb(30, 33, 40)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(171, 178, 191)',
        'foreground-muted': 'rgb(152, 161, 178)',
        primary: 'rgb(97, 175, 239)',
        'state-error': 'rgb(224, 108, 117)',
        'state-info': 'rgb(97, 175, 239)',
        'state-success': 'rgb(152, 195, 121)',
        'state-warning': 'rgb(229, 192, 123)',
        surface: 'rgb(55, 59, 70)',
        'surface-foreground': 'rgb(171, 178, 191)',
        white: 'rgb(255, 255, 255)',
    },
    mode: 'dark',
};
