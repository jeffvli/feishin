import { generateColors } from '@mantine/colors-generator';

import { getAppTheme } from '/@/shared/themes/app-theme';
import { AppTheme } from '/@/shared/themes/app-theme-types';

export interface PrimaryColorSettings {
    accent: string;
    primaryColor?: string;
    primaryShade: number;
    useThemeAccentColor: boolean;
    useThemePrimaryShade: boolean;
}

// Single shade-resolution shared by the useAppTheme --theme-colors-primary
// effect, the useAppThemeColors export (waveform playerbar reads the color
// straight from it), and remote settings push, which needs to know what to
// push to the remote for a specific theme regardless of which one is locally
// active. The primaryColor override lets callers pass an already-chosen raw
// primary, such as the one picked from album art.
export function resolveThemePrimaryColor(
    overrideTheme: AppTheme | string,
    {
        accent,
        primaryColor: primaryColorOverride,
        primaryShade,
        useThemeAccentColor,
        useThemePrimaryShade,
    }: PrimaryColorSettings,
): string {
    const themeProperties = getAppTheme(overrideTheme);
    const primaryColor =
        primaryColorOverride ??
        (useThemeAccentColor
            ? themeProperties.colors?.primary || themeProperties.colors?.['state-info'] || accent
            : accent);
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
