import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { queryKeys } from '/@/renderer/api/query-keys';
import { eventEmitter } from '/@/renderer/events/event-emitter';
import { useIsPlayerFetching, usePlayer } from '/@/renderer/features/player/context/player-context';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import {
    isShuffleEnabled,
    mapShuffledToQueueIndex,
    useAutoDJSettings,
    useCurrentServer,
    useCurrentServerId,
    usePlayerStore,
    usePlayerStoreBase,
} from '/@/renderer/store';
import { LogCategory, logFn } from '/@/renderer/utils/logger';
import { logMsg } from '/@/renderer/utils/logger-message';
import { shuffleInPlace } from '/@/renderer/utils/shuffle';
import { hasFeature } from '/@/shared/api/utils';
import { Played, Song, SongListSort, SortOrder } from '/@/shared/types/domain-types';
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

                // If no current song, don't autoplay
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
                    const queueSongIdSet = new Set(queue.items.map((item) => item.id));
                    let uniqueSimilarSongs: Song[] = [];

                    const hasMusicFolder = server?.musicFolderId && server.musicFolderId.length > 0;
                    const trySimilarSongs =
                        !hasMusicFolder || (hasMusicFolder && hasSimilarSongsMusicFolder);

                    // Skip similar songs fetch if a music folder is selected and does not support musicFolderId on similar songs
                    if (trySimilarSongs) {
                        // First, try to fetch similar songs based on the current song
                        const similarSongs = await queryClient.fetchQuery({
                            ...songsQueries.similar({
                                query: {
                                    count: settings.itemCount,
                                    songId: properties.song?.id,
                                },
                                serverId,
                            }),
                            queryKey: queryKeys.player.fetch({ similarSongs: properties.song?.id }),
                        });

                        uniqueSimilarSongs = similarSongs.filter(
                            (song) => !queueSongIdSet.has(song.id),
                        );
                    }

                    // If not enough songs, try to fetch more similar songs based on the genre of the current song
                    if (uniqueSimilarSongs.length < settings.itemCount) {
                        const genre = properties.song?.genres?.[0];

                        if (genre) {
                            const genreLimit = 50;
                            const genreSimilarSongs = await queryClient.fetchQuery({
                                ...songsQueries.random({
                                    query: {
                                        genre: genre.id,
                                        limit: genreLimit,
                                        played: Played.All,
                                    },
                                    serverId,
                                }),
                                queryKey: queryKeys.player.fetch({
                                    genre,
                                    similarSongs: properties.song?.id,
                                }),
                            });

                            const genreSongs = genreSimilarSongs.items.filter(
                                (song) => !queueSongIdSet.has(song.id),
                            );

                            // If trySimilarSongs is false, add variation by mixing in random songs
                            if (!trySimilarSongs) {
                                // Calculate how many random songs we need: 20% or at least 1
                                const randomSongCount = Math.max(1, Math.ceil(genreLimit * 0.2));

                                const randomSongs = await queryClient.fetchQuery({
                                    ...songsQueries.random({
                                        query: { limit: randomSongCount, played: Played.All },
                                        serverId,
                                    }),
                                });

                                const uniqueRandomSongs = randomSongs.items.filter(
                                    (song) => !queueSongIdSet.has(song.id),
                                );

                                // Add minimum required random songs for variation
                                const randomSongsToAdd = uniqueRandomSongs.slice(
                                    0,
                                    randomSongCount,
                                );
                                uniqueSimilarSongs.push(...randomSongsToAdd, ...genreSongs);
                            } else {
                                uniqueSimilarSongs.push(...genreSongs);
                            }
                        }
                    }

                    // If not enough songs, try to fetch more similar songs based on the album artist of the current song
                    if (uniqueSimilarSongs.length < settings.itemCount) {
                        const albumArtist = properties.song?.albumArtists?.[0];

                        if (albumArtist) {
                            const albumArtistSimilarSongs = await queryClient.fetchQuery({
                                ...songsQueries.list({
                                    query: {
                                        albumArtistIds: [albumArtist.id],
                                        limit: 50,
                                        sortBy: SongListSort.RANDOM,
                                        sortOrder: SortOrder.ASC,
                                        startIndex: 0,
                                    },
                                    serverId,
                                }),
                                queryKey: queryKeys.player.fetch({
                                    albumArtist,
                                    similarSongs: properties.song?.id,
                                }),
                            });

                            uniqueSimilarSongs.push(
                                ...albumArtistSimilarSongs.items.filter(
                                    (song) => !queueSongIdSet.has(song.id),
                                ),
                            );
                        }
                    }

                    // If not enough songs, just fetch fully random songs
                    if (uniqueSimilarSongs.length < settings.itemCount) {
                        const randomSongs = await queryClient.fetchQuery({
                            ...songsQueries.random({
                                query: { limit: 50, played: Played.All },
                                serverId,
                            }),
                        });

                        uniqueSimilarSongs.push(
                            ...randomSongs.items.filter((song) => !queueSongIdSet.has(song.id)),
                        );
                    }

                    // Shuffle the songs and then add to the queue
                    const shuffledSongs = shuffleInPlace(uniqueSimilarSongs);

                    // Splice the first itemCount songs and add to the queue
                    const songsToAdd = shuffledSongs.slice(0, settings.itemCount);

                    // Add to the end of the queue
                    player.addToQueueByData(songsToAdd, Play.LAST);

                    // Emit event to trigger queue follow
                    eventEmitter.emit('AUTODJ_QUEUE_ADDED', {
                        songCount: songsToAdd.length,
                    });
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
        settings.itemCount,
        settings.timing,
    ]);
};
