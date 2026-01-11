import { useMantineColorScheme } from '@mantine/core';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
    useAccent,
    useFontSettings,
    useNativeAspectRatio,
    useThemeSettings,
} from '/@/renderer/store/settings.store';
import { createMantineTheme } from '/@/renderer/themes/mantine-theme';
import { getAppTheme } from '/@/shared/themes/app-theme';
import { AppTheme, AppThemeConfiguration } from '/@/shared/themes/app-theme-types';
import { FontType } from '/@/shared/types/types';

export const THEME_DATA = [
    { label: 'Default Dark', type: 'dark', value: AppTheme.DEFAULT_DARK },
    { label: 'Default Light', type: 'light', value: AppTheme.DEFAULT_LIGHT },
    { label: 'Nord', type: 'dark', value: AppTheme.NORD },
    { label: 'Dracula', type: 'dark', value: AppTheme.DRACULA },
    { label: 'One Dark', type: 'dark', value: AppTheme.ONE_DARK },
    { label: 'Solarized Dark', type: 'dark', value: AppTheme.SOLARIZED_DARK },
    { label: 'Solarized Light', type: 'light', value: AppTheme.SOLARIZED_LIGHT },
    { label: 'GitHub Dark', type: 'dark', value: AppTheme.GITHUB_DARK },
    { label: 'GitHub Light', type: 'light', value: AppTheme.GITHUB_LIGHT },
    { label: 'Monokai', type: 'dark', value: AppTheme.MONOKAI },
    { label: 'High Contrast Dark', type: 'dark', value: AppTheme.HIGH_CONTRAST_DARK },
    { label: 'High Contrast Light', type: 'light', value: AppTheme.HIGH_CONTRAST_LIGHT },
    { label: 'Tokyo Night', type: 'dark', value: AppTheme.TOKYO_NIGHT },
    { label: 'Catppuccin Mocha', type: 'dark', value: AppTheme.CATPPUCCIN_MOCHA },
    { label: 'Catppuccin Latte', type: 'light', value: AppTheme.CATPPUCCIN_LATTE },
    { label: 'Gruvbox Dark', type: 'dark', value: AppTheme.GRUVBOX_DARK },
    { label: 'Gruvbox Light', type: 'light', value: AppTheme.GRUVBOX_LIGHT },
    { label: 'Night Owl', type: 'dark', value: AppTheme.NIGHT_OWL },
    { label: 'Material Dark', type: 'dark', value: AppTheme.MATERIAL_DARK },
    { label: 'Material Light', type: 'light', value: AppTheme.MATERIAL_LIGHT },
    { label: 'Ayu Dark', type: 'dark', value: AppTheme.AYU_DARK },
    { label: 'Ayu Light', type: 'light', value: AppTheme.AYU_LIGHT },
    { label: 'Shades of Purple', type: 'dark', value: AppTheme.SHADES_OF_PURPLE },
    { label: 'VS Code Dark+', type: 'dark', value: AppTheme.VSCODE_DARK_PLUS },
    { label: 'VS Code Light+', type: 'light', value: AppTheme.VSCODE_LIGHT_PLUS },
    { label: 'Rosé Pine', type: 'dark', value: AppTheme.ROSE_PINE },
    { label: 'Rosé Pine Moon', type: 'dark', value: AppTheme.ROSE_PINE_MOON },
    { label: 'Rosé Pine Dawn', type: 'light', value: AppTheme.ROSE_PINE_DAWN },
];

