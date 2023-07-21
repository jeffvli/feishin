import { Notifications } from '@mantine/notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import { queryClient } from './lib/react-query';
import 'overlayscrollbars/overlayscrollbars.css';

const container = document.getElementById('root')! as HTMLElement;
const root = createRoot(container);

root.render(
    <QueryClientProvider client={queryClient}>
        <Notifications
            containerWidth="300px"
            position="bottom-center"
        />
        <App />
    </QueryClientProvider>,
);
