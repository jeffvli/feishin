import type { QueryClient } from '@tanstack/react-query';

import { queryKeys } from '/@/renderer/api/query-keys';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { AUTO_DJ_STRATEGY, type AutoDJStrategy } from '/@/renderer/store/settings.store';
import { shuffleInPlace } from '/@/renderer/utils/shuffle';
import {
    Played,
    type QueueSong,
    type ServerListItem,
    Song,
    SongListSort,
    SortOrder,
} from '/@/shared/types/domain-types';

export type AutoDjSongCollectArgs = {
    currentSong: QueueSong;
    itemCount: number;
    musicFolderId: string | string[] | undefined;
    queryClient: QueryClient;
    queueSongIdSet: Set<string>;
    server: null | ServerListItem | undefined;
    serverId: string;
    songStrategy: AutoDJStrategy;
    trySimilarSongs: boolean;
};

export const runAutoDjSongs = async (args: AutoDjSongCollectArgs): Promise<Song[]> => {
    switch (args.songStrategy) {
        case AUTO_DJ_STRATEGY.LIBRARY_RANDOM: {
            return collectSongsLibraryRandom(args);
        }
        default: {
            return collectSongsSimilar(args);
        }
    }
};

const collectSongsLibraryRandom = async (args: AutoDjSongCollectArgs): Promise<Song[]> => {
    const randomSongs = await args.queryClient.fetchQuery({
        ...songsQueries.random({
            query: {
                limit: Math.max(args.itemCount * 3, 50),
                played: Played.All,
            },
            serverId: args.serverId,
        }),
        queryKey: queryKeys.player.fetch({ autoDjLibraryRandomSongs: args.currentSong.id }),
    });

    const pool = randomSongs.items.filter((song) => !args.queueSongIdSet.has(song.id));
    const shuffled = shuffleInPlace(pool);
    return shuffled.slice(0, args.itemCount);
};

const collectSongsSimilar = async (args: AutoDjSongCollectArgs): Promise<Song[]> => {
    let uniqueSimilarSongs: Song[] = [];

    if (args.trySimilarSongs) {
        const similarSongs = await args.queryClient.fetchQuery({
            ...songsQueries.similar({
                query: {
                    count: args.itemCount,
                    songId: args.currentSong?.id,
                },
                serverId: args.serverId,
            }),
            queryKey: queryKeys.player.fetch({ similarSongs: args.currentSong?.id }),
        });

        uniqueSimilarSongs = similarSongs.filter((song) => !args.queueSongIdSet.has(song.id));
    }

    if (uniqueSimilarSongs.length < args.itemCount) {
        const genre = args.currentSong?.genres?.[0];

        if (genre) {
            const genreLimit = 50;
            const genreSimilarSongs = await args.queryClient.fetchQuery({
                ...songsQueries.random({
                    query: {
                        genre: genre.id,
                        limit: genreLimit,
                        played: Played.All,
                    },
                    serverId: args.serverId,
                }),
                queryKey: queryKeys.player.fetch({
                    genre,
                    similarSongs: args.currentSong?.id,
                }),
            });

            const genreSongs = genreSimilarSongs.items.filter(
                (song) => !args.queueSongIdSet.has(song.id),
            );

            if (!args.trySimilarSongs) {
                const randomSongCount = Math.max(1, Math.ceil(genreLimit * 0.2));

                const randomSongs = await args.queryClient.fetchQuery({
                    ...songsQueries.random({
                        query: { limit: randomSongCount, played: Played.All },
                        serverId: args.serverId,
                    }),
                });

                const uniqueRandomSongs = randomSongs.items.filter(
                    (song) => !args.queueSongIdSet.has(song.id),
                );

                const randomSongsToAdd = uniqueRandomSongs.slice(0, randomSongCount);
                uniqueSimilarSongs.push(...randomSongsToAdd, ...genreSongs);
            } else {
                uniqueSimilarSongs.push(...genreSongs);
            }
        }
    }

    if (uniqueSimilarSongs.length < args.itemCount) {
        const albumArtist = args.currentSong?.albumArtists?.[0];

        if (albumArtist) {
            const albumArtistSimilarSongs = await args.queryClient.fetchQuery({
                ...songsQueries.list({
                    query: {
                        albumArtistIds: [albumArtist.id],
                        limit: 50,
                        sortBy: SongListSort.RANDOM,
                        sortOrder: SortOrder.ASC,
                        startIndex: 0,
                    },
                    serverId: args.serverId,
                }),
                queryKey: queryKeys.player.fetch({
                    albumArtist,
                    similarSongs: args.currentSong?.id,
                }),
            });

            uniqueSimilarSongs.push(
                ...albumArtistSimilarSongs.items.filter(
                    (song) => !args.queueSongIdSet.has(song.id),
                ),
            );
        }
    }

    if (uniqueSimilarSongs.length < args.itemCount) {
        const randomSongs = await args.queryClient.fetchQuery({
            ...songsQueries.random({
                query: { limit: 50, played: Played.All },
                serverId: args.serverId,
            }),
        });

        uniqueSimilarSongs.push(
            ...randomSongs.items.filter((song) => !args.queueSongIdSet.has(song.id)),
        );
    }

    const shuffledSongs = shuffleInPlace(uniqueSimilarSongs);
    return shuffledSongs.slice(0, args.itemCount);
};
