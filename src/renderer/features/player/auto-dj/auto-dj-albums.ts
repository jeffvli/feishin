import type { QueryClient } from '@tanstack/react-query';

import { autoDjGenreIdsForSongGenre } from './auto-dj-utils';

import { queryKeys } from '/@/renderer/api/query-keys';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { AUTO_DJ_STRATEGY, type AutoDJStrategy } from '/@/renderer/store/settings.store';
import { shuffle } from '/@/renderer/utils/shuffle';
import {
    AlbumListSort,
    type QueueSong,
    type ServerListItem,
    SortOrder,
} from '/@/shared/types/domain-types';

export type AutoDjAlbumCollectArgs = {
    albumStrategy: AutoDJStrategy;
    allowDuplicates: boolean;
    currentSong: QueueSong;
    itemCount: number;
    musicFolderId: string | string[] | undefined;
    onlySimilar: boolean;
    queryClient: QueryClient;
    queueAlbumIdSet: Set<string>;
    server: null | ServerListItem | undefined;
    serverId: string;
    trySimilarSongs: boolean;
};

export const runAutoDjAlbumIds = async (args: AutoDjAlbumCollectArgs): Promise<string[]> => {
    switch (args.albumStrategy) {
        case AUTO_DJ_STRATEGY.LIBRARY_RANDOM: {
            return collectAlbumsLibraryRandom(args);
        }
        default: {
            return collectAlbumsSimilar(args);
        }
    }
};

const isAlbumIdAvailable = (
    albumId: string,
    allowDuplicates: boolean,
    queueAlbumIdSet: Set<string>,
    selectedAlbumIdSet: Set<string>,
) => {
    if (allowDuplicates) {
        return true;
    }

    return !queueAlbumIdSet.has(albumId) && !selectedAlbumIdSet.has(albumId);
};

const collectAlbumsLibraryRandom = async (args: AutoDjAlbumCollectArgs): Promise<string[]> => {
    const page = await args.queryClient.fetchQuery({
        ...albumQueries.list({
            query: {
                limit: Math.max(args.itemCount, 1),
                musicFolderId: args.musicFolderId,
                sortBy: AlbumListSort.RANDOM,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            },
            serverId: args.serverId,
        }),
        queryKey: queryKeys.player.fetch({ autoDjAlbumLibraryRandom: args.currentSong?.id }),
    });

    const ids = page.items
        .map((album) => album.id)
        .filter(
            (albumId) => albumId && (args.allowDuplicates || !args.queueAlbumIdSet.has(albumId)),
        );
    return shuffle(ids).slice(0, args.itemCount);
};

