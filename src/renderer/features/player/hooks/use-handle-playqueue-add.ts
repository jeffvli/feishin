import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    getPublicServer,
    useCurrentServer,
    usePlayerControls,
    usePlayerStore,
} from '/@/renderer/store';
import { usePlaybackType } from '/@/renderer/store/settings.store';
import {
    PlayQueueAddOptions,
    Play,
    PlaybackType,
    PlayerStatus,
    PlayerShuffle,
} from '/@/renderer/types';
import { toast } from '/@/renderer/components/toast/index';
import isElectron from 'is-electron';
import { nanoid } from 'nanoid/non-secure';
import {
    LibraryItem,
    QueueSong,
    Song,
    SongListResponse,
    instanceOfCancellationError,
} from '/@/renderer/api/types';
import {
    getPlaylistSongsById,
    getSongById,
    getAlbumSongsById,
    getAlbumArtistSongsById,
    getSongsByQuery,
    getGenreSongsById,
} from '/@/renderer/features/player/utils';
import { queryKeys } from '/@/renderer/api/query-keys';
import { useTranslation } from 'react-i18next';

const getRootQueryKey = (itemType: LibraryItem, serverId: string) => {
    let queryKey;

    switch (itemType) {
        case LibraryItem.ALBUM:
            queryKey = queryKeys.songs.list(serverId);
            break;
        case LibraryItem.ALBUM_ARTIST:
            queryKey = queryKeys.songs.list(serverId);
            break;
        case LibraryItem.GENRE:
            queryKey = queryKeys.songs.list(serverId);
            break;
        case LibraryItem.PLAYLIST:
            queryKey = queryKeys.playlists.songList(serverId);
            break;
        case LibraryItem.SONG:
            queryKey = queryKeys.songs.list(serverId);
            break;
        default:
            queryKey = queryKeys.songs.list(serverId);
            break;
    }

    return queryKey;
};

const mpvPlayer = isElectron() ? window.electron.mpvPlayer : null;
const remote = isElectron() ? window.electron.remote : null;

const addToQueue = usePlayerStore.getState().actions.addToQueue;

export const useHandlePlayQueueAdd = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const playbackType = usePlaybackType();
    const userServer = useCurrentServer();
    const publicServer = getPublicServer();
    const { play } = usePlayerControls();
    const timeoutIds = useRef<Record<string, ReturnType<typeof setTimeout>> | null>({});

    const handlePlayQueueAdd = useCallback(
        async (options: PlayQueueAddOptions) => {
            const { initialIndex, initialSongId, playType, byData, byItemType, query, publicNd } =
                options;
            const server = publicNd ? publicServer : userServer;
            if (!server) return toast.error({ message: 'No server selected', type: 'error' });
            let songs: QueueSong[] | null = null;
            let initialSongIndex = 0;

            if (byItemType) {
                let songList: SongListResponse | undefined;
                const { type: itemType, id } = byItemType;

                const fetchId = nanoid();
                timeoutIds.current = {
                    ...timeoutIds.current,
                    [fetchId]: setTimeout(() => {
                        toast.info({
                            autoClose: false,
                            id: fetchId,
                            message: t('player.playbackFetchCancel', {
                                postProcess: 'sentenceCase',
                            }),
                            onClose: () => {
                                queryClient.cancelQueries({
                                    exact: false,
                                    queryKey: getRootQueryKey(itemType, server?.id),
                                });
                            },
                            title: t('player.playbackFetchInProgress', {
                                postProcess: 'sentenceCase',
                            }),
                        });
                    }, 2000),
                };

                try {
                    if (itemType === LibraryItem.PLAYLIST) {
                        songList = await getPlaylistSongsById({
                            id: id?.[0],
                            query,
                            queryClient,
                            server,
                        });
                    } else if (itemType === LibraryItem.ALBUM) {
                        songList = await getAlbumSongsById({ id, query, queryClient, server });
                    } else if (itemType === LibraryItem.ALBUM_ARTIST) {
                        songList = await getAlbumArtistSongsById({
                            id,
                            query,
                            queryClient,
                            server,
                        });
                    } else if (itemType === LibraryItem.GENRE) {
                        songList = await getGenreSongsById({ id, query, queryClient, server });
                    } else if (itemType === LibraryItem.SONG) {
                        if (id?.length === 1) {
                            songList = await getSongById({ id: id?.[0], queryClient, server });
                        } else {
                            songList = await getSongsByQuery({ query, queryClient, server });
                        }
                    }

                    clearTimeout(timeoutIds.current[fetchId] as ReturnType<typeof setTimeout>);
                    delete timeoutIds.current[fetchId];
                    toast.hide(fetchId);
                } catch (err: any) {
                    if (instanceOfCancellationError(err)) {
                        return null;
                    }

                    clearTimeout(timeoutIds.current[fetchId] as ReturnType<typeof setTimeout>);
                    delete timeoutIds.current[fetchId];
                    toast.hide(fetchId);

                    return toast.error({
                        message: err.message,
                        title: t('error.genericError', { postProcess: 'sentenceCase' }) as string,
                    });
                }

                songs =
                    songList?.items?.map((song: Song) => ({ ...song, uniqueId: nanoid() })) || null;
            } else if (byData) {
                songs = byData.map((song) => ({ ...song, uniqueId: nanoid() })) || null;
            }

            if (!songs || songs?.length === 0)
                return toast.warn({
                    message: t('common.noResultsFromQuery', { postProcess: 'sentenceCase' }),
                    title: t('player.playbackFetchNoResults'),
                });

            if (initialIndex) {
                initialSongIndex = initialIndex;
            } else if (initialSongId) {
                initialSongIndex = songs.findIndex((song) => song.id === initialSongId);
            }

            const hadSong = usePlayerStore.getState().queue.default.length > 0;
            const playerData = addToQueue({ initialIndex: initialSongIndex, playType, songs });

            if (playbackType === PlaybackType.LOCAL) {
                mpvPlayer!.volume(usePlayerStore.getState().volume);

                if (playType === Play.NOW || !hadSong) {
                    mpvPlayer!.pause();
                    mpvPlayer!.setQueue(playerData, false);
                } else {
                    mpvPlayer!.setQueueNext(playerData);
                }
            }

            // We should only play if the queue was empty, or we are doing play NOW
            // (override the queue).
            if (playType === Play.NOW || !hadSong) {
                play();
            }

            remote?.updateSong({
                currentTime: usePlayerStore.getState().current.time,
                repeat: usePlayerStore.getState().repeat,
                shuffle: usePlayerStore.getState().shuffle !== PlayerShuffle.NONE,
                song: playerData.current.song,
                status: PlayerStatus.PLAYING,
            });

            return null;
        },
        [play, playbackType, queryClient, userServer, publicServer, t],
    );

    return handlePlayQueueAdd;
};
