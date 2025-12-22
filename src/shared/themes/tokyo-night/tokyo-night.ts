import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const tokyoNight: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(transparent 0%, rgb(26 27 38 / 85%) 100%), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgb(26 27 38 / 5%) 0%, var(--theme-colors-background) 100%), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(125, 207, 255, 20%)',
        'scrollbar-handle-hover-background': 'rgba(125, 207, 255, 40%)',
    },
    colors: {
        background: 'rgb(26, 27, 38)',
        'background-alternate': 'rgb(20, 21, 30)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(192, 202, 245)',
        'foreground-muted': 'rgb(169, 177, 214)',
        primary: 'rgb(125, 207, 255)',
        'state-error': 'rgb(247, 118, 142)',
        'state-info': 'rgb(125, 207, 255)',
        'state-success': 'rgb(158, 206, 106)',
        'state-warning': 'rgb(255, 158, 100)',
        surface: 'rgb(35, 36, 51)',
        'surface-foreground': 'rgb(192, 202, 245)',
        white: 'rgb(255, 255, 255)',
    },
    mode: 'dark',
};
