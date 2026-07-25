import isElectron from 'is-electron';
import { useEffect, useRef } from 'react';

import { getItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { useSetRating } from '/@/renderer/features/shared/hooks/use-set-rating';
import { useCreateFavorite } from '/@/renderer/features/shared/mutations/create-favorite-mutation';
import { useDeleteFavorite } from '/@/renderer/features/shared/mutations/delete-favorite-mutation';
import { usePlayerActions, usePlayerStore, useRemoteSettings } from '/@/renderer/store';
import { logger } from '/@/renderer/utils/logger';
import { toast } from '/@/shared/components/toast/toast';
import { LibraryItem } from '/@/shared/types/domain-types';
import { PlayerShuffle } from '/@/shared/types/types';

const remote = isElectron() ? window.api.remote : null;
const ipc = isElectron() ? window.api.ipc : null;

export const useRemote = () => {
    const { mediaSkipForward, setVolume } = usePlayerActions();
    const player = usePlayerStore();

    const remoteSettings = useRemoteSettings();
    const setRating = useSetRating();
    const addToFavoritesMutation = useCreateFavorite({});
    const removeFromFavoritesMutation = useDeleteFavorite({});

    const isRemoteEnabled = remoteSettings.enabled;

    // Initialize the remote
    useEffect(() => {
        // we must send this EVEN IF the remote is disabled, as this is what
        // makes sure that the main process gets the port/username/password on startup

        logger.info('Initializing remote settings', {
            enabled: remoteSettings.enabled,
            port: remoteSettings.port,
            username: remoteSettings.username,
        });

        remote
            ?.updateSetting(
                remoteSettings.enabled,
                remoteSettings.port,
                remoteSettings.username,
                remoteSettings.password,
            )
            .catch((error) => {
                logger.error('Failed to enable remote', { error });
                toast.warn({ message: error, title: 'Failed to enable remote' });
            });
        // We only want to fire this once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!isRemoteEnabled || !remote) {
            return;
        }

        remote.requestPosition((data: { position: number }) => {
            logger.debug('Request position received', { position: data.position });
            const newTime = data.position;
            player.mediaSeekToTimestamp(newTime);
        });

        remote.requestSeek((data: { offset: number }) => {
            logger.debug('Request seek received', { offset: data.offset });
            mediaSkipForward(data.offset);
        });

        remote.requestRating((data: { id: string; rating: number; serverId: string }) => {
            logger.debug('Request rating received', {
                id: data.id,
                rating: data.rating,
                serverId: data.serverId,
            });
            setRating(data.serverId, [data.id], LibraryItem.SONG, data.rating);
        });

        remote.requestVolume((data: { volume: number }) => {
            logger.debug('Request volume received', { volume: data.volume });
            setVolume(data.volume);
        });

        remote.requestFavorite((data: { favorite: boolean; id: string; serverId: string }) => {
            logger.debug('Request favorite received', {
                favorite: data.favorite,
                id: data.id,
                serverId: data.serverId,
            });
            const mutator = data.favorite ? addToFavoritesMutation : removeFromFavoritesMutation;
            mutator.mutate({
                apiClientProps: { serverId: data.serverId },
                query: {
                    id: [data.id],
                    type: LibraryItem.SONG,
                },
            });
        });

        return () => {
            ipc?.removeAllListeners('request-position');
            ipc?.removeAllListeners('request-seek');
            ipc?.removeAllListeners('request-volume');
            ipc?.removeAllListeners('request-favorite');
            ipc?.removeAllListeners('request-rating');
        };
    }, [
        addToFavoritesMutation,
        isRemoteEnabled,
        mediaSkipForward,
        player,
        removeFromFavoritesMutation,
        setVolume,
        setRating,
    ]);

    // Send initial song if one is already playing
    const isInitializedRef = useRef(false);
    useEffect(() => {
        if (isInitializedRef.current || !isRemoteEnabled || !remote) {
            return;
        }

        isInitializedRef.current = true;

        const currentSong = player.getCurrentSong();

        if (currentSong) {
            logger.debug('Sending initial song', {
                artistName: currentSong.artistName,
                id: currentSong.id,
                name: currentSong.name,
            });

            const imageUrl =
                getItemImageUrl({
                    id: currentSong.id,
                    imageUrl: currentSong.imageUrl,
                    itemType: LibraryItem.SONG,
                    serverId: currentSong._serverId,
                    type: 'itemCard',
                    useRemoteUrl: true,
                }) || null;

            remote.updateSong(currentSong, imageUrl);
        }
    }, [isRemoteEnabled, player]);

    usePlayerEvents(
        {
            onCurrentSongChange: (properties) => {
                if (!isRemoteEnabled || !remote) {
                    return;
                }

                logger.debug('Update song sent', {
                    artistName: properties.song?.artistName,
                    id: properties.song?.id,
                    index: properties.index,
                    name: properties.song?.name,
                });
                if (properties.song) {
                    const song = properties.song;
                    const imageUrl =
                        getItemImageUrl({
                            id: song.id,
                            imageUrl: song.imageUrl,
                            itemType: LibraryItem.SONG,
                            serverId: song._serverId,
                            type: 'itemCard',
                            useRemoteUrl: true,
                        }) || null;

                    remote.updateSong(song, imageUrl);
                } else {
                    remote.updateSong(undefined);
                }
            },
            onPlayerProgress: (properties) => {
                if (!isRemoteEnabled || !remote) {
                    return;
                }

                logger.debug('Update position sent', { timestamp: properties.timestamp });
                remote.updatePosition(properties.timestamp);
            },
            onPlayerRepeat: (properties) => {
                if (!isRemoteEnabled || !remote) {
                    return;
                }

                logger.debug('Update repeat sent', { repeat: properties.repeat });
                remote.updateRepeat(properties.repeat);
            },
            onPlayerShuffle: (properties) => {
                if (!isRemoteEnabled || !remote) {
                    return;
                }

                const isShuffleEnabled = properties.shuffle !== PlayerShuffle.NONE;
                logger.debug('Update shuffle sent', {
                    isShuffleEnabled,
                    shuffle: properties.shuffle,
                });
                remote.updateShuffle(isShuffleEnabled);
            },
            onPlayerStatus: (properties) => {
                if (!isRemoteEnabled || !remote) {
                    return;
                }

                logger.debug('Update playback sent', { status: properties.status });
                remote.updatePlayback(properties.status);
            },
            onPlayerVolume: (properties) => {
                if (!isRemoteEnabled || !remote) {
                    return;
                }

                logger.debug('Update volume sent', { volume: properties.volume });
                remote.updateVolume(properties.volume);
            },
            onUserFavorite: (properties) => {
                if (!isRemoteEnabled || !remote) {
                    return;
                }

                logger.debug('Update favorite sent', {
                    favorite: properties.favorite,
                    id: properties.id,
                    serverId: properties.serverId,
                });
                remote.updateFavorite(properties.favorite, properties.serverId, properties.id);
            },
            onUserRating: (properties) => {
                if (!isRemoteEnabled || !remote) {
                    return;
                }

                logger.debug('Update rating sent', {
                    id: properties.id,
                    rating: properties.rating || 0,
                    serverId: properties.serverId,
                });
                remote.updateRating(properties.rating || 0, properties.serverId, properties.id);
            },
        },
        [],
    );
};

export const RemoteHook = () => {
    useRemote();
    return null;
};
