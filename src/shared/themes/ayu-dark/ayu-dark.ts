import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const ayuDark: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(transparent 0%, rgb(31 36 48 / 85%) 100%), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgb(31 36 48 / 5%) 0%, var(--theme-colors-background) 100%), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(160, 160, 160, 20%)',
        'scrollbar-handle-hover-background': 'rgba(160, 160, 160, 40%)',
    },
    colors: {
        background: 'rgb(31, 36, 48)',
        'background-alternate': 'rgb(23, 27, 36)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(203, 204, 198)',
        'foreground-muted': 'rgb(170, 173, 166)',
        primary: 'rgb(115, 192, 203)',
        'state-error': 'rgb(255, 51, 51)',
        'state-info': 'rgb(115, 192, 203)',
        'state-success': 'rgb(186, 230, 126)',
        'state-warning': 'rgb(255, 204, 102)',
        surface: 'rgb(39, 46, 57)',
        'surface-foreground': 'rgb(203, 204, 198)',
        white: 'rgb(255, 255, 255)',
    },
    mode: 'dark',
};
