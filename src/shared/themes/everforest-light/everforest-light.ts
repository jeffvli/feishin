import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const everforestLight: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(transparent 0%, rgb(253 246 227 / 85%) 100%), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgb(253 246 227 / 5%) 0%, var(--theme-colors-background) 100%), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(90, 107, 78, 20%)',
        'scrollbar-handle-hover-background': 'rgba(90, 107, 78, 40%)',
    },
    colors: {
        background: 'rgb(253, 246, 227)',
        'background-alternate': 'rgb(237, 230, 211)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(92, 103, 76)',
        'foreground-muted': 'rgb(131, 145, 112)',
        primary: 'rgb(141, 165, 96)',
        'state-error': 'rgb(241, 103, 98)',
        'state-info': 'rgb(59, 145, 152)',
        'state-success': 'rgb(141, 165, 96)',
        'state-warning': 'rgb(223, 163, 59)',
        surface: 'rgb(237, 230, 211)',
        'surface-foreground': 'rgb(92, 103, 76)',
        white: 'rgb(255, 255, 255)',
    },
    mode: 'light',
};
