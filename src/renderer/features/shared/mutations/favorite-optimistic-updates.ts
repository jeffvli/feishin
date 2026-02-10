import { QueryClient } from '@tanstack/react-query';

import { queryKeys } from '/@/renderer/api/query-keys';
import { infiniteLoaderDataQueryKey } from '/@/renderer/components/item-list/helpers/item-list-infinite-loader';
import {
    Album,
    AlbumArtist,
    AlbumArtistDetailResponse,
    AlbumArtistListResponse,
    AlbumDetailResponse,
    AlbumListResponse,
    ArtistListResponse,
    FavoriteArgs,
    LibraryItem,
    PlaylistSongListResponse,
    Song,
    SongDetailResponse,
    SongListResponse,
    TopSongListResponse,
} from '/@/shared/types/domain-types';

export interface PreviousQueryData {
    data: unknown;
    queryKey: readonly unknown[];
}

interface PendingUpdate {
    previousData: unknown;
    queryKey: readonly unknown[];
    updater: (prev: any) => any;
}

function collectAndApplyUpdates(
    queryClient: QueryClient,
    pendingUpdates: PendingUpdate[],
): PreviousQueryData[] {
    const previousQueries: PreviousQueryData[] = [];

    pendingUpdates.forEach(({ previousData, queryKey, updater }) => {
        previousQueries.push({ data: previousData, queryKey });
        queryClient.setQueryData(queryKey, updater);
    });

    return previousQueries;
}

function updateItemInArray<T extends { id: string }>(
    items: T[],
    itemIdSet: Set<string>,
    updater: (item: T) => T,
): null | T[] {
    let hasChanges = false;
    const updatedItems = items.map((item) => {
        if (itemIdSet.has(item.id)) {
            hasChanges = true;
            return updater(item);
        }
        return item;
    });

    return hasChanges ? updatedItems : null;
}

function updateItemsInPages<T extends { id: string }, P extends { items: T[] }>(
    pages: P[],
    itemIdSet: Set<string>,
    updater: (item: T) => T,
): null | P[] {
    let hasChanges = false;
    const updatedPages = pages.map((page) => {
        if (!page) return page;
        const updatedItems = updateItemInArray(page.items, itemIdSet, updater);
        if (updatedItems) {
            hasChanges = true;
            return { ...page, items: updatedItems };
        }
        return page;
    });

    return hasChanges ? updatedPages : null;
}

