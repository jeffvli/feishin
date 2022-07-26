import { ReactNode, useEffect } from 'react';
import { MantineProvider } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import isElectron from 'is-electron';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { useDefaultSettings } from './features/settings';
import { AppRouter } from './router/AppRouter';
import './styles/global.scss';

const SelectRouter = ({ children }: { children: ReactNode }) => {
  if (isElectron()) {
    return <HashRouter>{children}</HashRouter>;
  }

  return <BrowserRouter>{children}</BrowserRouter>;
};

export const App = () => {
  const [theme] = useLocalStorage({
    defaultValue: 'dark',
    key: 'theme',
  });

  useDefaultSettings();

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <MantineProvider
      theme={{
        colorScheme: 'dark',
        defaultRadius: 'xs',
        focusRing: 'auto',
        fontSizes: {
          lg: 16,
          md: 14,
          sm: 12,
          xl: 18,
          xs: 10,
        },
        other: {},
        spacing: {
          xs: 2,
        },
      }}
    >
      <SelectRouter>
        <AppRouter />
      </SelectRouter>
    </MantineProvider>
  );
};
