import glassyOverridesCss from './glassy_overrides.css?inline';

import { AppThemeConfiguration } from '/@/shared/themes/app-theme-types';

export const glassyDark: AppThemeConfiguration = {
    app: {
        'overlay-header':
            'linear-gradient(transparent 0%, rgb(13 17 23 / 85%) 100%), var(--theme-background-noise)',
        'overlay-subheader':
            'linear-gradient(180deg, rgb(13 17 23 / 5%) 0%, var(--theme-colors-background) 100%), var(--theme-background-noise)',
        'scrollbar-handle-background': 'rgba(88, 166, 255, 20%)',
        'scrollbar-handle-hover-background': 'rgba(88, 166, 255, 40%)',
    },
    colors: {
        background: 'rgb(2, 2, 6)',
        'background-alternate': 'rgb(0, 0, 0)',
        black: 'rgb(0, 0, 0)',
        foreground: 'rgb(225, 225, 225)',
        'foreground-muted': 'rgb(150, 150, 150)',
        'state-error': 'rgb(204, 50, 50)',
        'state-info': 'rgb(53, 116, 252)',
        'state-success': 'rgb(50, 204, 50)',
        'state-warning': 'rgb(255, 120, 120)',
        surface: 'rgb(4, 4, 9)',
        'surface-foreground': 'rgb(215, 215, 215)',
        white: 'rgb(255, 255, 255)',
    },
    mode: 'dark',
    stylesheets: [glassyOverridesCss],
};
