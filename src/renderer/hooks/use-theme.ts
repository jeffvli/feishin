import { useEffect, useState } from 'react';
import { useSettingsStore } from '@/renderer/store/settings.store';

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

  return isDarkTheme ? 'dark' : 'light';
};
