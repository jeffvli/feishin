import { useMantineColorScheme } from '@mantine/core';
import { useEffect, useMemo, useRef, useState } from 'react';

import { useSettingsStore } from '/@/renderer/store/settings.store';
import { createMantineTheme } from '/@/renderer/themes/mantine-theme';
import { getAppTheme } from '/@/shared/themes/app-theme';
import { AppTheme, AppThemeConfiguration } from '/@/shared/themes/app-theme-types';
import { FontType } from '/@/shared/types/types';

export const THEME_DATA = [
    { label: 'Default Dark', type: 'dark', value: AppTheme.DEFAULT_DARK },
    { label: 'Default Light', type: 'light', value: AppTheme.DEFAULT_LIGHT },
];

export const useAppTheme = () => {
    const accent = useSettingsStore((store) => store.general.accent);
    const nativeImageAspect = useSettingsStore((store) => store.general.nativeAspectRatio);
    const { builtIn, custom, system, type } = useSettingsStore((state) => state.font);
    const textStyleRef = useRef<HTMLStyleElement | null>(null);
    const getCurrentTheme = () => window.matchMedia('(prefers-color-scheme: dark)').matches;
    const [isDarkTheme, setIsDarkTheme] = useState(getCurrentTheme());
    const { followSystemTheme, theme, themeDark, themeLight } = useSettingsStore(
        (state) => state.general,
    );

    const mqListener = (e: any) => {
        setIsDarkTheme(e.matches);
    };

    const getSelectedTheme = () => {
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
            root.style.setProperty('--theme-content-font-family', 'dynamic-font');

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
            root.style.setProperty('--theme-content-font-family', 'dynamic-font');

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
            root.style.setProperty('--theme-content-font-family', builtIn);
        }
    }, [builtIn, custom, system, type]);

    const appTheme: AppThemeConfiguration = useMemo(() => {
        const themeProperties = getAppTheme(selectedTheme);

        return {
            ...themeProperties,
            colors: {
                ...themeProperties.colors,
                primary: accent,
            },
        };
    }, [accent, selectedTheme]);

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--theme-colors-primary', accent);
    }, [accent]);

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--theme-image-fit', nativeImageAspect ? 'contain' : 'cover');
    }, [nativeImageAspect]);

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

    return {
        mode: appTheme?.mode || 'dark',
        theme: createMantineTheme(appTheme as AppThemeConfiguration),
    };
};

export const useSetColorScheme = () => {
    const { setColorScheme } = useMantineColorScheme();

    return { setColorScheme };
};
