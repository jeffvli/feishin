import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const solarizedLight: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(rgb(253 246 227 / 50%) 0%, rgb(253 246 227 / 80%)), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgba(253, 246, 227, 5%) 0%, var(--theme-colors-background)), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(38, 139, 210, 30%)',
        'scrollbar-handle-hover-background': 'rgba(38, 139, 210, 60%)',
    },
    colors: {
        background: 'rgb(253, 246, 227)',
        'background-alternate': 'rgb(238, 232, 213)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(101, 123, 131)',
        'foreground-muted': 'rgb(147, 161, 161)',
        primary: 'rgb(38, 139, 210)',
        'state-error': 'rgb(220, 50, 47)',
        'state-info': 'rgb(38, 139, 210)',
        'state-success': 'rgb(133, 153, 0)',
        'state-warning': 'rgb(181, 137, 0)',
        surface: 'rgb(247, 240, 220)',
        'surface-foreground': 'rgb(0, 43, 54)',
        white: 'rgb(255, 255, 255)',
    },
    mantineOverride: {
        primaryShade: {
            light: 4,
        },
    },
    mode: 'light',
};
