import {
    PersistedClient,
    Persister,
    PersistQueryClientProvider,
} from '@tanstack/react-query-persist-client';
import { del, get, set } from 'idb-keyval';
import { createRoot } from 'react-dom/client';

import { App } from '/@/renderer/app';
import { LIBRARY_INDEX_KEY } from '/@/renderer/features/discover/api/library-index-api';
import { queryClient } from '/@/renderer/lib/react-query';

function createIDBPersister(idbValidKey: IDBValidKey = 'reactQuery') {
    return {
        persistClient: async (client: PersistedClient) => {
            set(idbValidKey, client);
        },
        removeClient: async () => {
            await del(idbValidKey);
        },
        restoreClient: async () => {
            return await get<PersistedClient>(idbValidKey);
        },
    } as Persister;
}

const indexedDbPersister = createIDBPersister('feishin');

createRoot(document.getElementById('root')!).render(
    <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
            buster: 'feishin',
            dehydrateOptions: {
                shouldDehydrateQuery: (query) => {
                    const isSuccess = query.state.status === 'success';
                    const isLyricsQueryKey =
                        query.queryKey.includes('song') &&
                        query.queryKey.includes('lyrics') &&
                        query.queryKey.includes('select');

                    // Discover's index of what the user already owns. Scanning the whole
                    // library takes long enough that rebuilding it on every launch would be
                    // the slowest thing the app does; stored, it is read back in milliseconds
                    // and refreshed in the background. It holds only normalized strings.
                    const isLibraryIndexQueryKey = query.queryKey.includes(LIBRARY_INDEX_KEY);

                    return isSuccess && (isLyricsQueryKey || isLibraryIndexQueryKey);
                },
            },
            hydrateOptions: {
                defaultOptions: {
                    queries: {
                        gcTime: Infinity,
                    },
                },
            },
            maxAge: Infinity,
            persister: indexedDbPersister,
        }}
    >
        <App />
    </PersistQueryClientProvider>,
);
