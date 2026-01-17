import merge from 'lodash/merge';

import { AppThemeConfiguration } from './app-theme-types';
import { AppTheme } from './app-theme-types';

import { ayuDark } from '/@/shared/themes/ayu-dark/ayu-dark';
import { ayuLight } from '/@/shared/themes/ayu-light/ayu-light';
import { catppuccinLatte } from '/@/shared/themes/catppuccin-latte/catppuccin-latte';
import { catppuccinMocha } from '/@/shared/themes/catppuccin-mocha/catppuccin-mocha';
import { defaultTheme } from '/@/shared/themes/default';
import { defaultDark } from '/@/shared/themes/default-dark/default-dark';
import { defaultLight } from '/@/shared/themes/default-light/default-light';
import { dracula } from '/@/shared/themes/dracula/dracula';
import { githubDark } from '/@/shared/themes/github-dark/github-dark';
import { githubLight } from '/@/shared/themes/github-light/github-light';
import { gruvboxDark } from '/@/shared/themes/gruvbox-dark/gruvbox-dark';
import { gruvboxLight } from '/@/shared/themes/gruvbox-light/gruvbox-light';
import { highContrastDark } from '/@/shared/themes/high-contrast-dark/high-contrast-dark';
import { highContrastLight } from '/@/shared/themes/high-contrast-light/high-contrast-light';
import { materialDark } from '/@/shared/themes/material-dark/material-dark';
import { materialLight } from '/@/shared/themes/material-light/material-light';
import { monokai } from '/@/shared/themes/monokai/monokai';
import { nightOwl } from '/@/shared/themes/night-owl/night-owl';
import { nord } from '/@/shared/themes/nord/nord';
import { oneDark } from '/@/shared/themes/one-dark/one-dark';
import { rosePineDawn } from '/@/shared/themes/rose-pine-dawn/rose-pine-dawn';
import { rosePineMoon } from '/@/shared/themes/rose-pine-moon/rose-pine-moon';
import { rosePine } from '/@/shared/themes/rose-pine/rose-pine';
import { shadesOfPurple } from '/@/shared/themes/shades-of-purple/shades-of-purple';
import { solarizedDark } from '/@/shared/themes/solarized-dark/solarized-dark';
import { solarizedLight } from '/@/shared/themes/solarized-light/solarized-light';
import { tokyoNight } from '/@/shared/themes/tokyo-night/tokyo-night';
import { vscodeDarkPlus } from '/@/shared/themes/vscode-dark-plus/vscode-dark-plus';
import { vscodeLightPlus } from '/@/shared/themes/vscode-light-plus/vscode-light-plus';

export const appTheme: Record<AppTheme, AppThemeConfiguration> = {
    [AppTheme.AYU_DARK]: ayuDark,
    [AppTheme.AYU_LIGHT]: ayuLight,
    [AppTheme.CATPPUCCIN_LATTE]: catppuccinLatte,
    [AppTheme.CATPPUCCIN_MOCHA]: catppuccinMocha,
    [AppTheme.DEFAULT_DARK]: defaultDark,
    [AppTheme.DEFAULT_LIGHT]: defaultLight,
    [AppTheme.DRACULA]: dracula,
    [AppTheme.GITHUB_DARK]: githubDark,
    [AppTheme.GITHUB_LIGHT]: githubLight,
    [AppTheme.GRUVBOX_DARK]: gruvboxDark,
    [AppTheme.GRUVBOX_LIGHT]: gruvboxLight,
    [AppTheme.HIGH_CONTRAST_DARK]: highContrastDark,
    [AppTheme.HIGH_CONTRAST_LIGHT]: highContrastLight,
    [AppTheme.MATERIAL_DARK]: materialDark,
    [AppTheme.MATERIAL_LIGHT]: materialLight,
    [AppTheme.MONOKAI]: monokai,
    [AppTheme.NIGHT_OWL]: nightOwl,
    [AppTheme.NORD]: nord,
    [AppTheme.ONE_DARK]: oneDark,
    [AppTheme.ROSE_PINE]: rosePine,
    [AppTheme.ROSE_PINE_DAWN]: rosePineDawn,
    [AppTheme.ROSE_PINE_MOON]: rosePineMoon,
    [AppTheme.SHADES_OF_PURPLE]: shadesOfPurple,
    [AppTheme.SOLARIZED_DARK]: solarizedDark,
    [AppTheme.SOLARIZED_LIGHT]: solarizedLight,
    [AppTheme.TOKYO_NIGHT]: tokyoNight,
    [AppTheme.VSCODE_DARK_PLUS]: vscodeDarkPlus,
    [AppTheme.VSCODE_LIGHT_PLUS]: vscodeLightPlus,
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
