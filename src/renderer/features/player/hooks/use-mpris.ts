import isElectron from 'is-electron';
import React, { useEffect, useMemo } from 'react';

import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import {
    useIsRadioActive,
    useRadioPlayer,
} from '/@/renderer/features/radio/hooks/use-radio-player';
import { usePlayerSong, usePlayerStore } from '/@/renderer/store';
import { LibraryItem, QueueSong } from '/@/shared/types/domain-types';
import { PlayerShuffle, ServerType } from '/@/shared/types/types';

const ipc = isElectron() ? window.api.ipc : null;
const utils = isElectron() ? window.api.utils : null;
const mpris = isElectron() && (utils?.isLinux() || utils?.isMacOS()) ? window.api.mpris : null;

export const useMPRIS = () => {
    const player = usePlayerStore();
    const currentSong = usePlayerSong();
    const isRadioActive = useIsRadioActive();
    const { isPlaying: isRadioPlaying, metadata: radioMetadata, stationName } = useRadioPlayer();

    const imageUrl = useItemImageUrl({
        id: currentSong?.imageId || undefined,
        imageUrl: currentSong?.imageUrl,
        itemType: LibraryItem.SONG,
        type: 'itemCard',
    });

    const radioSong = useMemo((): QueueSong | undefined => {
        if (!isRadioActive || !isRadioPlaying) {
            return undefined;
        }

        const title = radioMetadata?.title || stationName || 'Radio';
        const artist = radioMetadata?.artist || stationName || null;
        const album = stationName || null;

        const radioId = `radio-${stationName || 'unknown'}`;

        return {
            _itemType: LibraryItem.SONG,
            _serverId: '',
            _serverType: ServerType.NAVIDROME,
            _uniqueId: radioId,
            album: album || null,
            albumArtistName: artist || '',
            albumArtists: artist
                ? [
                      {
                          id: '',
                          imageId: null,
                          imageUrl: null,
                          name: artist,
                          userFavorite: false,
                          userRating: null,
                      },
                  ]
                : [],
            albumId: '',
            artistName: artist || '',
            artists: artist
                ? [
                      {
                          id: '',
                          imageId: null,
                          imageUrl: null,
                          name: artist,
                          userFavorite: false,
                          userRating: null,
                      },
                  ]
                : [],
            bitDepth: null,
            bitRate: 0,
            bpm: null,
            channels: null,
            comment: null,
            compilation: null,
            container: null,
            createdAt: '',
            discNumber: 0,
            discSubtitle: null,
            duration: 0,
            explicitStatus: null,
            gain: null,
            genres: [],
            id: radioId,
            imageId: null,
            imageUrl: null,
            lastPlayedAt: null,
            lyrics: null,
            mbzRecordingId: null,
            mbzTrackId: null,
            name: title,
            participants: null,
            path: null,
            peak: null,
            playCount: 0,
            releaseDate: null,
            releaseYear: null,
            sampleRate: null,
            size: 0,
            sortName: title,
            tags: null,
            trackNumber: 0,
            trackSubtitle: null,
            updatedAt: new Date().toISOString(),
            userFavorite: false,
            userRating: null,
        };
    }, [isRadioActive, isRadioPlaying, radioMetadata, stationName]);

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

        mpris?.requestVolume((_e: unknown, data: { volume: number }) => {
            player.setVolume(data.volume);
        });

        return () => {
            ipc?.removeAllListeners('mpris-request-toggle-repeat');
            ipc?.removeAllListeners('mpris-request-toggle-shuffle');
            ipc?.removeAllListeners('request-position');
            ipc?.removeAllListeners('request-seek');
            ipc?.removeAllListeners('request-volume');
        };
    }, [player]);

    // Update MPRIS when song, imageUrl, or radio metadata changes
    useEffect(() => {
        if (!mpris) {
            return;
        }

        // Use radio song if radio is active and playing, otherwise use current song
        const songToUpdate = isRadioActive && isRadioPlaying ? radioSong : currentSong;
        const imageUrlToUpdate = isRadioActive && isRadioPlaying ? null : imageUrl;

        mpris?.updateSong(songToUpdate, imageUrlToUpdate);
    }, [currentSong, imageUrl, isRadioActive, isRadioPlaying, radioSong]);

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

const MPRISHookInner = () => {
    useMPRIS();
    return null;
};

export const MPRISHook = () => {
    const isElectronEnv = isElectron();
    const utils = isElectronEnv ? window.api.utils : null;
    const mpris = isElectronEnv && (utils?.isLinux() || utils?.isMacOS()) ? window.api.mpris : null;

    if (mpris === null) {
        return null;
    }

    return React.createElement(MPRISHookInner);
};