export const useAppTheme = (overrideTheme?: AppTheme) => {
    const accent = useAccent();
    const nativeImageAspect = useNativeAspectRatio();
    const { builtIn, custom, system, type } = useFontSettings();
    const textStyleRef = useRef<HTMLStyleElement | null>(null);
    const loadedStylesheetsRef = useRef<Set<string>>(new Set());
    const getCurrentTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
    const [isDarkTheme, setIsDarkTheme] = useState(getCurrentTheme());
    const { followSystemTheme, theme, themeDark, themeLight, useThemeAccentColor } =
        useThemeSettings();

    const mqListener = (e: any) => {
        setIsDarkTheme(e.matches);
    };

    const loadStylesheet = (href: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            if (loadedStylesheetsRef.current.has(href)) {
                resolve();
                return;
            }

            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;
            link.onload = () => {
                loadedStylesheetsRef.current.add(href);
                resolve();
            };
            link.onerror = () => {
                console.warn(`Failed to load stylesheet: ${href}`);
                reject(new Error(`Failed to load stylesheet: ${href}`));
            };

            document.head.appendChild(link);
        });
    };

    const unloadStylesheet = (href: string) => {
        const existingLink = document.querySelector(`link[href="${href}"]`);
        if (existingLink) {
            existingLink.remove();
            loadedStylesheetsRef.current.delete(href);
        }
    };

    const loadThemeStylesheets = useCallback(async (stylesheets: string[] = []) => {
        if (loadedStylesheetsRef.current.size > 0) {
            loadedStylesheetsRef.current.forEach((href) => unloadStylesheet(href));
            loadedStylesheetsRef.current.clear();
        }

        if (stylesheets.length === 0) {
            return;
        }

        const loadPromises = stylesheets.map((href) =>
            loadStylesheet(href).catch((error) => {
                console.warn(`Error loading stylesheet ${href}:`, error);
            }),
        );

        await Promise.all(loadPromises);
    }, []);

    const getSelectedTheme = () => {
        if (overrideTheme) {
            return overrideTheme;
        }

        if (followSystemTheme) {
            return isDarkTheme ? themeDark : themeLight;
        }

        return theme;
    };

    const selectedTheme = getSelectedTheme();

    useEffect(() => {
        const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)');
        darkThemeMq.addListener(mqListener);
        return () => darkThemeMq.removeListener(mqListener);
    }, []);

    useEffect(() => {
        if (type === FontType.SYSTEM && system) {
            const root = document.documentElement;
            root.style.setProperty(
                '--theme-content-font-family',
                'dynamic-font, "Noto Sans JP", sans-serif',
            );

            if (!textStyleRef.current) {
                textStyleRef.current = document.createElement('style');
                document.body.appendChild(textStyleRef.current);
            }

            textStyleRef.current.textContent = `
            @font-face {
                font-family: "dynamic-font";
                src: local("${system}");
            }`;
        } else if (type === FontType.CUSTOM && custom) {
            const root = document.documentElement;
            root.style.setProperty(
                '--theme-content-font-family',
                'dynamic-font, "Noto Sans JP", sans-serif',
            );

            if (!textStyleRef.current) {
                textStyleRef.current = document.createElement('style');
                document.body.appendChild(textStyleRef.current);
            }

            textStyleRef.current.textContent = `
            @font-face {
                font-family: "dynamic-font";
                src: url("feishin://${custom}");
            }`;
        } else {
            const root = document.documentElement;
            root.style.setProperty(
                '--theme-content-font-family',
                `${builtIn}, "Noto Sans JP", sans-serif`,
            );
        }
    }, [builtIn, custom, system, type]);

    const appTheme: AppThemeConfiguration = useMemo(() => {
        const themeProperties = getAppTheme(selectedTheme);

        // Use theme's primary color if useThemeAccentColor is enabled, otherwise use custom accent
        const primaryColor = useThemeAccentColor
            ? themeProperties.colors?.primary || themeProperties.colors?.['state-info'] || accent
            : accent;

        return {
            ...themeProperties,
            colors: {
                ...themeProperties.colors,
                primary: primaryColor,
            },
        };
    }, [accent, selectedTheme, useThemeAccentColor]);

    useEffect(() => {
        const root = document.documentElement;
        const themeProperties = getAppTheme(selectedTheme);
        const primaryColor = useThemeAccentColor
            ? themeProperties.colors?.primary || themeProperties.colors?.['state-info'] || accent
            : accent;
        root.style.setProperty('--theme-colors-primary', primaryColor);
    }, [accent, selectedTheme, useThemeAccentColor]);

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--theme-image-fit', nativeImageAspect ? 'contain' : 'cover');
    }, [nativeImageAspect]);

    useEffect(() => {
        if (appTheme?.stylesheets) {
            loadThemeStylesheets(appTheme.stylesheets);
        }
    }, [selectedTheme, appTheme?.stylesheets, loadThemeStylesheets]);

    const themeVars = useMemo(() => {
        return Object.entries(appTheme?.app ?? {})
            .map(([key, value]) => {
                return [`--theme-${key}`, value];
            })
            .filter(Boolean) as [string, string][];
    }, [appTheme]);

    const colorVars = useMemo(() => {
        return Object.entries(appTheme?.colors ?? {})
            .map(([key, value]) => {
                return [`--theme-colors-${key}`, value];
            })
            .filter(Boolean) as [string, string][];
    }, [appTheme]);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', selectedTheme);

        if (themeVars.length > 0 || colorVars.length > 0) {
            let styleElement = document.getElementById('theme-variables');
            if (!styleElement) {
                styleElement = document.createElement('style');
                styleElement.id = 'theme-variables';
                document.head.appendChild(styleElement);
            }

            let cssText = ':root {\n';

            for (const [key, value] of themeVars) {
                cssText += `  ${key}: ${value};\n`;
            }

            for (const [key, value] of colorVars) {
                cssText += `  ${key}: ${value};\n`;
            }

            cssText += '}';

            styleElement.textContent = cssText;
        }
    }, [colorVars, selectedTheme, themeVars]);

    const mantineTheme = useMemo(
        () => createMantineTheme(appTheme as AppThemeConfiguration),
        [appTheme],
    );

    return {
        mode: appTheme?.mode || 'dark',
        theme: mantineTheme,
    };
};

