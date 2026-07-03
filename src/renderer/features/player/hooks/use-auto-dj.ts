import { useQueryClient } from '@tanstack/react-query';
import React, { useEffect } from 'react';

import { eventEmitter } from '/@/renderer/events/event-emitter';
import { runAutoDjAlbumIds } from '/@/renderer/features/player/auto-dj/auto-dj-albums';
import { runAutoDjSongs } from '/@/renderer/features/player/auto-dj/auto-dj-songs';
import { useIsPlayerFetching, usePlayer } from '/@/renderer/features/player/context/player-context';
import {
    AUTO_DJ_STRATEGY,
    isShuffleEnabled,
    mapShuffledToQueueIndex,
    useAutoDJSettings,
    useCurrentServer,
    useCurrentServerId,
    usePlayerStore,
    usePlayerStoreBase,
    useSettingsStore,
} from '/@/renderer/store';
import { LogCategory, logFn } from '/@/renderer/utils/logger';
import { logMsg } from '/@/renderer/utils/logger-message';
import { hasFeature } from '/@/shared/api/utils';
import { LibraryItem } from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';
import { Play } from '/@/shared/types/types';

export const useAutoDJ = () => {
    const queryClient = useQueryClient();
    const serverId = useCurrentServerId();
    const server = useCurrentServer();
    const player = usePlayer();
    const settings = useAutoDJSettings();
    const isFetching = useIsPlayerFetching();

    const hasSimilarSongsMusicFolder = hasFeature(server, ServerFeature.SIMILAR_SONGS_MUSIC_FOLDER);

    useEffect(() => {
        const albumStrategy = settings.albumStrategy ?? AUTO_DJ_STRATEGY.SIMILAR;
        const songStrategy = settings.songStrategy ?? AUTO_DJ_STRATEGY.SIMILAR;

        const unsubscribe = usePlayerStoreBase.subscribe(
            (state) => {
                const queue = state.getQueue();
                let index = state.player.index;
                let remaining: number;

                if (isShuffleEnabled(state)) {
                    remaining = state.queue.shuffled.length - index - 1;
                    index = mapShuffledToQueueIndex(index, state.queue.shuffled);
                } else {
                    remaining = queue.items.slice(index + 1).length;
                }

                return { index, remaining, song: queue.items[index] };
            },
            async (properties) => {
                if (!settings.enabled) {
                    return;
                }

                if (!properties.song?.id) {
                    return;
                }

                if (properties.remaining >= settings.timing) {
                    return;
                }

                logFn.debug(logMsg[LogCategory.PLAYER].autoPlayTriggered, {
                    category: LogCategory.PLAYER,
                    meta: { remaining: properties.remaining, songId: properties.song?.id },
                });

                try {
                    const queue = usePlayerStore.getState().getQueue();

                    const hasMusicFolder = server?.musicFolderId && server.musicFolderId.length > 0;
                    const musicFolderId =
                        hasMusicFolder && server?.musicFolderId ? server.musicFolderId : undefined;
                    const trySimilarSongs =
                        !hasMusicFolder || (hasMusicFolder && hasSimilarSongsMusicFolder);

                    const runnerDepsBase = {
                        itemCount: settings.itemCount,
                        musicFolderId,
                        queryClient,
                        server,
                        serverId,
                        trySimilarSongs,
                    };

                    if (settings.mode === 'albums') {
                        if (!serverId) {
                            return;
                        }

                        const queueAlbumIdSet = new Set(
                            queue.items
                                .map((item) => item.albumId)
                                .filter((id): id is string => Boolean(id)),
                        );

                        const albumsToAdd = await runAutoDjAlbumIds({
                            ...runnerDepsBase,
                            albumStrategy,
                            currentSong: properties.song,
                            queueAlbumIdSet,
                        });

                        if (albumsToAdd.length > 0) {
                            await player.addToQueueByFetch(
                                serverId,
                                albumsToAdd,
                                LibraryItem.ALBUM,
                                Play.LAST,
                            );

                            eventEmitter.emit('AUTODJ_QUEUE_ADDED', {
                                songCount: albumsToAdd.length,
                            });
                        }

                        return;
                    }

                    if (!serverId) {
                        return;
                    }

                    const queueSongIdSet = new Set(queue.items.map((item) => item.id));

                    const songsToAdd = await runAutoDjSongs({
                        ...runnerDepsBase,
                        currentSong: properties.song,
                        queueSongIdSet,
                        songStrategy,
                    });

                    if (songsToAdd.length > 0) {
                        player.addToQueueByData(songsToAdd, Play.LAST);

                        eventEmitter.emit('AUTODJ_QUEUE_ADDED', {
                            songCount: songsToAdd.length,
                        });
                    }
                } catch (error) {
                    logFn.error(logMsg[LogCategory.PLAYER].autoPlayFailed, {
                        category: LogCategory.PLAYER,
                        meta: { error: (error as Error).message, songId: properties.song?.id },
                    });
                }
            },
            {
                equalityFn: (a, b) => {
                    return a.song?._uniqueId === b.song?._uniqueId && a.remaining === b.remaining;
                },
            },
        );

        return () => unsubscribe();
    }, [
        hasSimilarSongsMusicFolder,
        isFetching,
        player,
        queryClient,
        server,
        serverId,
        settings.enabled,
        settings.albumStrategy,
        settings.itemCount,
        settings.mode,
        settings.songStrategy,
        settings.timing,
    ]);
};

const AutoDJHookInner = () => {
    useAutoDJ();
    return null;
};

export const AutoDJHook = () => {
    const isAutoDJEnabled = useSettingsStore((state) => state.autoDJ.enabled);

    if (!isAutoDJEnabled) {
        return null;
    }

    return React.createElement(AutoDJHookInner);
};
