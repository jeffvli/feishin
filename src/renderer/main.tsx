import {
    PersistedClient,
    Persister,
    PersistQueryClientProvider,
} from '@tanstack/react-query-persist-client';
import { del, get, set } from 'idb-keyval';
import { createRoot } from 'react-dom/client';

import { App } from '/@/renderer/app';
import { shouldPersistDiscoverQuery } from '/@/renderer/features/discover/persisted-queries';
import { queryClient } from '/@/renderer/lib/react-query';

function createIDBPersister(idbValidKey: IDBValidKey = 'reactQuery') {
    return {
        persistClient: async (client: PersistedClient) => {
            // Awaited, so the caller's throttling waits for the transaction to commit rather
            // than for it to be queued. Unawaited, the last write before the window closes is
            // still in flight when the renderer goes away, and whatever it held is lost.
            await set(idbValidKey, client);
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
                    const hasData = query.state.data !== undefined;

                    const isLyricsQueryKey =
                        query.queryKey.includes('song') &&
                        query.queryKey.includes('lyrics') &&
                        query.queryKey.includes('select');

                    if (isLyricsQueryKey) {
                        return isSuccess;
                    }

                    // Discover reads everything it shows from third parties on a freshness
                    // policy of hours or days, so the policies only mean anything if the
                    // answers outlive the process. See `shouldPersistDiscoverQuery`.
                    return shouldPersistDiscoverQuery(
                        query.queryKey,
                        hasData,
                        isSuccess,
                        query.state.dataUpdatedAt,
                    );
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