export const useSetColorScheme = () => {
    const { setColorScheme } = useMantineColorScheme();

    return { setColorScheme };
};

export const useColorScheme = () => {
    const { colorScheme } = useMantineColorScheme();

    return colorScheme === 'dark' ? 'dark' : 'light';
};

export const useAppThemeColors = () => {
    const accent = useAccent();
    const getCurrentTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
    const [isDarkTheme] = useState(getCurrentTheme());
    const { followSystemTheme, theme, themeDark, themeLight, useThemeAccentColor } =
        useThemeSettings();

    const getSelectedTheme = () => {
        if (followSystemTheme) {
            return isDarkTheme ? themeDark : themeLight;
        }

        return theme;
    };

    const selectedTheme = getSelectedTheme();

    const appTheme: AppThemeConfiguration = useMemo(() => {
        const themeProperties = getAppTheme(selectedTheme);

        // Use theme's primary color if useThemeAccentColor is enabled, otherwise use custom accent
        const primaryColor = useThemeAccentColor
            ? themeProperties.colors?.primary || themeProperties.colors?.['state-info'] || accent
            : accent;

        return {
            ...themeProperties,
            colors: {
                ...themeProperties.colors,
                primary: primaryColor,
            },
        };
    }, [accent, selectedTheme, useThemeAccentColor]);

    const themeVars = useMemo(() => {
        return Object.entries(appTheme?.app ?? {})
            .map(([key, value]) => {
                return [`--theme-${key}`, value];
            })
            .filter(Boolean) as [string, string][];
    }, [appTheme]);

    const colorVars = useMemo(() => {
        return Object.entries(appTheme?.colors ?? {})
            .map(([key, value]) => {
                return [`--theme-colors-${key}`, value];
            })
            .filter(Boolean) as [string, string][];
    }, [appTheme]);

    return {
        color: Object.fromEntries(colorVars),
        theme: Object.fromEntries(themeVars),
    };
};
