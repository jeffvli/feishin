import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const catppuccinMocha: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(transparent 0%, rgb(24 24 37 / 85%) 100%), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgb(24 24 37 / 5%) 0%, var(--theme-colors-background) 100%), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(160, 160, 160, 20%)',
        'scrollbar-handle-hover-background': 'rgba(160, 160, 160, 40%)',
    },
    colors: {
        background: 'rgb(24, 24, 37)',
        'background-alternate': 'rgb(17, 17, 27)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(205, 214, 244)',
        'foreground-muted': 'rgb(186, 194, 222)',
        primary: 'rgb(137, 180, 250)',
        'state-error': 'rgb(243, 139, 168)',
        'state-info': 'rgb(137, 180, 250)',
        'state-success': 'rgb(166, 227, 161)',
        'state-warning': 'rgb(250, 179, 135)',
        surface: 'rgb(30, 30, 46)',
        'surface-foreground': 'rgb(205, 214, 244)',
        white: 'rgb(255, 255, 255)',
    },
    mode: 'dark',
};
