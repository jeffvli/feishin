import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const monokai: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(transparent 0%, rgb(39 40 34 / 85%) 100%), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgb(39 40 34 / 5%) 0%, var(--theme-colors-background) 100%), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(160, 160, 160, 20%)',
        'scrollbar-handle-hover-background': 'rgba(160, 160, 160, 40%)',
    },
    colors: {
        background: 'rgb(39, 40, 34)',
        'background-alternate': 'rgb(30, 31, 28)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(248, 248, 242)',
        'foreground-muted': 'rgb(117, 113, 94)',
        primary: 'rgb(174, 129, 255)',
        'state-error': 'rgb(249, 38, 114)',
        'state-info': 'rgb(102, 217, 239)',
        'state-success': 'rgb(166, 226, 46)',
        'state-warning': 'rgb(253, 151, 31)',
        surface: 'rgb(50, 51, 45)',
        'surface-foreground': 'rgb(248, 248, 242)',
        white: 'rgb(255, 255, 255)',
    },
    mode: 'dark',
};
