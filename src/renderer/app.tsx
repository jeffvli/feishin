import { ReactNode, useEffect } from 'react';
import { MantineProvider } from '@mantine/core';
import { useLocalStorage } from '@mantine/hooks';
import { ModalsProvider } from '@mantine/modals';
import { NotificationsProvider } from '@mantine/notifications';
import isElectron from 'is-electron';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { BaseContextModal } from '@/renderer/components';
import { useDefaultSettings } from './features/settings';
import { AppRouter } from './router/app-router';
import './styles/global.scss';
import 'ag-grid-community/styles/ag-grid.css';

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
      withGlobalStyles
      withNormalizeCSS
      theme={{
        colorScheme: 'dark',
        defaultRadius: 'xs',
        dir: 'ltr',
        focusRing: 'never',
        fontFamily: 'Sora, sans-serif',
        fontSizes: {
          lg: 16,
          md: 14,
          sm: 13,
          xl: 18,
          xs: 12,
        },
        other: {},
        spacing: {
          lg: 12,
          md: 8,
          sm: 4,
          xl: 16,
          xs: 2,
        },
      }}
    >
      <NotificationsProvider
        autoClose={1500}
        position="bottom-right"
        style={{
          marginBottom: '90px',
          opacity: '.8',
          userSelect: 'none',
          width: '250px',
        }}
        transitionDuration={200}
      >
        <ModalsProvider modals={{ base: BaseContextModal }}>
          <SelectRouter>
            <AppRouter />
          </SelectRouter>
        </ModalsProvider>
      </NotificationsProvider>
    </MantineProvider>
  );
};
