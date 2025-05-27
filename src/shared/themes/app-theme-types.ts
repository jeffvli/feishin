import type { MantineThemeOverride } from '@mantine/core';

import { CSSProperties } from 'react';

export enum AppTheme {
    DEFAULT_DARK = 'defaultDark',
    DEFAULT_LIGHT = 'defaultLight',
}

export type AppThemeConfiguration = Partial<BaseAppThemeConfiguration>;

export interface BaseAppThemeConfiguration {
    app: {
        'overlay-header'?: CSSProperties['background'];
        'overlay-subheader'?: CSSProperties['background'];
        'root-font-size'?: CSSProperties['fontSize'];
        'scrollbar-handle-active-background'?: CSSProperties['background'];
        'scrollbar-handle-background'?: CSSProperties['background'];
        'scrollbar-handle-border-radius'?: CSSProperties['borderRadius'];
        'scrollbar-handle-hover-background'?: CSSProperties['background'];
        'scrollbar-size'?: CSSProperties['width'];
        'scrollbar-track-active-background'?: CSSProperties['background'];
        'scrollbar-track-background'?: CSSProperties['background'];
        'scrollbar-track-border-radius'?: CSSProperties['borderRadius'];
        'scrollbar-track-hover-background'?: CSSProperties['background'];
    };
    colors: {
        background?: CSSProperties['background'];
        'background-alternate'?: CSSProperties['background'];
        black?: CSSProperties['color'];
        foreground?: CSSProperties['color'];
        'foreground-muted'?: CSSProperties['color'];
        primary?: CSSProperties['color'];
        'state-error'?: CSSProperties['color'];
        'state-info'?: CSSProperties['color'];
        'state-success'?: CSSProperties['color'];
        'state-warning'?: CSSProperties['color'];
        surface?: CSSProperties['background'];
        'surface-foreground'?: CSSProperties['color'];
        white?: CSSProperties['color'];
    };
    mantineOverride?: MantineThemeOverride;
    mode: 'dark' | 'light';
    stylesheets?: string[];
}
