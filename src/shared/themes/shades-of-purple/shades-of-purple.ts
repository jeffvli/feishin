import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const shadesOfPurple: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(transparent 0%, rgb(45 43 85 / 85%) 100%), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgb(45 43 85 / 5%) 0%, var(--theme-colors-background) 100%), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(160, 160, 160, 20%)',
        'scrollbar-handle-hover-background': 'rgba(160, 160, 160, 40%)',
    },
    colors: {
        background: 'rgb(45, 43, 85)',
        'background-alternate': 'rgb(37, 35, 69)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(255, 255, 255)',
        'foreground-muted': 'rgb(255, 255, 255)',
        primary: 'rgb(167, 129, 255)',
        'state-error': 'rgb(255, 99, 99)',
        'state-info': 'rgb(130, 170, 255)',
        'state-success': 'rgb(10, 255, 157)',
        'state-warning': 'rgb(255, 184, 108)',
        surface: 'rgb(58, 56, 102)',
        'surface-foreground': 'rgb(255, 255, 255)',
        white: 'rgb(255, 255, 255)',
    },
    mode: 'dark',
};
