import type { QueryClient } from '@tanstack/react-query';

import { autoDjGenreIdsForSongGenre, autoDjPushUniqueAlbumIds } from './auto-dj-utils';

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
    currentSong: QueueSong;
    itemCount: number;
    musicFolderId: string | string[] | undefined;
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

    const ids = page.items.map((a) => a.id).filter((id) => id && !args.queueAlbumIdSet.has(id));
    return shuffle(ids).slice(0, args.itemCount);
};

const collectAlbumsSimilar = async (args: AutoDjAlbumCollectArgs): Promise<string[]> => {
    const targetAlbumCount = args.itemCount;
    const candidateAlbumIds: string[] = [];
    const seenAlbumCandidates = new Set<string>();

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

        autoDjPushUniqueAlbumIds(
            candidateAlbumIds,
            seenAlbumCandidates,
            args.queueAlbumIdSet,
            ...similarSongsFromSimilarApi.map((s) => s.albumId),
        );
    }

    if (candidateAlbumIds.length < targetAlbumCount && args.currentSong && args.server) {
        const genre = args.currentSong.genres?.[0];
        if (genre) {
            const genreIds = autoDjGenreIdsForSongGenre(genre, args.server.type);

            const genreAlbums = await args.queryClient.fetchQuery({
                ...albumQueries.list({
                    query: {
                        genreIds,
                        limit: 50,
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

            autoDjPushUniqueAlbumIds(
                candidateAlbumIds,
                seenAlbumCandidates,
                args.queueAlbumIdSet,
                ...genreAlbums.items.map((album) => album.id),
            );

            if (!args.trySimilarSongs) {
                const randomAlbumMixCount = Math.max(1, Math.ceil(50 * 0.2));
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

                autoDjPushUniqueAlbumIds(
                    candidateAlbumIds,
                    seenAlbumCandidates,
                    args.queueAlbumIdSet,
                    ...randomAlbumsMix.items.map((album) => album.id),
                );
            }
        }
    }

    if (candidateAlbumIds.length < targetAlbumCount && args.currentSong) {
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

            autoDjPushUniqueAlbumIds(
                candidateAlbumIds,
                seenAlbumCandidates,
                args.queueAlbumIdSet,
                ...albumsByArtist.items.map((album) => album.id),
            );
        }
    }

    if (candidateAlbumIds.length < targetAlbumCount && args.currentSong) {
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

        autoDjPushUniqueAlbumIds(
            candidateAlbumIds,
            seenAlbumCandidates,
            args.queueAlbumIdSet,
            ...randomAlbumsFallback.items.map((album) => album.id),
        );
    }

    const shuffledAlbums = shuffle(candidateAlbumIds);
    return shuffledAlbums.slice(0, targetAlbumCount);
};
