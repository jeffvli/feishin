import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const zenburn: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(transparent 0%, rgb(40 44 52 / 85%) 100%), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgb(40 44 52 / 5%) 0%, var(--theme-colors-background) 100%), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(160, 160, 160, 20%)',
        'scrollbar-handle-hover-background': 'rgba(160, 160, 160, 40%)',
    },
    colors: {
        background: '#3f3f3f',
        'background-alternate': '#313131',
        black: '#313131',
        foreground: '#dcdccc',
        'foreground-muted': '#d9d9d9',
        primary: '#95a4b2',
        'state-error': '#dca3a3',
        'state-info': '#95a4b2',
        'state-success': '#7f9f7f',
        'state-warning': '#efdcbc',
        surface: '#636363',
        'surface-foreground': '#95a4b2',
        white: '#dcdccc',
    },
    mode: 'dark',
};
