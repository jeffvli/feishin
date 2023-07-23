import { Notifications } from '@mantine/notifications';
import { createRoot } from 'react-dom/client';
import { App } from '/@/remote/app';

const container = document.getElementById('root')! as HTMLElement;
const root = createRoot(container);

root.render(
    <>
        <Notifications
            containerWidth="300px"
            position="bottom-center"
        />
        <App />
    </>,
);
