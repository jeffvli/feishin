import { useEffect } from 'react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import { ModuleRegistry } from '@ag-grid-community/core';
import { InfiniteRowModelModule } from '@ag-grid-community/infinite-row-model';
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
import '@ag-grid-community/styles/ag-grid.css';

ModuleRegistry.registerModules([ClientSideRowModelModule, InfiniteRowModelModule]);

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
          breakpoints: {
            lg: 1200,
            md: 1000,
            sm: 800,
            xl: 1400,
            xs: 500,
          },
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
            sm: 12,
            xl: 18,
            xs: 10,
          },
          headings: { fontFamily: 'var(--header-font-family)' },
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
            marginBottom: '85px',
            opacity: '.8',
            userSelect: 'none',
            width: '250px',
          }}
          transitionDuration={200}
        >
          <ModalsProvider
            modalProps={{
              centered: true,
              exitTransitionDuration: 300,
              overflow: 'inside',
              overlayBlur: 5,
              overlayOpacity: 0.5,
              transition: 'slide-down',
              transitionDuration: 300,
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
