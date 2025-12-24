import isElectron from 'is-electron';
import { useEffect } from 'react';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import { usePlayerSong, usePlayerStore } from '/@/renderer/store';
import { LibraryItem } from '/@/shared/types/domain-types';
import { PlayerShuffle } from '/@/shared/types/types';

const ipc = isElectron() ? window.api.ipc : null;
const utils = isElectron() ? window.api.utils : null;
const mpris = isElectron() && utils?.isLinux() ? window.api.mpris : null;

export const useMPRIS = () => {
    const player = usePlayerStore();
    const currentSong = usePlayerSong();

    const imageUrl = useItemImageUrl({
        id: currentSong?.id,
        imageUrl: currentSong?.imageUrl,
        itemType: LibraryItem.SONG,
        type: 'itemCard',
    });

    useEffect(() => {
        if (!mpris) {
            return;
        }

        mpris?.requestPosition((_e: unknown, data: { position: number }) => {
            player.mediaSeekToTimestamp(data.position);
        });

        mpris?.requestSeek((_e: unknown, data: { offset: number }) => {
            player.mediaSkipForward(data.offset);
        });

        mpris?.requestToggleRepeat(() => {
            player.toggleRepeat();
        });

        mpris?.requestToggleShuffle(() => {
            player.toggleShuffle();
        });

        return () => {
            ipc?.removeAllListeners('mpris-request-toggle-repeat');
            ipc?.removeAllListeners('mpris-request-toggle-shuffle');
            ipc?.removeAllListeners('request-position');
            ipc?.removeAllListeners('request-seek');
        };
    }, [player]);

    // Update MPRIS when song or imageUrl changes
    useEffect(() => {
        if (!mpris) {
            return;
        }

        mpris?.updateSong(currentSong, imageUrl);
    }, [currentSong, imageUrl]);

    usePlayerEvents(
        {
            onCurrentSongChange: () => {
                // The effect above will handle the update when currentSong changes
            },
            onPlayerProgress: (properties) => {
                if (!mpris) {
                    return;
                }

                const timestamp = properties.timestamp;
                mpris?.updatePosition(timestamp);
            },
            onPlayerRepeat: (properties) => {
                if (!mpris) {
                    return;
                }

                mpris?.updateRepeat(properties.repeat);
            },
            onPlayerSeek: (properties) => {
                if (!mpris) {
                    return;
                }

                const seconds = properties.seconds;
                mpris?.updateSeek(seconds);
            },
            onPlayerShuffle: (properties) => {
                if (!mpris) {
                    return;
                }

                const isShuffleEnabled = properties.shuffle !== PlayerShuffle.NONE;
                mpris?.updateShuffle(isShuffleEnabled);
            },
            onPlayerStatus: (properties) => {
                if (!mpris) {
                    return;
                }

                mpris?.updateStatus(properties.status);
            },
            onPlayerVolume: (properties) => {
                if (!mpris) {
                    return;
                }

                mpris?.updateVolume(properties.volume);
            },
        },
        [],
    );
};
