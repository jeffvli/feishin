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
    allowDuplicates: boolean;
    currentSong: QueueSong;
    itemCount: number;
    musicFolderId: string | string[] | undefined;
    onlySimilar: boolean;
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

const isSongAvailable = (
    song: Song,
    allowDuplicates: boolean,
    queueSongIdSet: Set<string>,
    selectedSongIds: Set<string>,
) => {
    if (allowDuplicates) {
        return true;
    }

    return !queueSongIdSet.has(song.id) && !selectedSongIds.has(song.id);
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

    const pool = randomSongs.items.filter(
        (song) => args.allowDuplicates || !args.queueSongIdSet.has(song.id),
    );
    const shuffled = shuffleInPlace(pool);
    return shuffled.slice(0, args.itemCount);
};

const collectSongsSimilar = async (args: AutoDjSongCollectArgs): Promise<Song[]> => {
    const selected: Song[] = [];
    const selectedSongIds = new Set<string>();
    const remainingCount = () => args.itemCount - selected.length;

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

        const slotsToFill = remainingCount();
        const shuffledSimilarSongs = shuffleInPlace(
            similarSongs.filter((song) =>
                isSongAvailable(song, args.allowDuplicates, args.queueSongIdSet, selectedSongIds),
            ),
        );

        for (const song of shuffledSimilarSongs.slice(0, slotsToFill)) {
            selectedSongIds.add(song.id);
            selected.push(song);
        }

        if (args.onlySimilar && selected.length > 0) {
            return selected;
        }
    }

    if (remainingCount() > 0) {
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

            if (!args.trySimilarSongs) {
                const randomSongCount = Math.max(1, Math.ceil(genreLimit * 0.2));

                const randomSongs = await args.queryClient.fetchQuery({
                    ...songsQueries.random({
                        query: { limit: randomSongCount, played: Played.All },
                        serverId: args.serverId,
                    }),
                });

                const spiceSlotsToFill = Math.min(randomSongCount, remainingCount());
                const shuffledSpiceSongs = shuffleInPlace(
                    randomSongs.items.filter((song) =>
                        isSongAvailable(
                            song,
                            args.allowDuplicates,
                            args.queueSongIdSet,
                            selectedSongIds,
                        ),
                    ),
                );

                for (const song of shuffledSpiceSongs.slice(0, spiceSlotsToFill)) {
                    selectedSongIds.add(song.id);
                    selected.push(song);
                }
            }

            const genreSlotsToFill = remainingCount();
            const shuffledGenreSongs = shuffleInPlace(
                genreSimilarSongs.items.filter((song) =>
                    isSongAvailable(
                        song,
                        args.allowDuplicates,
                        args.queueSongIdSet,
                        selectedSongIds,
                    ),
                ),
            );

            for (const song of shuffledGenreSongs.slice(0, genreSlotsToFill)) {
                selectedSongIds.add(song.id);
                selected.push(song);
            }

            if (args.onlySimilar && selected.length > 0) {
                return selected;
            }
        }
    }

    if (remainingCount() > 0) {
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

            const artistSlotsToFill = remainingCount();
            const shuffledArtistSongs = shuffleInPlace(
                albumArtistSimilarSongs.items.filter((song) =>
                    isSongAvailable(
                        song,
                        args.allowDuplicates,
                        args.queueSongIdSet,
                        selectedSongIds,
                    ),
                ),
            );

            for (const song of shuffledArtistSongs.slice(0, artistSlotsToFill)) {
                selectedSongIds.add(song.id);
                selected.push(song);
            }

            if (args.onlySimilar && selected.length > 0) {
                return selected;
            }
        }
    }

    if (remainingCount() > 0) {
        const randomSongs = await args.queryClient.fetchQuery({
            ...songsQueries.random({
                query: { limit: 50, played: Played.All },
                serverId: args.serverId,
            }),
        });

        const randomSlotsToFill = remainingCount();
        const shuffledRandomSongs = shuffleInPlace(
            randomSongs.items.filter((song) =>
                isSongAvailable(song, args.allowDuplicates, args.queueSongIdSet, selectedSongIds),
            ),
        );

        for (const song of shuffledRandomSongs.slice(0, randomSlotsToFill)) {
            selectedSongIds.add(song.id);
            selected.push(song);
        }
    }

    return selected;
};