export const applyFavoriteOptimisticUpdates = (
    queryClient: QueryClient,
    variables: FavoriteArgs,
    isFavorite: boolean,
): PreviousQueryData[] => {
    const pendingUpdates: PendingUpdate[] = [];
    const itemIdSet = new Set<string>();

    if (Array.isArray(variables.query.id)) {
        variables.query.id.forEach((id) => {
            itemIdSet.add(id);
        });
    } else {
        itemIdSet.add(variables.query.id);
    }

    const createFavoriteUpdater = <T extends { userFavorite?: boolean }>(item: T): T => ({
        ...item,
        userFavorite: isFavorite,
    });

    switch (variables.query.type) {
        case LibraryItem.ALBUM: {
            const detailQueryKey = queryKeys.albums.detail(variables.apiClientProps.serverId);
            const detailQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: detailQueryKey,
            });

            detailQueries.forEach(([queryKey, data]) => {
                if (data) {
                    pendingUpdates.push({
                        previousData: data,
                        queryKey,
                        updater: (prev: AlbumDetailResponse | undefined) => {
                            if (prev && itemIdSet.has(prev.id)) {
                                return { ...prev, userFavorite: isFavorite };
                            }
                            return prev;
                        },
                    });
                }
            });

            const listQueryKey = queryKeys.albums.list(variables.apiClientProps.serverId);
            const listQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: listQueryKey,
            });

            listQueries.forEach(([queryKey, data]) => {
                if (data) {
                    pendingUpdates.push({
                        previousData: data,
                        queryKey,
                        updater: (current: AlbumListResponse | undefined) => {
                            if (!current) return current;
                            const updatedItems = updateItemInArray(
                                current.items,
                                itemIdSet,
                                (item) => createFavoriteUpdater<Album>(item),
                            );
                            return updatedItems ? { ...current, items: updatedItems } : current;
                        },
                    });
                }
            });

            const infiniteListQueryKey = queryKeys.albums.infiniteList(
                variables.apiClientProps.serverId,
            );
            const infiniteListQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: infiniteListQueryKey,
            });

            const homeQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: ['home', 'album'],
            });

            infiniteListQueries.concat(homeQueries).forEach(([queryKey, data]) => {
                if (data) {
                    pendingUpdates.push({
                        previousData: data,
                        queryKey,
                        updater: (
                            current:
                                | undefined
                                | { pageParams: string[]; pages: AlbumListResponse[] },
                        ) => {
                            if (!current) return current;
                            const updatedPages = updateItemsInPages<Album, AlbumListResponse>(
                                current.pages.filter((p): p is AlbumListResponse => !!p),
                                itemIdSet,
                                (item) => createFavoriteUpdater<Album>(item),
                            );
                            return updatedPages ? { ...current, pages: updatedPages } : current;
                        },
                    });
                }
            });

            const infiniteLoaderQueryKey = infiniteLoaderDataQueryKey(
                variables.apiClientProps.serverId,
                LibraryItem.ALBUM,
            );
            const infiniteLoaderQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: infiniteLoaderQueryKey,
            });

            infiniteLoaderQueries.forEach(([queryKey, data]) => {
                if (data) {
                    pendingUpdates.push({
                        previousData: data,
                        queryKey,
                        updater: (
                            prev:
                                | undefined
                                | {
                                      data: unknown[];
                                      pagesLoaded: Record<string, boolean>;
                                  },
                        ) => {
                            if (prev && prev.data) {
                                const updatedData = updateItemInArray(
                                    prev.data as Array<{ id: string; userFavorite?: boolean }>,
                                    itemIdSet,
                                    (item) => createFavoriteUpdater(item),
                                );
                                return updatedData ? { ...prev, data: updatedData } : prev;
                            }
                            return prev;
                        },
                    });
                }
            });

            break;
        }
        case LibraryItem.ALBUM_ARTIST: {
            const detailQueryKey = queryKeys.albumArtists.detail(variables.apiClientProps.serverId);
            const detailQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: detailQueryKey,
            });

            detailQueries.forEach(([queryKey, data]) => {
                if (data) {
                    pendingUpdates.push({
                        previousData: data,
                        queryKey,
                        updater: (prev: AlbumArtistDetailResponse | undefined) => {
                            if (!prev) return prev;

                            if (itemIdSet.has(prev.id)) {
                                return { ...prev, userFavorite: isFavorite };
                            }

                            if (prev.similarArtists && prev.similarArtists.length > 0) {
                                const hasMatchingSimilarArtist = prev.similarArtists.some(
                                    (artist) => itemIdSet.has(artist.id),
                                );

                                if (hasMatchingSimilarArtist) {
                                    return {
                                        ...prev,
                                        similarArtists: prev.similarArtists.map((artist) =>
                                            itemIdSet.has(artist.id)
                                                ? { ...artist, userFavorite: isFavorite }
                                                : artist,
                                        ),
                                    };
                                }
                            }

                            return prev;
                        },
                    });
                }
            });

            const listQueryKey = queryKeys.albumArtists.list(variables.apiClientProps.serverId);
            const listQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: listQueryKey,
            });

            listQueries.forEach(([queryKey, data]) => {
                if (data) {
                    pendingUpdates.push({
                        previousData: data,
                        queryKey,
                        updater: (prev: AlbumArtistListResponse | undefined) => {
                            if (!prev) return prev;
                            const updatedItems = updateItemInArray(
                                prev.items.filter((item): item is AlbumArtist => !!item),
                                itemIdSet,
                                (item) => createFavoriteUpdater<AlbumArtist>(item),
                            );
                            return updatedItems ? { ...prev, items: updatedItems } : prev;
                        },
                    });
                }
            });

            const infiniteListQueryKey = queryKeys.albumArtists.infiniteList(
                variables.apiClientProps.serverId,
            );
            const infiniteListQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: infiniteListQueryKey,
            });

            infiniteListQueries.forEach(([queryKey, data]) => {
                if (data) {
                    pendingUpdates.push({
                        previousData: data,
                        queryKey,
                        updater: (
                            prev:
                                | undefined
                                | { pageParams: string[]; pages: AlbumArtistListResponse[] },
                        ) => {
                            if (!prev) return prev;
                            const updatedPages = updateItemsInPages<
                                AlbumArtist,
                                AlbumArtistListResponse
                            >(
                                prev.pages.filter((p): p is AlbumArtistListResponse => !!p),
                                itemIdSet,
                                (item) => createFavoriteUpdater<AlbumArtist>(item),
                            );
                            return updatedPages ? { ...prev, pages: updatedPages } : prev;
                        },
                    });
                }
            });

            const infiniteLoaderQueryKey = infiniteLoaderDataQueryKey(
                variables.apiClientProps.serverId,
                LibraryItem.ALBUM_ARTIST,
            );
            const infiniteLoaderQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: infiniteLoaderQueryKey,
            });

            infiniteLoaderQueries.forEach(([queryKey, data]) => {
                if (data) {
                    pendingUpdates.push({
                        previousData: data,
                        queryKey,
                        updater: (
                            prev:
                                | undefined
                                | {
                                      data: unknown[];
                                      pagesLoaded: Record<string, boolean>;
                                  },
                        ) => {
                            if (prev && prev.data) {
                                const updatedData = updateItemInArray(
                                    prev.data as Array<{ id: string; userFavorite?: boolean }>,
                                    itemIdSet,
                                    (item) => createFavoriteUpdater(item),
                                );
                                return updatedData ? { ...prev, data: updatedData } : prev;
                            }
                            return prev;
                        },
                    });
                }
            });

            break;
        }
        case LibraryItem.ARTIST: {
            const listQueryKey = queryKeys.artists.list(variables.apiClientProps.serverId);
            const listQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: listQueryKey,
            });

            listQueries.forEach(([queryKey, data]) => {
                if (data) {
                    pendingUpdates.push({
                        previousData: data,
                        queryKey,
                        updater: (prev: ArtistListResponse | undefined) => {
                            if (!prev) return prev;
                            const updatedItems = updateItemInArray(prev.items, itemIdSet, (item) =>
                                createFavoriteUpdater<AlbumArtist>(item),
                            );
                            return updatedItems ? { ...prev, items: updatedItems } : prev;
                        },
                    });
                }
            });

            const infiniteListQueryKey = queryKeys.artists.infiniteList(
                variables.apiClientProps.serverId,
            );
            const infiniteListQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: infiniteListQueryKey,
            });

            infiniteListQueries.forEach(([queryKey, data]) => {
                if (data) {
                    pendingUpdates.push({
                        previousData: data,
                        queryKey,
                        updater: (
                            prev: undefined | { pageParams: string[]; pages: ArtistListResponse[] },
                        ) => {
                            if (!prev) return prev;
                            const updatedPages = updateItemsInPages<
                                AlbumArtist,
                                AlbumArtistListResponse
                            >(
                                prev.pages.filter((p): p is AlbumArtistListResponse => !!p),
                                itemIdSet,
                                (item) => createFavoriteUpdater<AlbumArtist>(item),
                            );
                            return updatedPages ? { ...prev, pages: updatedPages } : prev;
                        },
                    });
                }
            });

            const infiniteLoaderQueryKey = infiniteLoaderDataQueryKey(
                variables.apiClientProps.serverId,
                LibraryItem.ARTIST,
            );
            const infiniteLoaderQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: infiniteLoaderQueryKey,
            });

            infiniteLoaderQueries.forEach(([queryKey, data]) => {
                if (data) {
                    pendingUpdates.push({
                        previousData: data,
                        queryKey,
                        updater: (
                            prev:
                                | undefined
                                | {
                                      data: unknown[];
                                      pagesLoaded: Record<string, boolean>;
                                  },
                        ) => {
                            if (prev && prev.data) {
                                const updatedData = updateItemInArray(
                                    prev.data as Array<{ id: string; userFavorite?: boolean }>,
                                    itemIdSet,
                                    (item) => createFavoriteUpdater(item),
                                );
                                return updatedData ? { ...prev, data: updatedData } : prev;
                            }
                            return prev;
                        },
                    });
                }
            });

            break;
        }
        case LibraryItem.PLAYLIST_SONG:
        case LibraryItem.QUEUE_SONG:
        case LibraryItem.SONG: {
            const albumDetailQueryKey = queryKeys.albums.detail(variables.apiClientProps.serverId);
            const albumDetailQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: albumDetailQueryKey,
            });

            albumDetailQueries.forEach(([queryKey, data]) => {
                if (data) {
                    pendingUpdates.push({
                        previousData: data,
                        queryKey,
                        updater: (prev: AlbumDetailResponse | undefined) => {
                            if (!prev || !prev.songs) return prev;
                            const updatedSongs = updateItemInArray(prev.songs, itemIdSet, (item) =>
                                createFavoriteUpdater<Song>(item),
                            );
                            return updatedSongs ? { ...prev, songs: updatedSongs } : prev;
                        },
                    });
                }
            });

            const detailQueryKey = queryKeys.songs.detail(variables.apiClientProps.serverId);
            const detailQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: detailQueryKey,
            });

            detailQueries.forEach(([queryKey, data]) => {
                if (data) {
                    pendingUpdates.push({
                        previousData: data,
                        queryKey,
                        updater: (prev: SongDetailResponse | undefined) => {
                            if (prev && itemIdSet.has(prev.id)) {
                                return { ...prev, userFavorite: isFavorite };
                            }
                            return prev;
                        },
                    });
                }
            });

            const playlistSongListQueryKey = queryKeys.playlists.songList(
                variables.apiClientProps.serverId,
            );
            const playlistSongListQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: playlistSongListQueryKey,
            });

            playlistSongListQueries.forEach(([queryKey, data]) => {
                if (data) {
                    pendingUpdates.push({
                        previousData: data,
                        queryKey,
                        updater: (prev: PlaylistSongListResponse | undefined) => {
                            if (!prev) return prev;
                            const updatedItems = updateItemInArray(prev.items, itemIdSet, (item) =>
                                createFavoriteUpdater<Song>(item),
                            );
                            return updatedItems ? { ...prev, items: updatedItems } : prev;
                        },
                    });
                }
            });

            const songListQueryKey = queryKeys.songs.list(variables.apiClientProps.serverId);
            const songListQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: songListQueryKey,
            });

            songListQueries.forEach(([queryKey, data]) => {
                if (data) {
                    pendingUpdates.push({
                        previousData: data,
                        queryKey,
                        updater: (prev: undefined | { items: Song[] }) => {
                            if (!prev) return prev;
                            const updatedItems = updateItemInArray(prev.items, itemIdSet, (item) =>
                                createFavoriteUpdater<Song>(item),
                            );
                            return updatedItems ? { ...prev, items: updatedItems } : prev;
                        },
                    });
                }
            });

            const topSongsQueryKey = queryKeys.albumArtists.topSongs(
                variables.apiClientProps.serverId,
            );
            const topSongsQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: topSongsQueryKey,
            });

            topSongsQueries.forEach(([queryKey, data]) => {
                if (data) {
                    pendingUpdates.push({
                        previousData: data,
                        queryKey,
                        updater: (prev: TopSongListResponse | undefined) => {
                            if (!prev) return prev;
                            const updatedItems = updateItemInArray(prev.items, itemIdSet, (item) =>
                                createFavoriteUpdater<Song>(item),
                            );
                            return updatedItems ? { ...prev, items: updatedItems } : prev;
                        },
                    });
                }
            });

            const homeQueries = queryClient.getQueriesData({
                exact: false,
                queryKey: ['home', 'song'],
            });

            homeQueries.concat(homeQueries).forEach(([queryKey, data]) => {
                if (data) {
                    pendingUpdates.push({
                        previousData: data,
                        queryKey,
                        updater: (
                            current:
                                | undefined
                                | { pageParams: string[]; pages: SongListResponse[] },
                        ) => {
                            if (!current) return current;
                            const updatedPages = updateItemsInPages<Song, SongListResponse>(
                                current.pages.filter((p): p is SongListResponse => !!p),
                                itemIdSet,
                                (item) => createFavoriteUpdater<Song>(item),
                            );
                            return updatedPages ? { ...current, pages: updatedPages } : current;
                        },
                    });
                }
            });

            break;
        }
    }

    return collectAndApplyUpdates(queryClient, pendingUpdates);
};

