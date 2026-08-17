import {
    PersistedClient,
    Persister,
    PersistQueryClientProvider,
} from '@tanstack/react-query-persist-client';
import { del, get, set } from 'idb-keyval';
import { createRoot } from 'react-dom/client';

import { App } from '/@/renderer/app';
import { LIBRARY_INDEX_KEY } from '/@/renderer/features/discover/api/library-index-api';
import { LISTEN_INDEX_KEY } from '/@/renderer/features/discover/api/listen-index-api';
import { NEWS_KEY } from '/@/renderer/features/discover/api/news-api';
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
                    const isLyricsQueryKey =
                        query.queryKey.includes('song') &&
                        query.queryKey.includes('lyrics') &&
                        query.queryKey.includes('select');

                    // Discover's index of what the user already owns. Scanning the whole
                    // library takes long enough that rebuilding it on every launch would be
                    // the slowest thing the app does; stored, it is read back in milliseconds
                    // and refreshed in the background. It holds only normalized strings.
                    const isLibraryIndexQueryKey = query.queryKey.includes(LIBRARY_INDEX_KEY);

                    // Discover's index of what the user has already played. Walking a hundred
                    // thousand listens runs for minutes, so it is stored and then kept current
                    // by a short catch-up walk. The walk also checkpoints into the cache as it
                    // goes, and those partial writes are what let an interrupted first pass
                    // resume instead of starting over, so they have to be stored too.
                    const isListenIndexQueryKey = query.queryKey.includes(LISTEN_INDEX_KEY);

                    // Discover's news feed. Stored so that opening the app does not fetch
                    // fourteen mastheads before anything can be shown; the hour-long staleness
                    // window then refreshes it in the background on the first visit after that.
                    const isNewsQueryKey = query.queryKey.includes(NEWS_KEY);

                    /*
                     * The two indexes are stored whenever they hold anything; everything else
                     * waits for a clean success.
                     *
                     * They are built by a walk that runs for minutes over a six-figure history
                     * and is expected to be interrupted. A pass that ends in an error still
                     * leaves a correct, smaller index with a record of where to resume, so
                     * requiring success throws away real work: the walk resumes from whatever
                     * was stored, and storing nothing means the next launch starts at zero
                     * however far the last one got.
                     */
                    const hasData = query.state.data !== undefined;

                    return (
                        (isSuccess && (isLyricsQueryKey || isNewsQueryKey)) ||
                        (hasData && (isLibraryIndexQueryKey || isListenIndexQueryKey))
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
