import { closeAllModals, openModal } from '@mantine/modals';
import { QueryClient, useIsFetching, useQueryClient } from '@tanstack/react-query';
import { nanoid } from 'nanoid/non-secure';
import { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { queryKeys } from '/@/renderer/api/query-keys';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { playlistsQueries } from '/@/renderer/features/playlists/api/playlists-api';
import { useCreateFavorite } from '/@/renderer/features/shared/mutations/create-favorite-mutation';
import { useDeleteFavorite } from '/@/renderer/features/shared/mutations/delete-favorite-mutation';
import { useSetRating } from '/@/renderer/features/shared/mutations/set-rating-mutation';
import { songsQueries } from '/@/renderer/features/songs/api/songs-api';
import { AddToQueueType, usePlayerActions } from '/@/renderer/store';
import { Checkbox } from '/@/shared/components/checkbox/checkbox';
import { ConfirmModal } from '/@/shared/components/modal/modal';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import { useLocalStorage } from '/@/shared/hooks/use-local-storage';
import {
    instanceOfCancellationError,
    LibraryItem,
    PlaylistSongListResponse,
    QueueSong,
    Song,
    SongListResponse,
    SongListSort,
    SortOrder,
    sortSongsByFetchedOrder,
} from '/@/shared/types/domain-types';
import { Play, PlayerRepeat, PlayerShuffle } from '/@/shared/types/types';

export interface PlayerContext {
    addToQueueByData: (data: Song[], type: AddToQueueType) => void;
    addToQueueByFetch: (
        serverId: string,
        id: string[],
        itemType: LibraryItem,
        type: AddToQueueType,
        skipConfirmation?: boolean,
    ) => void;
    addToQueueByListQuery: (
        serverId: string,
        query: any,
        itemType: LibraryItem,
        type: AddToQueueType,
    ) => Promise<void>;
    clearQueue: () => void;
    clearSelected: (items: QueueSong[]) => void;
    decreaseVolume: (amount: number) => void;
    increaseVolume: (amount: number) => void;
    mediaNext: () => void;
    mediaPause: () => void;
    mediaPlay: (id?: string) => void;
    mediaPrevious: () => void;
    mediaSeekToTimestamp: (timestamp: number) => void;
    mediaSkipBackward: () => void;
    mediaSkipForward: () => void;
    mediaStop: () => void;
    mediaToggleMute: () => void;
    mediaTogglePlayPause: () => void;
    moveSelectedTo: (items: QueueSong[], edge: 'bottom' | 'top', uniqueId: string) => void;
    moveSelectedToBottom: (items: QueueSong[]) => void;
    moveSelectedToNext: (items: QueueSong[]) => void;
    moveSelectedToTop: (items: QueueSong[]) => void;
    setFavorite: (
        serverId: string,
        id: string[],
        itemType: LibraryItem,
        isFavorite: boolean,
    ) => void;
    setRating: (serverId: string, id: string[], itemType: LibraryItem, rating: number) => void;
    setRepeat: (repeat: PlayerRepeat) => void;
    setShuffle: (shuffle: PlayerShuffle) => void;
    setSpeed: (speed: number) => void;
    setVolume: (volume: number) => void;
    shuffle: () => void;
    shuffleAll: () => void;
    shuffleSelected: (items: QueueSong[]) => void;
    toggleRepeat: () => void;
    toggleShuffle: () => void;
}

export const PlayerContext = createContext<PlayerContext>({
    addToQueueByData: () => {},
    addToQueueByFetch: () => {},
    addToQueueByListQuery: async () => {},
    clearQueue: () => {},
    clearSelected: () => {},
    decreaseVolume: () => {},
    increaseVolume: () => {},
    mediaNext: () => {},
    mediaPause: () => {},
    mediaPlay: () => {},
    mediaPrevious: () => {},
    mediaSeekToTimestamp: () => {},
    mediaSkipBackward: () => {},
    mediaSkipForward: () => {},
    mediaStop: () => {},
    mediaToggleMute: () => {},
    mediaTogglePlayPause: () => {},
    moveSelectedTo: () => {},
    moveSelectedToBottom: () => {},
    moveSelectedToNext: () => {},
    moveSelectedToTop: () => {},
    setFavorite: () => {},
    setRating: () => {},
    setRepeat: () => {},
    setShuffle: () => {},
    setSpeed: () => {},
    setVolume: () => {},
    shuffle: () => {},
    shuffleAll: () => {},
    shuffleSelected: () => {},
    toggleRepeat: () => {},
    toggleShuffle: () => {},
});

const getRootQueryKey = (itemType: LibraryItem, serverId: string) => {
    switch (itemType) {
        case LibraryItem.ALBUM:
            return queryKeys.songs.root(serverId);
        case LibraryItem.ALBUM_ARTIST:
            return queryKeys.songs.root(serverId);
        case LibraryItem.ARTIST:
            return queryKeys.songs.root(serverId);
        case LibraryItem.GENRE:
            return queryKeys.songs.root(serverId);
        case LibraryItem.PLAYLIST:
            return queryKeys.playlists.root(serverId);
        case LibraryItem.SONG:
            return queryKeys.songs.root(serverId);
        default:
            return queryKeys.songs.root(serverId);
    }
};

export const PlayerProvider = ({ children }: { children: React.ReactNode }) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const storeActions = usePlayerActions();
    const timeoutIds = useRef<null | Record<string, ReturnType<typeof setTimeout>>>({});
    const queueFetchConfirmThreshold = 100;

    const [doNotShowAgain, setDoNotShowAgain] = useLocalStorage({
        defaultValue: false,
        key: 'large_fetch_confirmation',
    });

    const confirmLargeFetch = useCallback(
        (itemCount: number): Promise<boolean> => {
            if (doNotShowAgain) {
                return Promise.resolve(true);
            }

            return new Promise((resolve) => {
                openModal({
                    children: (
                        <ConfirmModal
                            labels={{
                                cancel: t('common.cancel', { postProcess: 'titleCase' }),
                                confirm: t('common.confirm', { postProcess: 'titleCase' }),
                            }}
                            onCancel={() => {
                                resolve(false);
                                closeAllModals();
                            }}
                            onConfirm={() => {
                                resolve(true);
                                closeAllModals();
                            }}
                        >
                            <Stack>
                                <Text>
                                    {t('action.largeFetch', {
                                        count: itemCount,
                                        postProcess: 'sentenceCase',
                                    })}
                                </Text>
                                <Checkbox
                                    label={t('common.doNotShowAgain', {
                                        postProcess: 'sentenceCase',
                                    })}
                                    onChange={(event) => {
                                        setDoNotShowAgain(event.currentTarget.checked);
                                    }}
                                />
                            </Stack>
                        </ConfirmModal>
                    ),
                    title: t('common.areYouSure', {
                        postProcess: 'sentenceCase',
                    }),
                });
            });
        },
        [doNotShowAgain, setDoNotShowAgain, t],
    );

    const addToQueueByData = useCallback(
        (data: Song[], type: AddToQueueType) => {
            if (typeof type === 'object' && 'edge' in type && type.edge !== null) {
                const edge = type.edge === 'top' ? 'top' : 'bottom';
                storeActions.addToQueueByUniqueId(data, type.uniqueId, edge);
            } else {
                storeActions.addToQueueByType(data, type as Play);
            }
        },
        [storeActions],
    );

    const addToQueueByFetch = useCallback(
        async (
            serverId: string,
            id: string[],
            itemType: LibraryItem,
            type: AddToQueueType,
            skipConfirmation?: boolean,
        ) => {
            if (!skipConfirmation && id.length > queueFetchConfirmThreshold) {
                const confirmed = await confirmLargeFetch(id.length);
                if (!confirmed) {
                    return;
                }
            }

            let toastId: null | string = null;
            const fetchId = nanoid();

            timeoutIds.current = {
                ...timeoutIds.current,
                [fetchId]: setTimeout(() => {
                    toastId = toast.info({
                        autoClose: false,
                        message: t('player.playbackFetchCancel', {
                            postProcess: 'sentenceCase',
                        }),
                        onClose: () => {
                            queryClient.cancelQueries({
                                exact: false,
                                queryKey: getRootQueryKey(itemType, serverId),
                            });
                        },
                        title: t('player.playbackFetchInProgress', {
                            postProcess: 'sentenceCase',
                        }),
                    });
                }, 2000),
            };

            try {
                const songs = await queryClient.fetchQuery({
                    gcTime: 0,
                    queryFn: () => {
                        return fetchSongsByItemType(queryClient, serverId, {
                            id,
                            itemType,
                        });
                    },
                    queryKey: queryKeys.player.fetch(),
                    staleTime: 0,
                });

                clearTimeout(timeoutIds.current[fetchId] as ReturnType<typeof setTimeout>);
                delete timeoutIds.current[fetchId];
                if (toastId) {
                    toast.hide(toastId);
                }

                const sortedSongs = sortSongsByFetchedOrder(songs, id, itemType);

                if (typeof type === 'object' && 'edge' in type && type.edge !== null) {
                    const edge = type.edge === 'top' ? 'top' : 'bottom';
                    storeActions.addToQueueByUniqueId(sortedSongs, type.uniqueId, edge);
                } else {
                    storeActions.addToQueueByType(sortedSongs, type as Play);
                }
            } catch (err: any) {
                if (instanceOfCancellationError(err)) {
                    return;
                }

                clearTimeout(timeoutIds.current[fetchId] as ReturnType<typeof setTimeout>);
                delete timeoutIds.current[fetchId];
                if (toastId) {
                    toast.hide(toastId);
                }

                toast.error({
                    message: err.message,
                    title: t('error.genericError', { postProcess: 'sentenceCase' }) as string,
                });
            }
        },
        [confirmLargeFetch, queueFetchConfirmThreshold, queryClient, storeActions, t],
    );

    const addToQueueByListQuery = useCallback(
        async (serverId: string, query: any, itemType: LibraryItem, type: AddToQueueType) => {
            let toastId: null | string = null;
            let fetchId: null | string = null;

            try {
                // Get total count first
                let totalCount = 0;
                let listQueryFn: any;
                let listCountQueryFn: any;

                switch (itemType) {
                    case LibraryItem.ALBUM: {
                        listQueryFn = albumQueries.list;
                        listCountQueryFn = albumQueries.listCount;
                        break;
                    }
                    case LibraryItem.ALBUM_ARTIST: {
                        listQueryFn = artistsQueries.albumArtistList;
                        listCountQueryFn = artistsQueries.albumArtistListCount;
                        break;
                    }
                    case LibraryItem.ARTIST: {
                        listQueryFn = artistsQueries.artistList;
                        listCountQueryFn = artistsQueries.artistListCount;
                        break;
                    }
                    case LibraryItem.PLAYLIST: {
                        listQueryFn = playlistsQueries.list;
                        listCountQueryFn = playlistsQueries.listCount;
                        break;
                    }
                    case LibraryItem.SONG: {
                        listQueryFn = songsQueries.list;
                        listCountQueryFn = songsQueries.listCount;
                        break;
                    }
                    default: {
                        throw new Error(`Unsupported item type: ${itemType}`);
                    }
                }

                // Get total count
                const countResult = (await queryClient.fetchQuery(
                    listCountQueryFn({
                        query: { ...query },
                        serverId,
                    }),
                )) as number;
                totalCount = countResult || 0;

                // Check if we need confirmation
                if (totalCount > queueFetchConfirmThreshold) {
                    const confirmed = await confirmLargeFetch(totalCount);
                    if (!confirmed) {
                        return;
                    }
                }

                // Start timeout only after confirmation (if needed)
                fetchId = nanoid();

                timeoutIds.current = {
                    ...timeoutIds.current,
                    [fetchId]: setTimeout(() => {
                        toastId = toast.info({
                            autoClose: false,
                            message: t('player.playbackFetchCancel', {
                                postProcess: 'sentenceCase',
                            }),
                            onClose: () => {
                                queryClient.cancelQueries({
                                    exact: false,
                                    queryKey: getRootQueryKey(itemType, serverId),
                                });
                            },
                            title: t('player.playbackFetchInProgress', {
                                postProcess: 'sentenceCase',
                            }),
                        });
                    }, 2000),
                };

                // Paginate through all items to collect IDs
                const allIds: string[] = [];
                const pageSize = 500; // Fetch in chunks
                let startIndex = 0;

                while (startIndex < totalCount) {
                    const pageQuery = {
                        ...query,
                        limit: pageSize,
                        startIndex,
                    };

                    const pageResult = (await queryClient.fetchQuery(
                        listQueryFn({
                            query: pageQuery,
                            serverId,
                        }),
                    )) as { items: any[] };

                    if (pageResult?.items) {
                        const pageIds = pageResult.items.map((item: any) => item.id);
                        allIds.push(...pageIds);
                    }

                    // If we got fewer items than requested, we've reached the end
                    if (!pageResult?.items || pageResult.items.length < pageSize) {
                        break;
                    }

                    startIndex += pageSize;
                }

                if (fetchId && timeoutIds.current) {
                    clearTimeout(timeoutIds.current[fetchId] as ReturnType<typeof setTimeout>);
                    delete timeoutIds.current[fetchId];
                }
                if (toastId) {
                    toast.hide(toastId);
                }

                // Now call addToQueueByFetch with all collected IDs (skip confirmation since we already confirmed)
                await addToQueueByFetch(serverId, allIds, itemType, type, true);
            } catch (err: any) {
                if (instanceOfCancellationError(err)) {
                    return;
                }

                if (fetchId && timeoutIds.current) {
                    clearTimeout(timeoutIds.current[fetchId] as ReturnType<typeof setTimeout>);
                    delete timeoutIds.current[fetchId];
                }
                if (toastId) {
                    toast.hide(toastId);
                }

                toast.error({
                    message: err.message,
                    title: t('error.genericError', { postProcess: 'sentenceCase' }) as string,
                });
            }
        },
        [confirmLargeFetch, queueFetchConfirmThreshold, queryClient, addToQueueByFetch, t],
    );

    const clearQueue = useCallback(() => {
        storeActions.clearQueue();
    }, [storeActions]);

    const clearSelected = useCallback(
        (items: QueueSong[]) => {
            storeActions.clearSelected(items);
        },
        [storeActions],
    );

    const decreaseVolume = useCallback(
        (amount: number) => {
            storeActions.decreaseVolume(amount);
        },
        [storeActions],
    );

    const increaseVolume = useCallback(
        (amount: number) => {
            storeActions.increaseVolume(amount);
        },
        [storeActions],
    );

    const mediaNext = useCallback(() => {
        storeActions.mediaNext();
    }, [storeActions]);

    const mediaPause = useCallback(() => {
        storeActions.mediaPause();
    }, [storeActions]);

    const mediaPlay = useCallback(
        (id?: string) => {
            storeActions.mediaPlay(id);
        },
        [storeActions],
    );

    const mediaPrevious = useCallback(() => {
        storeActions.mediaPrevious();
    }, [storeActions]);

    const mediaStop = useCallback(() => {
        storeActions.mediaStop();
    }, [storeActions]);

    const mediaSeekToTimestamp = useCallback(
        (timestamp: number) => {
            storeActions.mediaSeekToTimestamp(timestamp);
        },
        [storeActions],
    );

    const mediaSkipBackward = useCallback(() => {
        storeActions.mediaSkipBackward();
    }, [storeActions]);

    const mediaSkipForward = useCallback(() => {
        storeActions.mediaSkipForward();
    }, [storeActions]);

    const setSpeed = useCallback(
        (speed: number) => {
            storeActions.setSpeed(speed);
        },
        [storeActions],
    );

    const mediaToggleMute = useCallback(() => {
        storeActions.mediaToggleMute();
    }, [storeActions]);

    const mediaTogglePlayPause = useCallback(() => {
        storeActions.mediaTogglePlayPause();
    }, [storeActions]);

    const moveSelectedTo = useCallback(
        (items: QueueSong[], edge: 'bottom' | 'top', uniqueId: string) => {
            storeActions.moveSelectedTo(items, uniqueId, edge);
        },
        [storeActions],
    );

    const moveSelectedToBottom = useCallback(
        (items: QueueSong[]) => {
            storeActions.moveSelectedToBottom(items);
        },
        [storeActions],
    );

    const moveSelectedToNext = useCallback(
        (items: QueueSong[]) => {
            storeActions.moveSelectedToNext(items);
        },
        [storeActions],
    );

    const moveSelectedToTop = useCallback(
        (items: QueueSong[]) => {
            storeActions.moveSelectedToTop(items);
        },
        [storeActions],
    );

    const setVolume = useCallback(
        (volume: number) => {
            storeActions.setVolume(volume);
        },
        [storeActions],
    );

    const setRepeat = useCallback(
        (repeat: PlayerRepeat) => {
            storeActions.setRepeat(repeat);
        },
        [storeActions],
    );

    const setShuffle = useCallback(
        (shuffle: PlayerShuffle) => {
            storeActions.setShuffle(shuffle);
        },
        [storeActions],
    );

    const shuffle = useCallback(() => {
        storeActions.shuffle();
    }, [storeActions]);

    const shuffleAll = useCallback(() => {
        storeActions.shuffleAll();
    }, [storeActions]);

    const shuffleSelected = useCallback(
        (items: QueueSong[]) => {
            storeActions.shuffleSelected(items);
        },
        [storeActions],
    );

    const toggleRepeat = useCallback(() => {
        storeActions.toggleRepeat();
    }, [storeActions]);

    const toggleShuffle = useCallback(() => {
        storeActions.toggleShuffle();
    }, [storeActions]);

    const createFavoriteMutation = useCreateFavorite({});
    const deleteFavoriteMutation = useDeleteFavorite({});

    const setFavorite = useCallback(
        (serverId: string, id: string[], itemType: LibraryItem, isFavorite: boolean) => {
            if (isFavorite) {
                createFavoriteMutation.mutate({
                    apiClientProps: { serverId },
                    query: { id, type: itemType },
                });
            } else {
                deleteFavoriteMutation.mutate({
                    apiClientProps: { serverId },
                    query: { id, type: itemType },
                });
            }
        },
        [createFavoriteMutation, deleteFavoriteMutation],
    );

    const setRatingMutation = useSetRating({});

    const setRating = useCallback(
        (serverId: string, id: string[], itemType: LibraryItem, rating: number) => {
            setRatingMutation.mutate({
                apiClientProps: { serverId },
                query: { id, rating, type: itemType },
            });
        },
        [setRatingMutation],
    );

    const contextValue: PlayerContext = useMemo(
        () => ({
            addToQueueByData,
            addToQueueByFetch,
            addToQueueByListQuery,
            clearQueue,
            clearSelected,
            decreaseVolume,
            increaseVolume,
            mediaNext,
            mediaPause,
            mediaPlay,
            mediaPrevious,
            mediaSeekToTimestamp,
            mediaSkipBackward,
            mediaSkipForward,
            mediaStop,
            mediaToggleMute,
            mediaTogglePlayPause,
            moveSelectedTo,
            moveSelectedToBottom,
            moveSelectedToNext,
            moveSelectedToTop,
            setFavorite,
            setRating,
            setRepeat,
            setShuffle,
            setSpeed,
            setVolume,
            shuffle,
            shuffleAll,
            shuffleSelected,
            toggleRepeat,
            toggleShuffle,
        }),
        [
            addToQueueByData,
            addToQueueByFetch,
            addToQueueByListQuery,
            clearQueue,
            clearSelected,
            decreaseVolume,
            setSpeed,
            increaseVolume,
            mediaNext,
            mediaPause,
            mediaPlay,
            mediaPrevious,
            mediaSeekToTimestamp,
            mediaSkipBackward,
            mediaSkipForward,
            mediaStop,
            mediaToggleMute,
            mediaTogglePlayPause,
            moveSelectedTo,
            moveSelectedToBottom,
            moveSelectedToNext,
            moveSelectedToTop,
            setFavorite,
            setRating,
            setRepeat,
            setShuffle,
            setVolume,
            shuffle,
            shuffleAll,
            shuffleSelected,
            toggleRepeat,
            toggleShuffle,
        ],
    );

    return <PlayerContext.Provider value={contextValue}>{children}</PlayerContext.Provider>;
};

