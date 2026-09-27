import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { fetchSongsByItemType } from '/@/renderer/features/player/context/player-context';
import { filterSongsByPlayerFilters } from '/@/renderer/features/player/utils';
import { useCurrentServerId, usePlayerStoreBase, useSettingsStore } from '/@/renderer/store';
import { logger } from '/@/renderer/utils/logger';
import { QueueSource } from '/@/shared/types/domain-types';
import { PlayerShuffle } from '/@/shared/types/types';

interface SourceRefreshState {
    queueLength: number;
    source: null | QueueSource;
}

export const QueueSourceRefreshHook = () => {
    const queryClient = useQueryClient();
    const serverId = useCurrentServerId();
    const consumeQueue = useSettingsStore((state) => state.playback.consumeQueue);
    const inFlightSourceRef = useRef<null | string>(null);
    const preparedRevisionRef = useRef<null | string>(null);

    useEffect(() => {
        if (!consumeQueue || !serverId) {
            return;
        }

        const maybeRefreshSource = async ({ queueLength, source }: SourceRefreshState) => {
            if (!source) {
                return;
            }

            if (queueLength > 2) {
                preparedRevisionRef.current = null;
                return;
            }

            const sourceKey = `${source.type}:${source.id}`;
            const revision = `${sourceKey}:${source.trackIds[0] ?? 'empty'}`;
            if (
                inFlightSourceRef.current === sourceKey ||
                preparedRevisionRef.current === revision
            ) {
                return;
            }

            inFlightSourceRef.current = sourceKey;

            try {
                const songs = await fetchSongsByItemType(queryClient, serverId, {
                    id: [source.id],
                    itemType: source.type,
                });
                const filters = useSettingsStore.getState().playback.filters;
                const filteredSongs = filterSongsByPlayerFilters(songs, filters);
                usePlayerStoreBase.getState().refreshQueueSource(filteredSongs);

                const refreshedSource = usePlayerStoreBase.getState().queue.source;
                preparedRevisionRef.current = refreshedSource
                    ? `${refreshedSource.type}:${refreshedSource.id}:${refreshedSource.trackIds[0] ?? 'empty'}`
                    : null;
            } catch (error) {
                logger.warn('Failed to refresh queue source before random refill', {
                    error: error instanceof Error ? error.message : String(error),
                    sourceId: source.id,
                    sourceType: source.type,
                });
            } finally {
                inFlightSourceRef.current = null;
            }
        };

        const selectSourceRefreshState = (): SourceRefreshState => {
            const state = usePlayerStoreBase.getState();
            return {
                queueLength: state.queue.default.length,
                source: state.player.shuffle === PlayerShuffle.TRACK ? state.queue.source : null,
            };
        };

        void maybeRefreshSource(selectSourceRefreshState());

        return usePlayerStoreBase.subscribe(
            (state) => ({
                queueLength: state.queue.default.length,
                source: state.player.shuffle === PlayerShuffle.TRACK ? state.queue.source : null,
            }),
            (state) => {
                void maybeRefreshSource(state);
            },
            {
                equalityFn: (a, b) =>
                    a.queueLength === b.queueLength &&
                    a.source?.id === b.source?.id &&
                    a.source?.trackIds[0] === b.source?.trackIds[0] &&
                    a.source?.type === b.source?.type,
            },
        );
    }, [consumeQueue, queryClient, serverId]);

    return null;
};
