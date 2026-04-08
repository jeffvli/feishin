import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const everforestDark: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(transparent 0%, rgb(39 46 41 / 85%) 100%), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgb(39 46 41 / 5%) 0%, var(--theme-colors-background) 100%), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(160, 160, 160, 20%)',
        'scrollbar-handle-hover-background': 'rgba(160, 160, 160, 40%)',
    },
    colors: {
        background: 'rgb(35, 42, 46)',
        'background-alternate': 'rgb(35, 42, 46)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(211, 198, 170)',
        'foreground-muted': 'rgb(211, 198, 170)',
        primary: 'rgb(167, 192, 128)',
        'state-error': 'rgb(230, 126, 128)',
        'state-info': 'rgb(127, 187, 179)',
        'state-success': 'rgb(167, 192, 128)',
        'state-warning': 'rgb(219, 188, 127)',
        surface: 'rgb(52, 63, 56)',
        'surface-foreground': 'rgb(211, 198, 170)',
        white: 'rgb(255, 255, 255)',
    },
    mode: 'dark',
};
