import isElectron from 'is-electron';
import { useEffect, useRef } from 'react';

import { getItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { useCreateFavorite } from '/@/renderer/features/shared/mutations/create-favorite-mutation';
import { useDeleteFavorite } from '/@/renderer/features/shared/mutations/delete-favorite-mutation';
import { useSetRating } from '/@/renderer/features/shared/mutations/set-rating-mutation';
import { usePlayerActions, usePlayerStore, useRemoteSettings } from '/@/renderer/store';
import { LogCategory, logFn } from '/@/renderer/utils/logger';
import { logMsg } from '/@/renderer/utils/logger-message';
import { toast } from '/@/shared/components/toast/toast';
import { LibraryItem } from '/@/shared/types/domain-types';
import { PlayerShuffle } from '/@/shared/types/types';

const remote = isElectron() ? window.api.remote : null;
const ipc = isElectron() ? window.api.ipc : null;

export const useRemote = () => {
    const { mediaSkipForward, setVolume } = usePlayerActions();
    const player = usePlayerStore();

    const remoteSettings = useRemoteSettings();
    const updateRatingMutation = useSetRating({});
    const addToFavoritesMutation = useCreateFavorite({});
    const removeFromFavoritesMutation = useDeleteFavorite({});

    const isRemoteEnabled = remoteSettings.enabled;

    // Initialize the remote
    useEffect(() => {
        if (!isRemoteEnabled) {
            return;
        }

        logFn.debug(logMsg[LogCategory.REMOTE].initializingRemoteSettings, {
            category: LogCategory.REMOTE,
            meta: {
                enabled: remoteSettings.enabled,
                port: remoteSettings.port,
                username: remoteSettings.username,
            },
        });

        remote
            ?.updateSetting(
                remoteSettings.enabled,
                remoteSettings.port,
                remoteSettings.username,
                remoteSettings.password,
            )
            .catch((error) => {
                logFn.error(logMsg[LogCategory.REMOTE].failedToEnableRemote, {
                    category: LogCategory.REMOTE,
                    meta: { error },
                });
                toast.warn({ message: error, title: 'Failed to enable remote' });
            });
        // We only want to fire this once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!isRemoteEnabled || !remote) {
            return;
        }

        remote.requestPosition((_e: unknown, data: { position: number }) => {
            logFn.debug(logMsg[LogCategory.REMOTE].requestPositionReceived, {
                category: LogCategory.REMOTE,
                meta: { position: data.position },
            });
            const newTime = data.position;
            player.mediaSeekToTimestamp(newTime);
        });

        remote.requestSeek((_e: unknown, data: { offset: number }) => {
            logFn.debug(logMsg[LogCategory.REMOTE].requestSeekReceived, {
                category: LogCategory.REMOTE,
                meta: { offset: data.offset },
            });
            mediaSkipForward(data.offset);
        });

        remote.requestRating(
            (_e: unknown, data: { id: string; rating: number; serverId: string }) => {
                logFn.debug(logMsg[LogCategory.REMOTE].requestRatingReceived, {
                    category: LogCategory.REMOTE,
                    meta: { id: data.id, rating: data.rating, serverId: data.serverId },
                });
                updateRatingMutation.mutate({
                    apiClientProps: { serverId: data.serverId },
                    query: {
                        id: [data.id],
                        rating: data.rating,
                        type: LibraryItem.SONG,
                    },
                });
            },
        );

        remote.requestVolume((_e: unknown, data: { volume: number }) => {
            logFn.debug(logMsg[LogCategory.REMOTE].requestVolumeReceived, {
                category: LogCategory.REMOTE,
                meta: { volume: data.volume },
            });
            setVolume(data.volume);
        });

        remote.requestFavorite(
            (_e: unknown, data: { favorite: boolean; id: string; serverId: string }) => {
                logFn.debug(logMsg[LogCategory.REMOTE].requestFavoriteReceived, {
                    category: LogCategory.REMOTE,
                    meta: { favorite: data.favorite, id: data.id, serverId: data.serverId },
                });
                const mutator = data.favorite
                    ? addToFavoritesMutation
                    : removeFromFavoritesMutation;
                mutator.mutate({
                    apiClientProps: { serverId: data.serverId },
                    query: {
                        id: [data.id],
                        type: LibraryItem.SONG,
                    },
                });
            },
        );

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
        updateRatingMutation,
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
            logFn.debug(logMsg[LogCategory.REMOTE].sendingInitialSong, {
                category: LogCategory.REMOTE,
                meta: {
                    artistName: currentSong.artistName,
                    id: currentSong.id,
                    name: currentSong.name,
                },
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
            remote.updateSong({ ...currentSong, imageUrl });
        }
    }, [isRemoteEnabled, player]);

    usePlayerEvents(
        {
            onCurrentSongChange: (properties) => {
                if (!isRemoteEnabled || !remote) {
                    return;
                }

                logFn.debug(logMsg[LogCategory.REMOTE].updateSongSent, {
                    category: LogCategory.REMOTE,
                    meta: {
                        artistName: properties.song?.artistName,
                        id: properties.song?.id,
                        index: properties.index,
                        name: properties.song?.name,
                    },
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
                    remote.updateSong({ ...song, imageUrl });
                } else {
                    remote.updateSong(undefined);
                }
            },
            onPlayerProgress: (properties) => {
                if (!isRemoteEnabled || !remote) {
                    return;
                }

                logFn.debug(logMsg[LogCategory.REMOTE].updatePositionSent, {
                    category: LogCategory.REMOTE,
                    meta: { timestamp: properties.timestamp },
                });
                remote.updatePosition(properties.timestamp);
            },
            onPlayerRepeat: (properties) => {
                if (!isRemoteEnabled || !remote) {
                    return;
                }

                logFn.debug(logMsg[LogCategory.REMOTE].updateRepeatSent, {
                    category: LogCategory.REMOTE,
                    meta: { repeat: properties.repeat },
                });
                remote.updateRepeat(properties.repeat);
            },
            onPlayerShuffle: (properties) => {
                if (!isRemoteEnabled || !remote) {
                    return;
                }

                const isShuffleEnabled = properties.shuffle !== PlayerShuffle.NONE;
                logFn.debug(logMsg[LogCategory.REMOTE].updateShuffleSent, {
                    category: LogCategory.REMOTE,
                    meta: { isShuffleEnabled, shuffle: properties.shuffle },
                });
                remote.updateShuffle(isShuffleEnabled);
            },
            onPlayerStatus: (properties) => {
                if (!isRemoteEnabled || !remote) {
                    return;
                }

                logFn.debug(logMsg[LogCategory.REMOTE].updatePlaybackSent, {
                    category: LogCategory.REMOTE,
                    meta: { status: properties.status },
                });
                remote.updatePlayback(properties.status);
            },
            onPlayerVolume: (properties) => {
                if (!isRemoteEnabled || !remote) {
                    return;
                }

                logFn.debug(logMsg[LogCategory.REMOTE].updateVolumeSent, {
                    category: LogCategory.REMOTE,
                    meta: { volume: properties.volume },
                });
                remote.updateVolume(properties.volume);
            },
            onUserFavorite: (properties) => {
                if (!isRemoteEnabled || !remote) {
                    return;
                }

                logFn.debug(logMsg[LogCategory.REMOTE].updateFavoriteSent, {
                    category: LogCategory.REMOTE,
                    meta: {
                        favorite: properties.favorite,
                        id: properties.id,
                        serverId: properties.serverId,
                    },
                });
                remote.updateFavorite(properties.favorite, properties.serverId, properties.id);
            },
            onUserRating: (properties) => {
                if (!isRemoteEnabled || !remote) {
                    return;
                }

                logFn.debug(logMsg[LogCategory.REMOTE].updateRatingSent, {
                    category: LogCategory.REMOTE,
                    meta: {
                        id: properties.id,
                        rating: properties.rating || 0,
                        serverId: properties.serverId,
                    },
                });
                remote.updateRating(properties.rating || 0, properties.serverId, properties.id);
            },
        },
        [],
    );
};
