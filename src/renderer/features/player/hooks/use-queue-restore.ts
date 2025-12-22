import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useCallback } from 'react';

import { api } from '/@/renderer/api';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import {
    setTimestamp,
    useCurrentServerId,
    usePlayerStore,
    useTimestampStoreBase,
} from '/@/renderer/store';
import { toast } from '/@/shared/components/toast/toast';

export const useQueueRestoreTimestamp = () => {
    const player = usePlayerStore();

    usePlayerEvents(
        {
            onQueueRestored: (properties) => {
                const { position } = properties;

                setTimeout(() => {
                    setTimestamp(position);
                    player.mediaSeekToTimestamp(position);
                }, 100);
            },
        },
        [],
    );
};

export const useSaveQueue = () => {
    const serverId = useCurrentServerId();

    const mutation = useMutation({
        mutationFn: async () => {
            if (!serverId) {
                throw new Error(t('error.serverRequired', { postProcess: 'sentenceCase' }));
            }

            const { player, queue } = usePlayerStore.getState();
            let uniqueIds: string[] = [];

            if (queue.shuffled.length > 0) {
                for (const shuffledIndex of queue.shuffled) {
                    uniqueIds.push(queue.default[shuffledIndex]);
                }
            } else {
                uniqueIds = queue.default;
            }

            const songs: string[] = [];

            if (uniqueIds.length > 0) {
                for (const song of uniqueIds) {
                    if (queue.songs[song]._serverId !== serverId) {
                        toast.error({
                            message: t('error.multipleServerSaveQueueError', {
                                postProcess: 'sentenceCase',
                            }),
                            title: t('error.genericError', { postProcess: 'sentenceCase' }),
                        });

                        throw new Error(
                            `${t('error.multipleServerSaveQueueError', { postProcess: 'sentenceCase' })}`,
                        );
                    }

                    songs?.push(queue.songs[song].id);
                }
            }

            try {
                await api.controller.savePlayQueue({
                    apiClientProps: { serverId },
                    query: {
                        currentIndex: queue.default.length > 0 ? player.index : undefined,
                        positionMs: useTimestampStoreBase.getState().timestamp * 1000,
                        songs,
                    },
                });

                toast.success({
                    message: '',
                    title: t('form.saveQueue.success', { postProcess: 'sentenceCase' }),
                });
            } catch (error) {
                toast.error({
                    message: (error as Error).message,
                    title: t('error.saveQueueFailed', { postProcess: 'sentenceCase' }),
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
                title: t('error.genericError', { postProcess: 'sentenceCase' }),
            });
        }
    }, [player, queryClient, serverId]);

    return handleRestoreQueue;
};
