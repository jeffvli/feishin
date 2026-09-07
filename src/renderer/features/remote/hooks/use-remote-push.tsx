import isElectron from 'is-electron';

import { getItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { useRemoteSettings } from '/@/renderer/store';
import { logger } from '/@/renderer/utils/logger';
import { LibraryItem } from '/@/shared/types/domain-types';
import { PlayerShuffle } from '/@/shared/types/types';

const remote = isElectron() ? window.api.remote : null;

/**
 * Outbound state push: local player events → remote WS clients. Split out of
 * use-remote.tsx to keep that file focused on inbound control handling.
 */
export const useRemotePush = () => {
    const remoteSettings = useRemoteSettings();
    const isRemoteEnabled = remoteSettings.enabled;

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
        // isRemoteEnabled is read inside every callback above via closure —
        // an empty deps array would freeze that read at whatever it was on
        // first mount, so toggling Remote Control on later (without an app
        // restart) would never resume these pushes.
        [isRemoteEnabled],
    );
};

export const RemotePushHook = () => {
    useRemotePush();
    return null;
};
