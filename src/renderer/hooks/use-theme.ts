import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/renderer/store/settings.store';
import { AppTheme } from '@/renderer/themes/types';

export const THEME_DATA = [
  { label: 'Default Dark', type: 'dark', value: AppTheme.DEFAULT_DARK },
  { label: 'Default Light', type: 'light', value: AppTheme.DEFAULT_LIGHT },
];

export const useTheme = () => {
  const getCurrentTheme = () =>
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  const [isDarkTheme, setIsDarkTheme] = useState(getCurrentTheme());
  const { followSystemTheme, theme, themeDark, themeLight } = useSettingsStore(
    (state) => state.general
  );

  const mqListener = (e: any) => {
    setIsDarkTheme(e.matches);
  };

  const getTheme = () => {
    if (followSystemTheme) {
      return isDarkTheme ? themeDark : themeLight;
    }

    return theme;
  };

  const appTheme = getTheme();

  useEffect(() => {
    const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)');
    darkThemeMq.addListener(mqListener);
    return () => darkThemeMq.removeListener(mqListener);
  }, []);

  useEffect(() => {
    document.body.setAttribute('data-theme', appTheme);
  }, [appTheme]);

  return THEME_DATA.find((t) => t.value === appTheme)?.type || 'dark';
};
