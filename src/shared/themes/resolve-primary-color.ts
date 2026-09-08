import { generateColors } from '@mantine/colors-generator';

import { getAppTheme } from '/@/shared/themes/app-theme';
import { AppTheme } from '/@/shared/themes/app-theme-types';

export interface PrimaryColorSettings {
    accent: string;
    primaryShade: number;
    useThemeAccentColor: boolean;
    useThemePrimaryShade: boolean;
}

// Mirrors the `--theme-colors-primary`-setting effect in
// src/renderer/themes/use-app-theme.ts — kept as its own small pure function
// rather than imported from there (that hook does a lot more: font
// stylesheets, custom-theme registry lookups, DOM mutation timing tied to
// its own component lifecycle) so this stays safe to call from a context
// that never mounts that hook, like computing what value to push to the
// remote for a specific theme regardless of which one is locally active.
// Keep in sync with that effect if the shade-resolution logic ever changes.
export function resolveThemePrimaryColor(
    overrideTheme: AppTheme,
    { accent, primaryShade, useThemeAccentColor, useThemePrimaryShade }: PrimaryColorSettings,
): string {
    const themeProperties = getAppTheme(overrideTheme);
    const primaryColor = useThemeAccentColor
        ? themeProperties.colors?.primary || themeProperties.colors?.['state-info'] || accent
        : accent;
    const effectivePrimaryShade = useThemePrimaryShade
        ? themeProperties.mantineOverride?.primaryShade
        : { dark: primaryShade, light: primaryShade };
    const mode = themeProperties.mode ?? 'dark';
    const shadeIndex = Math.min(
        9,
        Math.max(
            0,
            typeof effectivePrimaryShade === 'object'
                ? (effectivePrimaryShade?.[mode] ?? 6)
                : (effectivePrimaryShade ?? 6),
        ),
    );
    const primaryScale = generateColors(primaryColor);
    return primaryScale[shadeIndex];
}
