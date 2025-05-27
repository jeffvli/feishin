import merge from 'lodash/merge';

import { AppThemeConfiguration } from './app-theme-types';
import { AppTheme } from './app-theme-types';

import { defaultTheme } from '/@/shared/themes/default';
import { defaultDark } from '/@/shared/themes/default-dark/default-dark';
import { defaultLight } from '/@/shared/themes/default-light/default-light';

export const appTheme: Record<AppTheme, AppThemeConfiguration> = {
    [AppTheme.DEFAULT_DARK]: defaultDark,
    [AppTheme.DEFAULT_LIGHT]: defaultLight,
};

export const getAppTheme = (theme: AppTheme): AppThemeConfiguration => {
    return {
        app: merge({}, defaultTheme.app, appTheme[theme].app),
        colors: merge({}, defaultTheme.colors, appTheme[theme].colors),
        mantineOverride: merge({}, defaultTheme.mantineOverride, appTheme[theme].mantineOverride),
        mode: appTheme[theme].mode,
        stylesheets: appTheme[theme].stylesheets,
    };
};
