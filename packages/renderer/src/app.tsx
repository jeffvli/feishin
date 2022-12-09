import { useEffect } from 'react';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { NotificationsProvider } from '@mantine/notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { initSimpleImg } from 'react-simple-img';
import { BaseContextModal } from './components';
import { useTheme } from './hooks';
import { queryClient } from './lib/react-query';
import { AppRouter } from './router/app-router';
import { useSettingsStore } from './store/settings.store';
import './styles/global.scss';
import 'ag-grid-community/styles/ag-grid.css';

initSimpleImg({ threshold: 0.05 }, true);

export const App = () => {
  const theme = useTheme();
  const contentFont = useSettingsStore((state) => state.general.fontContent);
  const headerFont = useSettingsStore((state) => state.general.fontHeader);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--content-font-family', contentFont);
    root.style.setProperty('--header-font-family', headerFont);
  }, [contentFont, headerFont]);

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider
        withGlobalStyles
        withNormalizeCSS
        theme={{
          colorScheme: theme as 'light' | 'dark',
          components: { Modal: { styles: { body: { padding: '.5rem' } } } },
          defaultRadius: 'xs',
          dir: 'ltr',
          focusRing: 'auto',
          focusRingStyles: {
            inputStyles: () => ({
              border: '1px solid var(--primary-color)',
            }),
            resetStyles: () => ({ outline: 'none' }),
            styles: () => ({
              outline: '1px solid var(--primary-color)',
              outlineOffset: '-1px',
            }),
          },
          fontFamily: 'var(--content-font-family)',
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
          <ModalsProvider
            modalProps={{
              centered: true,
              exitTransitionDuration: 200,
              overflow: 'inside',
              // overlayBlur: 0,
              overlayOpacity: 0.5,
              transition: 'pop',
              transitionDuration: 200,
            }}
            modals={{ base: BaseContextModal }}
          >
            <AppRouter />
          </ModalsProvider>
        </NotificationsProvider>
      </MantineProvider>
    </QueryClientProvider>
  );
};