export const applyFavoriteOptimisticUpdatesDeferred = (
    queryClient: QueryClient,
    variables: FavoriteArgs,
    isFavorite: boolean,
): PreviousQueryData[] => {
    const previousQueries: PreviousQueryData[] = [];
    const itemIdSet = new Set<string>();

    if (Array.isArray(variables.query.id)) {
        variables.query.id.forEach((id) => {
            itemIdSet.add(id);
        });
    } else {
        itemIdSet.add(variables.query.id);
    }

    const queryKeysToUpdate: Array<{
        data: unknown;
        queryKey: readonly unknown[];
        type: string;
    }> = [];

    const collectQueries = (baseKey: readonly unknown[], type: string) => {
        const queries = queryClient.getQueriesData({ exact: false, queryKey: baseKey });
        queries.forEach(([queryKey, data]) => {
            if (data) {
                previousQueries.push({ data, queryKey });
                queryKeysToUpdate.push({ data, queryKey, type });
            }
        });
    };

    switch (variables.query.type) {
        case LibraryItem.ALBUM: {
            collectQueries(
                queryKeys.albums.detail(variables.apiClientProps.serverId),
                'album-detail',
            );
            collectQueries(queryKeys.albums.list(variables.apiClientProps.serverId), 'album-list');
            collectQueries(
                queryKeys.albums.infiniteList(variables.apiClientProps.serverId),
                'album-infinite-list',
            );
            collectQueries(
                infiniteLoaderDataQueryKey(variables.apiClientProps.serverId, LibraryItem.ALBUM),
                'album-infinite-loader',
            );
            break;
        }
        case LibraryItem.ALBUM_ARTIST: {
            collectQueries(
                queryKeys.albumArtists.detail(variables.apiClientProps.serverId),
                'album-artist-detail',
            );
            collectQueries(
                queryKeys.albumArtists.list(variables.apiClientProps.serverId),
                'album-artist-list',
            );
            collectQueries(
                queryKeys.albumArtists.infiniteList(variables.apiClientProps.serverId),
                'album-artist-infinite-list',
            );
            collectQueries(
                infiniteLoaderDataQueryKey(
                    variables.apiClientProps.serverId,
                    LibraryItem.ALBUM_ARTIST,
                ),
                'album-artist-infinite-loader',
            );
            break;
        }
        case LibraryItem.ARTIST: {
            collectQueries(
                queryKeys.artists.list(variables.apiClientProps.serverId),
                'artist-list',
            );
            collectQueries(
                queryKeys.artists.infiniteList(variables.apiClientProps.serverId),
                'artist-infinite-list',
            );
            collectQueries(
                infiniteLoaderDataQueryKey(variables.apiClientProps.serverId, LibraryItem.ARTIST),
                'artist-infinite-loader',
            );
            break;
        }
        case LibraryItem.PLAYLIST_SONG:
        case LibraryItem.QUEUE_SONG:
        case LibraryItem.SONG: {
            collectQueries(
                queryKeys.albums.detail(variables.apiClientProps.serverId),
                'album-detail',
            );
            collectQueries(
                queryKeys.songs.detail(variables.apiClientProps.serverId),
                'song-detail',
            );
            collectQueries(
                queryKeys.playlists.songList(variables.apiClientProps.serverId),
                'playlist-song-list',
            );
            collectQueries(queryKeys.songs.list(variables.apiClientProps.serverId), 'song-list');
            collectQueries(
                queryKeys.albumArtists.topSongs(variables.apiClientProps.serverId),
                'top-songs',
            );
            break;
        }
    }

    queueMicrotask(() => {
        queryKeysToUpdate.forEach(({ queryKey, type }) => {
            queryClient.setQueryData(queryKey, (prev: any) => {
                if (!prev) return prev;

                switch (type) {
                    case 'album-artist-detail':
                    case 'album-detail':
                    case 'song-detail': {
                        if (itemIdSet.has(prev.id)) {
                            return { ...prev, userFavorite: isFavorite };
                        }
                        if (prev.similarArtists) {
                            const hasMatch = prev.similarArtists.some((a: any) =>
                                itemIdSet.has(a.id),
                            );
                            if (hasMatch) {
                                return {
                                    ...prev,
                                    similarArtists: prev.similarArtists.map((a: any) =>
                                        itemIdSet.has(a.id)
                                            ? { ...a, userFavorite: isFavorite }
                                            : a,
                                    ),
                                };
                            }
                        }
                        return prev;
                    }
                    case 'album-artist-infinite-list':
                    case 'album-infinite-list':
                    case 'artist-infinite-list': {
                        const updatedPages = updateItemsInPages(
                            prev.pages || [],
                            itemIdSet,
                            (item) => ({ ...item, userFavorite: isFavorite }),
                        );
                        return updatedPages ? { ...prev, pages: updatedPages } : prev;
                    }
                    case 'album-artist-infinite-loader':
                    case 'album-infinite-loader':
                    case 'artist-infinite-loader': {
                        if (prev.data) {
                            const updatedData = updateItemInArray(prev.data, itemIdSet, (item) => ({
                                ...item,
                                userFavorite: isFavorite,
                            }));
                            return updatedData ? { ...prev, data: updatedData } : prev;
                        }
                        return prev;
                    }
                    case 'album-artist-list':
                    case 'album-list':
                    case 'artist-list':
                    case 'playlist-song-list':
                    case 'song-list':
                    case 'top-songs': {
                        const updatedItems = updateItemInArray(
                            prev.items || [],
                            itemIdSet,
                            (item) => ({ ...item, userFavorite: isFavorite }),
                        );
                        return updatedItems ? { ...prev, items: updatedItems } : prev;
                    }
                    default:
                        return prev;
                }
            });
        });
    });

    return previousQueries;
};

export const restoreFavoriteQueryData = (
    queryClient: QueryClient,
    previousQueries: PreviousQueryData[],
): void => {
    previousQueries.forEach(({ data, queryKey }) => {
        queryClient.setQueryData(queryKey, data);
    });
};