export const usePlayer = () => {
    return useContext(PlayerContext);
};

/**
 * Fetches the songs from the server
 * @param queryClient - The query client to use to fetch the data
 * @param serverId - The library id to use to fetch the data
 * @param type - The type of the item to add to the queue
 * @param args - The arguments to use to fetch the data
 * @returns The songs to add to the queue
 */
export async function fetchSongsByItemType(
    queryClient: QueryClient,
    serverId: string,
    args: {
        id: string[];
        itemType: LibraryItem;
        params?: Record<string, any>;
    },
) {
    const songs: Song[] = [];

    switch (args.itemType) {
        case LibraryItem.ALBUM: {
            const promises: Promise<SongListResponse>[] = [];

            for (const id of args.id) {
                promises.push(
                    queryClient.fetchQuery(
                        songsQueries.list({
                            query: {
                                albumIds: [id],
                                sortBy: SongListSort.ID,
                                sortOrder: SortOrder.ASC,
                                startIndex: 0,
                                ...args.params,
                            },
                            serverId: serverId,
                        }),
                    ),
                );
            }

            const results = await Promise.all(promises);
            songs.push(...results.flatMap((r) => r.items));

            break;
        }

        case LibraryItem.ALBUM_ARTIST:
        case LibraryItem.ARTIST: {
            const promises: Promise<SongListResponse>[] = [];

            for (const id of args.id) {
                promises.push(
                    queryClient.fetchQuery(
                        songsQueries.list({
                            query: {
                                albumArtistIds: [id],
                                limit: -1,
                                sortBy: SongListSort.ID,
                                sortOrder: SortOrder.ASC,
                                startIndex: 0,
                                ...args.params,
                            },
                            serverId: serverId,
                        }),
                    ),
                );
            }

            const results = await Promise.all(promises);
            songs.push(...results.flatMap((r) => r.items));

            break;
        }

        case LibraryItem.GENRE: {
            const promises: Promise<SongListResponse>[] = [];

            for (const id of args.id) {
                promises.push(
                    queryClient.fetchQuery(
                        songsQueries.list({
                            query: {
                                genreIds: [id],
                                limit: -1,
                                sortBy: SongListSort.ID,
                                sortOrder: SortOrder.ASC,
                                startIndex: 0,
                                ...args.params,
                            },
                            serverId: serverId,
                        }),
                    ),
                );
            }

            const results = await Promise.all(promises);
            songs.push(...results.flatMap((r) => r.items));
            break;
        }

        case LibraryItem.PLAYLIST: {
            const promises: Promise<PlaylistSongListResponse>[] = [];

            for (const id of args.id) {
                promises.push(
                    queryClient.fetchQuery(
                        playlistsQueries.songList({
                            query: {
                                id: id,
                                ...args.params,
                            },
                            serverId: serverId,
                        }),
                    ),
                );
            }

            const results = await Promise.all(promises);

            songs.push(...results.flatMap((r) => r.items));
            break;
        }
    }

    return songs;
}

export const useIsPlayerFetching = () => {
    const fetcherCount = useIsFetching({ queryKey: queryKeys.player.fetch() });
    return fetcherCount > 0;
};
