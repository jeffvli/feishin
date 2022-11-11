import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { I18nextProvider } from 'react-i18next';
import { ErrorFallback } from '@/renderer/features/action-required';
import { queryClient } from '@/renderer/lib/react-query';
import i18n from '../i18n/i18n';
import { App } from './app';

const container = document.getElementById('root')!;
const root = createRoot(container);

root.render(
  <I18nextProvider i18n={i18n}>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <App />
      </ErrorBoundary>
      <ReactQueryDevtools position="bottom-left" />
    </QueryClientProvider>
  </I18nextProvider>
);
