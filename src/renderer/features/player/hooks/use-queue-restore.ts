import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useCallback, useEffect, useRef } from 'react';

import { api } from '/@/renderer/api';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import {
    setTimestamp,
    useCurrentServerId,
    usePlayerActions,
    usePlayerHydrated,
    usePlayerSong,
    usePlayerStatus,
    usePlayerStore,
    useTimestampStoreBase,
} from '/@/renderer/store';
import { toast } from '/@/shared/components/toast/toast';
import { PlayerStatus } from '/@/shared/types/types';

export const useQueueRestoreTimestamp = () => {
    const { mediaSeekToTimestamp } = usePlayerActions();

    usePlayerEvents(
        {
            onQueueRestored: (properties) => {
                const { position } = properties;

                setTimeout(() => {
                    setTimestamp(position);
                    mediaSeekToTimestamp(position);
                }, 100);
            },
        },
        [],
    );
};

export const QueueRestoreTimestampHook = () => {
    useQueueRestoreTimestamp();
    return null;
};

export const useInitialTimestampRestore = () => {
    const { mediaSeekToTimestamp } = usePlayerActions();
    const playerHydrated = usePlayerHydrated();
    const currentSong = usePlayerSong();
    const playerStatus = usePlayerStatus();
    const timestamp = useTimestampStoreBase((state) => state.timestamp);

    const startupRestoreInitializedRef = useRef(false);
    const startupSeekArmedRef = useRef<null | number>(null);
    const startupSeekAppliedRef = useRef(false);

    const applyStartupSeek = useCallback(() => {
        if (startupSeekAppliedRef.current) {
            return;
        }

        const seekTimestamp = startupSeekArmedRef.current;
        if (!seekTimestamp || seekTimestamp <= 0) {
            return;
        }

        startupSeekAppliedRef.current = true;
        startupSeekArmedRef.current = null;

        setTimeout(() => {
            mediaSeekToTimestamp(seekTimestamp);
        }, 100);
    }, [mediaSeekToTimestamp]);

    useEffect(() => {
        if (startupRestoreInitializedRef.current) {
            return;
        }

        if (!playerHydrated || !currentSong) {
            return;
        }

        startupRestoreInitializedRef.current = true;

        if (timestamp > 0) {
            startupSeekArmedRef.current = timestamp;
        }

        if (playerStatus === PlayerStatus.PLAYING) {
            applyStartupSeek();
        }
    }, [applyStartupSeek, currentSong, playerHydrated, playerStatus, timestamp]);

    usePlayerEvents(
        {
            onPlayerStatus: (properties) => {
                if (properties.status === PlayerStatus.PLAYING) {
                    applyStartupSeek();
                }
            },
        },
        [applyStartupSeek],
    );
};

export const InitialTimestampRestoreHook = () => {
    useInitialTimestampRestore();
    return null;
};

export const useSaveQueue = () => {
    const serverId = useCurrentServerId();

    const mutation = useMutation({
        mutationFn: async () => {
            if (!serverId) {
                throw new Error(t('error.serverRequired'));
            }

            const state = usePlayerStore.getState();
            const queue = state.getQueue();

            if (queue.items.some((item) => item._serverId !== serverId)) {
                toast.error({
                    message: t('error.multipleServerSaveQueueError'),
                    title: t('error.genericError'),
                });

                throw new Error(`${t('error.multipleServerSaveQueueError')}`);
            }

            try {
                await api.controller.savePlayQueue({
                    apiClientProps: { serverId },
                    query: {
                        currentIndex: queue.items.length > 0 ? state.player.index : undefined,
                        positionMs: useTimestampStoreBase.getState().timestamp * 1000,
                        songs: queue.items.map((item) => item.id),
                    },
                });

                toast.success({
                    message: t('form.saveQueue.success'),
                });
            } catch (error) {
                toast.error({
                    message: (error as Error).message,
                    title: t('error.saveQueueFailed'),
                });
                throw error;
            }
        },
    });

    return mutation;
};

export const useRestoreQueue = () => {
    const serverId = useCurrentServerId();
    const player = usePlayer();
    const queryClient = useQueryClient();

    const handleRestoreQueue = useCallback(async () => {
        if (!serverId) return;

        try {
            const queue = await queryClient.fetchQuery(
                songsQueries.getQueue({ query: {}, serverId }),
            );

            if (queue) {
                player.setQueue(
                    queue.entry,
                    queue.currentIndex,
                    queue.positionMs !== undefined ? queue.positionMs / 1000 : undefined,
                );
            }
        } catch (error) {
            toast.error({
                message: (error as Error).message,
                title: t('error.genericError'),
            });
        }
    }, [player, queryClient, serverId]);

    return handleRestoreQueue;
};
