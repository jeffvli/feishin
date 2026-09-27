import {
    PersistedClient,
    Persister,
    PersistQueryClientProvider,
} from '@tanstack/react-query-persist-client';
import { del, get, set } from 'idb-keyval';
import { createRoot } from 'react-dom/client';

import { App } from '/@/renderer/app';
import { queryClient } from '/@/renderer/lib/react-query';

// React 19.2 adds component metadata to development performance entries. Large
// queue objects can exceed Chromium's structured-clone limit and crash the
// renderer while it records those entries. Keep the useful timing data, but
// omit the potentially unbounded component properties in development builds.
if (import.meta.env.DEV) {
    const originalMeasure = performance.measure;

    performance.measure = function (
        measureName: string,
        startOrMeasureOptions?: PerformanceMeasureOptions | string,
        endMark?: string,
    ): PerformanceMeasure {
        let safeStartOrOptions = startOrMeasureOptions;

        if (typeof startOrMeasureOptions === 'object' && startOrMeasureOptions?.detail) {
            const detail = startOrMeasureOptions.detail;
            const devtools =
                typeof detail === 'object' && detail !== null && 'devtools' in detail
                    ? detail.devtools
                    : null;

            if (typeof devtools === 'object' && devtools !== null) {
                safeStartOrOptions = {
                    ...startOrMeasureOptions,
                    detail: {
                        ...detail,
                        devtools: {
                            ...devtools,
                            properties: null,
                        },
                    },
                };
            }
        }

        try {
            return Reflect.apply(originalMeasure, performance, [
                measureName,
                safeStartOrOptions,
                endMark,
            ]) as PerformanceMeasure;
        } catch (error) {
            if (
                error instanceof DOMException &&
                error.name === 'DataCloneError' &&
                typeof safeStartOrOptions === 'object' &&
                safeStartOrOptions !== null
            ) {
                return Reflect.apply(originalMeasure, performance, [
                    measureName,
                    { ...safeStartOrOptions, detail: null },
                ]) as PerformanceMeasure;
            }

            throw error;
        }
    };
}

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

                    return isSuccess && isLyricsQueryKey;
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
