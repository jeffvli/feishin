import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const dracula: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(transparent 0%, rgb(40 42 54 / 85%) 100%), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgb(40 42 54 / 5%) 0%, var(--theme-colors-background) 100%), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(160, 160, 160, 20%)',
        'scrollbar-handle-hover-background': 'rgba(160, 160, 160, 40%)',
    },
    colors: {
        background: 'rgb(40, 42, 54)',
        'background-alternate': 'rgb(30, 31, 41)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(248, 248, 242)',
        'foreground-muted': 'rgb(189, 147, 249)',
        primary: 'rgb(189, 147, 249)',
        'state-error': 'rgb(255, 85, 85)',
        'state-info': 'rgb(139, 233, 253)',
        'state-success': 'rgb(80, 250, 123)',
        'state-warning': 'rgb(255, 184, 108)',
        surface: 'rgb(68, 71, 90)',
        'surface-foreground': 'rgb(248, 248, 242)',
        white: 'rgb(255, 255, 255)',
    },
    mode: 'dark',
};
