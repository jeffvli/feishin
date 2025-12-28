import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const githubDark: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(transparent 0%, rgb(13 17 23 / 85%) 100%), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgb(13 17 23 / 5%) 0%, var(--theme-colors-background) 100%), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(160, 160, 160, 20%)',
        'scrollbar-handle-hover-background': 'rgba(160, 160, 160, 40%)',
    },
    colors: {
        background: 'rgb(13, 17, 23)',
        'background-alternate': 'rgb(22, 27, 34)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(201, 209, 217)',
        'foreground-muted': 'rgb(139, 148, 158)',
        primary: 'rgb(88, 166, 255)',
        'state-error': 'rgb(248, 81, 73)',
        'state-info': 'rgb(88, 166, 255)',
        'state-success': 'rgb(56, 211, 145)',
        'state-warning': 'rgb(251, 188, 5)',
        surface: 'rgb(46, 57, 72)',
        'surface-foreground': 'rgb(201, 209, 217)',
        white: 'rgb(255, 255, 255)',
    },
    mode: 'dark',
};
