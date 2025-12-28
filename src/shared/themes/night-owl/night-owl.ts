import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const nightOwl: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(transparent 0%, rgb(1 22 39 / 85%) 100%), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgb(1 22 39 / 5%) 0%, var(--theme-colors-background) 100%), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(160, 160, 160, 20%)',
        'scrollbar-handle-hover-background': 'rgba(160, 160, 160, 40%)',
    },
    colors: {
        background: 'rgb(1, 22, 39)',
        'background-alternate': 'rgb(0, 16, 28)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(214, 222, 235)',
        'foreground-muted': 'rgb(171, 178, 191)',
        primary: 'rgb(130, 170, 255)',
        'state-error': 'rgb(255, 123, 172)',
        'state-info': 'rgb(130, 170, 255)',
        'state-success': 'rgb(173, 219, 103)',
        'state-warning': 'rgb(255, 184, 108)',
        surface: 'rgb(11, 41, 66)',
        'surface-foreground': 'rgb(214, 222, 235)',
        white: 'rgb(255, 255, 255)',
    },
    mode: 'dark',
};
