import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import {
    PersistedClient,
    Persister,
    PersistQueryClientProvider,
} from '@tanstack/react-query-persist-client';
import { get, set, del } from 'idb-keyval';
import { createRoot } from 'react-dom/client';
import { App } from './app';
import { queryClient } from './lib/react-query';
import 'overlayscrollbars/overlayscrollbars.css';

export function createIDBPersister(idbValidKey: IDBValidKey = 'reactQuery') {
    return {
        persistClient: async (client: PersistedClient) => {
            set(idbValidKey, client);
        },
        removeClient: async () => {
            await del(idbValidKey);
        },
        restoreClient: async () => {
            // eslint-disable-next-line no-return-await
            return await get<PersistedClient>(idbValidKey);
        },
    } as Persister;
}

const indexedDbPersister = createIDBPersister('feishin');

const container = document.getElementById('root')! as HTMLElement;
const root = createRoot(container);

root.render(
    <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
            buster: 'feishin',
            dehydrateOptions: {
                dehydrateQueries: true,
                shouldDehydrateQuery: (query) => {
                    const isSuccess = query.state.status === 'success';
                    const isLyricsQueryKey =
                        query.queryKey.includes('song') &&
                        query.queryKey.includes('lyrics') &&
                        query.queryKey.includes('select');

                    return isSuccess && isLyricsQueryKey;
                },
            },
            hydrateOptions: {
                defaultOptions: {
                    queries: {
                        cacheTime: Infinity,
                    },
                },
            },
            maxAge: Infinity,
            persister: indexedDbPersister,
        }}
    >
        <MantineProvider
            theme={{
                components: {
                    Modal: {
                        styles: {
                            body: { background: 'var(--modal-bg)', padding: '1rem !important' },
                            close: { marginRight: '0.5rem' },
                            content: { borderRadius: '5px' },
                            header: {
                                background: 'var(--modal-header-bg)',
                                paddingBottom: '1rem',
                            },
                            title: { fontSize: 'medium', fontWeight: 500 },
                        },
                    },
                },
                defaultRadius: 'xs',
                focusRing: 'auto',
                fontFamily: 'var(--content-font-family)',
                fontSizes: {
                    lg: '1.1rem',
                    md: '1rem',
                    sm: '0.9rem',
                    xl: '1.5rem',
                    xs: '0.8rem',
                },
                headings: {
                    fontFamily: 'var(--content-font-family)',
                    fontWeight: '700',
                },
                other: {},
                spacing: {
                    lg: '2rem',
                    md: '1rem',
                    sm: '0.5rem',
                    xl: '4rem',
                    xs: '0rem',
                },
            }}
        >
            <Notifications
                containerWidth="300px"
                position="bottom-center"
            />
            <App />
        </MantineProvider>
    </PersistQueryClientProvider>,
);