const collectAlbumsSimilar = async (args: AutoDjAlbumCollectArgs): Promise<string[]> => {
    const selectedAlbumIds: string[] = [];
    const selectedAlbumIdSet = new Set<string>();
    const remainingCount = () => args.itemCount - selectedAlbumIds.length;

    if (args.trySimilarSongs && args.currentSong?.id) {
        const similarSongsFromSimilarApi = await args.queryClient.fetchQuery({
            ...songsQueries.similar({
                query: {
                    count: args.itemCount * 4,
                    songId: args.currentSong.id,
                },
                serverId: args.serverId,
            }),
            queryKey: queryKeys.player.fetch({
                similarSongAlbumDj: args.currentSong.id,
            }),
        });

        const similarSlotsToFill = remainingCount();
        const shuffledSimilarAlbumIds = shuffle(
            similarSongsFromSimilarApi
                .map((song) => song.albumId)
                .filter((albumId): albumId is string => {
                    if (!albumId) {
                        return false;
                    }

                    return isAlbumIdAvailable(
                        albumId,
                        args.allowDuplicates,
                        args.queueAlbumIdSet,
                        selectedAlbumIdSet,
                    );
                }),
        );

        for (const albumId of shuffledSimilarAlbumIds.slice(0, similarSlotsToFill)) {
            selectedAlbumIdSet.add(albumId);
            selectedAlbumIds.push(albumId);
        }

        if (args.onlySimilar && selectedAlbumIds.length > 0) {
            return selectedAlbumIds;
        }
    }

    if (remainingCount() > 0 && args.currentSong && args.server) {
        const genre = args.currentSong.genres?.[0];

        if (genre) {
            const genreIds = autoDjGenreIdsForSongGenre(genre, args.server.type);
            const genreLimit = 50;

            const genreAlbums = await args.queryClient.fetchQuery({
                ...albumQueries.list({
                    query: {
                        genreIds,
                        limit: genreLimit,
                        musicFolderId: args.musicFolderId,
                        sortBy: AlbumListSort.RANDOM,
                        sortOrder: SortOrder.ASC,
                        startIndex: 0,
                    },
                    serverId: args.serverId,
                }),
                queryKey: queryKeys.player.fetch({
                    genreAlbumDj: genreIds,
                    song: args.currentSong.id,
                }),
            });

            if (!args.trySimilarSongs) {
                const randomAlbumMixCount = Math.max(1, Math.ceil(genreLimit * 0.2));
                const randomAlbumsMix = await args.queryClient.fetchQuery({
                    ...albumQueries.list({
                        query: {
                            limit: randomAlbumMixCount,
                            musicFolderId: args.musicFolderId,
                            sortBy: AlbumListSort.RANDOM,
                            sortOrder: SortOrder.ASC,
                            startIndex: 0,
                        },
                        serverId: args.serverId,
                    }),
                    queryKey: queryKeys.player.fetch({
                        genreAlbumDjMixRandom: args.currentSong.id,
                    }),
                });

                const spiceSlotsToFill = Math.min(randomAlbumMixCount, remainingCount());
                const shuffledSpiceAlbumIds = shuffle(
                    randomAlbumsMix.items
                        .map((album) => album.id)
                        .filter(
                            (albumId): albumId is string =>
                                Boolean(albumId) &&
                                isAlbumIdAvailable(
                                    albumId,
                                    args.allowDuplicates,
                                    args.queueAlbumIdSet,
                                    selectedAlbumIdSet,
                                ),
                        ),
                );

                for (const albumId of shuffledSpiceAlbumIds.slice(0, spiceSlotsToFill)) {
                    selectedAlbumIdSet.add(albumId);
                    selectedAlbumIds.push(albumId);
                }
            }

            const genreSlotsToFill = remainingCount();
            const shuffledGenreAlbumIds = shuffle(
                genreAlbums.items
                    .map((album) => album.id)
                    .filter(
                        (albumId): albumId is string =>
                            Boolean(albumId) &&
                            isAlbumIdAvailable(
                                albumId,
                                args.allowDuplicates,
                                args.queueAlbumIdSet,
                                selectedAlbumIdSet,
                            ),
                    ),
            );

            for (const albumId of shuffledGenreAlbumIds.slice(0, genreSlotsToFill)) {
                selectedAlbumIdSet.add(albumId);
                selectedAlbumIds.push(albumId);
            }

            if (args.onlySimilar && selectedAlbumIds.length > 0) {
                return selectedAlbumIds;
            }
        }
    }

    if (remainingCount() > 0 && args.currentSong) {
        const albumArtist = args.currentSong.albumArtists?.[0];

        if (albumArtist) {
            const albumsByArtist = await args.queryClient.fetchQuery({
                ...albumQueries.list({
                    query: {
                        artistIds: [albumArtist.id],
                        limit: 50,
                        musicFolderId: args.musicFolderId,
                        sortBy: AlbumListSort.RANDOM,
                        sortOrder: SortOrder.ASC,
                        startIndex: 0,
                    },
                    serverId: args.serverId,
                }),
                queryKey: queryKeys.player.fetch({
                    artistAlbumDj: albumArtist.id,
                    song: args.currentSong.id,
                }),
            });

            const artistSlotsToFill = remainingCount();
            const shuffledArtistAlbumIds = shuffle(
                albumsByArtist.items
                    .map((album) => album.id)
                    .filter(
                        (albumId): albumId is string =>
                            Boolean(albumId) &&
                            isAlbumIdAvailable(
                                albumId,
                                args.allowDuplicates,
                                args.queueAlbumIdSet,
                                selectedAlbumIdSet,
                            ),
                    ),
            );

            for (const albumId of shuffledArtistAlbumIds.slice(0, artistSlotsToFill)) {
                selectedAlbumIdSet.add(albumId);
                selectedAlbumIds.push(albumId);
            }

            if (args.onlySimilar && selectedAlbumIds.length > 0) {
                return selectedAlbumIds;
            }
        }
    }

    if (remainingCount() > 0 && args.currentSong) {
        const randomAlbumsFallback = await args.queryClient.fetchQuery({
            ...albumQueries.list({
                query: {
                    limit: 80,
                    musicFolderId: args.musicFolderId,
                    sortBy: AlbumListSort.RANDOM,
                    sortOrder: SortOrder.ASC,
                    startIndex: 0,
                },
                serverId: args.serverId,
            }),
            queryKey: queryKeys.player.fetch({
                fallbackAlbumDj: args.currentSong.id,
            }),
        });

        const randomSlotsToFill = remainingCount();
        const shuffledRandomAlbumIds = shuffle(
            randomAlbumsFallback.items
                .map((album) => album.id)
                .filter(
                    (albumId): albumId is string =>
                        Boolean(albumId) &&
                        isAlbumIdAvailable(
                            albumId,
                            args.allowDuplicates,
                            args.queueAlbumIdSet,
                            selectedAlbumIdSet,
                        ),
                ),
        );

        for (const albumId of shuffledRandomAlbumIds.slice(0, randomSlotsToFill)) {
            selectedAlbumIdSet.add(albumId);
            selectedAlbumIds.push(albumId);
        }
    }

    return selectedAlbumIds;
};
