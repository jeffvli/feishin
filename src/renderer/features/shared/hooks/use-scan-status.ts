import type { QueryClient } from '@tanstack/react-query';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useSyncExternalStore } from 'react';

import { queryKeys } from '/@/renderer/api/query-keys';
import { eventEmitter } from '/@/renderer/events/event-emitter';
import { sharedQueries } from '/@/renderer/features/shared/api/shared-api';
import { useCurrentServerId } from '/@/renderer/store';

const SCAN_STATUS_POLL_INTERVAL_MS = 2000;
const SCAN_WATCH_TIMEOUT_MS = 30_000;

let isWatchingScan = false;
let hasSeenScanStart = false;
let watchTimeoutId: null | ReturnType<typeof setTimeout> = null;
const watchListeners = new Set<() => void>();

const subscribeWatchingScan = (listener: () => void) => {
    watchListeners.add(listener);
    return () => {
        watchListeners.delete(listener);
    };
};

const getIsWatchingScan = () => isWatchingScan;

const setIsWatchingScan = (value: boolean) => {
    if (isWatchingScan === value) {
        return;
    }

    isWatchingScan = value;
    for (const listener of watchListeners) {
        listener();
    }
};

const clearWatchTimeout = () => {
    if (watchTimeoutId !== null) {
        clearTimeout(watchTimeoutId);
        watchTimeoutId = null;
    }
};

const stopWatchingScan = () => {
    clearWatchTimeout();
    hasSeenScanStart = false;
    setIsWatchingScan(false);
};

export const startScanWatch = () => {
    clearWatchTimeout();
    hasSeenScanStart = false;
    setIsWatchingScan(true);
    watchTimeoutId = setTimeout(() => {
        watchTimeoutId = null;
        if (isWatchingScan && !hasSeenScanStart) {
            stopWatchingScan();
        }
    }, SCAN_WATCH_TIMEOUT_MS);
};

const invalidateLibraryQueriesAfterScan = (queryClient: QueryClient, serverId: string) => {
    return Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.songs.root(serverId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.albums.root(serverId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.albumArtists.root(serverId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.artists.root(serverId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.genres.root(serverId) }),
        queryClient.invalidateQueries({ queryKey: [serverId, 'folders'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.musicFolders.list(serverId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.search.root(serverId) }),
        queryClient.invalidateQueries({ queryKey: [serverId, 'tags'] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.roles.list(serverId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.playlists.root(serverId) }),
        queryClient.invalidateQueries({ queryKey: [serverId, 'home'] }),
        queryClient.invalidateQueries({ queryKey: ['home'] }),
    ]);
};

const finishScanWatch = (queryClient: QueryClient, serverId: string) => {
    if (!hasSeenScanStart) {
        return;
    }

    clearWatchTimeout();
    hasSeenScanStart = false;
    setIsWatchingScan(false);
    invalidateLibraryQueriesAfterScan(queryClient, serverId);
};

eventEmitter.on('TAG_EDITED', () => {
    startScanWatch();
});

export const useScanStatus = () => {
    const serverId = useCurrentServerId();
    const queryClient = useQueryClient();
    const isWatching = useSyncExternalStore(subscribeWatchingScan, getIsWatchingScan);

    const query = useQuery({
        ...sharedQueries.scanStatus({
            options: {
                enabled: isWatching && Boolean(serverId),
                refetchInterval: SCAN_STATUS_POLL_INTERVAL_MS,
                retry: false,
                staleTime: 0,
                throwOnError: false,
            },
            query: null,
            serverId,
        }),
    });

    useEffect(() => {
        if (!isWatching || !query.isFetched || query.isFetching || !query.data || !serverId) {
            return;
        }

        if (query.data.scanning) {
            hasSeenScanStart = true;
            clearWatchTimeout();
            return;
        }

        // Keep polling until the scan has actually started, then stop when it finishes.
        if (hasSeenScanStart && !query.data.scanning) {
            finishScanWatch(queryClient, serverId);
        }
    }, [isWatching, query.data, query.isFetched, query.isFetching, queryClient, serverId]);

    return {
        ...query,
        isScanning: query.data?.scanning === true,
        isWatching,
    };
};
