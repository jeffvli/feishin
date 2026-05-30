import type { SetActivity } from '@xhayper/discord-rpc';

import isElectron from 'is-electron';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { api } from '/@/renderer/api';
import { useItemImageUrl } from '/@/renderer/components/item-image/item-image';
import { usePlayerEvents } from '/@/renderer/features/player/audio-player/hooks/use-player-events';
import {
    useIsRadioActive,
    useRadioPlayer,
} from '/@/renderer/features/radio/hooks/use-radio-player';
import {
    DiscordDisplayType,
    DiscordLinkType,
    useAppStore,
    useDiscordSettings,
    useLastfmApiKey,
    usePlayerSong,
    usePlayerStore,
    useSettingsStore,
    useTimestampStoreBase,
} from '/@/renderer/store';
import { sentenceCase } from '/@/renderer/utils';
import { LogCategory, logFn } from '/@/renderer/utils/logger';
import { logMsg } from '/@/renderer/utils/logger-message';
import { useDebouncedCallback } from '/@/shared/hooks/use-debounced-callback';
import { LibraryItem, QueueSong, ServerType } from '/@/shared/types/domain-types';
import { PlayerStatus } from '/@/shared/types/types';

const discordRpc = isElectron() ? window.api.discordRpc : null;

const DiscordStatusDisplayType = {
    DETAILS: 2,
    NAME: 0,
    STATE: 1,
} as const;

type ActivityState = [QueueSong | undefined, number, PlayerStatus];
type ActivityTrigger = 'initial' | 'interval' | 'seek' | 'status_change' | 'track_change';

const MAX_FIELD_LENGTH = 127;
const MAX_URL_LENGTH = 256;

const truncate = (field: string) =>
    field.length <= MAX_FIELD_LENGTH ? field : field.substring(0, MAX_FIELD_LENGTH - 1) + '…';

export const useDiscordRpc = () => {
    const discordSettings = useDiscordSettings();
    const lastfmApiKey = useLastfmApiKey();
    const privateMode = useAppStore((state) => state.privateMode);
    const [lastUniqueId, setlastUniqueId] = useState('');

    const isRadioActive = useIsRadioActive();
    const { isPlaying: isRadioPlaying, metadata: radioMetadata, stationName } = useRadioPlayer();

    const currentSong = usePlayerSong();
    const imageUrl = useItemImageUrl({
        id: currentSong?.imageId || undefined,
        imageUrl: currentSong?.imageUrl,
        itemType: LibraryItem.SONG,
        type: 'table',
        useRemoteUrl: true,
    });

    const imageUrlRef = useRef<null | string | undefined>(imageUrl);
    const previousEnabledRef = useRef<boolean>(discordSettings.enabled);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const discordEnabledRef = useRef<boolean>(discordSettings.enabled);
    const privateModeRef = useRef<boolean>(privateMode);

    useEffect(() => {
        imageUrlRef.current = imageUrl;
    }, [imageUrl]);

    useEffect(() => {
        discordEnabledRef.current = discordSettings.enabled;
    }, [discordSettings.enabled]);

    useEffect(() => {
        privateModeRef.current = privateMode;
    }, [privateMode]);

    const setActivity = useCallback(
        async (current: ActivityState, trigger: ActivityTrigger) => {
            const song = current[0];
            const trackChanged = song ? lastUniqueId !== song._uniqueId : false;

            const isPlayingRadio = isRadioActive && isRadioPlaying;
            const hasTrackOrRadio = Boolean(current[0]) || isPlayingRadio;

            if (
                !hasTrackOrRadio || // No track and not playing radio
                (current[2] === 'paused' && !discordSettings.showPaused) // Paused with show paused setting disabled
            ) {
                let reason: string;
                if (!hasTrackOrRadio) {
                    reason = current[0] ? 'no_track' : 'no_track_or_radio';
                } else if (current[1] === 0 && !isPlayingRadio) {
                    reason = 'start_of_track';
                } else {
                    reason = 'paused_with_show_paused_disabled';
                }

                logFn.debug(logMsg[LogCategory.EXTERNAL].discordRpcActivityCleared, {
                    category: LogCategory.EXTERNAL,
                    meta: {
                        reason,
                        status: current[2],
                        trigger,
                    },
                });
                return discordRpc?.clearActivity();
            }

            if (isPlayingRadio) {
                const title = radioMetadata?.title || stationName || 'Radio';
                const artist = radioMetadata?.artist || stationName || '';

                const activity: SetActivity = {
                    details: truncate(title),
                    instance: false,
                    largeImageKey: 'icon',
                    largeImageText: truncate(stationName || 'Radio'),
                    smallImageKey:
                        current[2] === PlayerStatus.PLAYING
                            ? discordSettings.showStateIcon
                                ? 'playing'
                                : undefined
                            : 'paused',
                    smallImageText:
                        current[2] === PlayerStatus.PLAYING
                            ? discordSettings.showStateIcon
                                ? sentenceCase(current[2])
                                : undefined
                            : sentenceCase(current[2]),
                    state: truncate(artist),
                    statusDisplayType: DiscordStatusDisplayType.STATE,
                    type: discordSettings.showAsListening ? 2 : 0,
                };

                const isConnected = await discordRpc?.isConnected();
                if (!isConnected) {
                    logFn.debug(logMsg[LogCategory.EXTERNAL].discordRpcInitialized, {
                        category: LogCategory.EXTERNAL,
                        meta: { clientId: discordSettings.clientId },
                    });
                    previousEnabledRef.current = true;
                    await discordRpc?.initialize(discordSettings.clientId);
                }

                logFn.debug(logMsg[LogCategory.EXTERNAL].discordRpcSetActivity, {
                    category: LogCategory.EXTERNAL,
                    meta: {
                        currentStatus: current[2],
                        reason: 'radio',
                        showAsListening: discordSettings.showAsListening,
                        stationName: stationName || 'Radio',
                        title,
                        trigger,
                    },
                });
                discordRpc?.setActivity(activity);
                return;
            }

            if (!song) {
                return;
            }

            if (trackChanged) {
                logFn.debug(logMsg[LogCategory.EXTERNAL].discordRpcTrackChanged, {
                    category: LogCategory.EXTERNAL,
                    meta: {
                        artistName: song.artists?.[0]?.name,
                        songId: song._uniqueId,
                        songName: song.name,
                    },
                });
                setlastUniqueId(song._uniqueId);
            }

            const reason = trigger;
            const start = Math.round(Date.now() - current[1] * 1000);
            const end = Math.round(start + song.duration);

            const artists = song?.artists.map((artist) => artist.name).join(', ');

            const statusDisplayMap = {
                [DiscordDisplayType.ARTIST_NAME]: DiscordStatusDisplayType.STATE,
                [DiscordDisplayType.FEISHIN]: DiscordStatusDisplayType.NAME,
                [DiscordDisplayType.SONG_NAME]: DiscordStatusDisplayType.DETAILS,
            };

            const activity: SetActivity = {
                details: truncate((song?.name && song.name.padEnd(2, ' ')) || 'Idle'),
                instance: false,
                largeImageKey: undefined,
                largeImageText: truncate(
                    (song?.album && song.album.padEnd(2, ' ')) || 'Unknown album',
                ),
                smallImageKey: undefined,
                smallImageText: undefined,
                state: truncate((artists && artists.padEnd(2, ' ')) || 'Unknown artist'),
                statusDisplayType: statusDisplayMap[discordSettings.displayType],
                // I would love to use the actual type as opposed to hardcoding to 2,
                // but manually installing the discord-types package appears to break things
                type: discordSettings.showAsListening ? 2 : 0,
            };

            if (
                (discordSettings.linkType == DiscordLinkType.LAST_FM ||
                    discordSettings.linkType == DiscordLinkType.MBZ_LAST_FM) &&
                song?.artistName
            ) {
                activity.stateUrl =
                    'https://www.last.fm/music/' + encodeURIComponent(song.artists[0].name);

                const detailsUrl =
                    'https://www.last.fm/music/' +
                    encodeURIComponent(song.albumArtists[0].name) +
                    '/' +
                    encodeURIComponent(song.album || '_') +
                    '/' +
                    encodeURIComponent(song.name);

                // The details URL has a max length, only set it if it doesn't exceed it
                if (detailsUrl.length <= MAX_URL_LENGTH) {
                    activity.detailsUrl = detailsUrl;
                }
            }

            if (
                discordSettings.linkType == DiscordLinkType.MBZ ||
                discordSettings.linkType == DiscordLinkType.MBZ_LAST_FM
            ) {
                if (song?.mbzTrackId) {
                    activity.detailsUrl = 'https://musicbrainz.org/track/' + song.mbzTrackId;
                } else if (song?.mbzRecordingId) {
                    activity.detailsUrl =
                        'https://musicbrainz.org/recording/' + song.mbzRecordingId;
                }
            }

            if (current[2] === PlayerStatus.PLAYING) {
                if (start && end) {
                    activity.startTimestamp = start;
                    activity.endTimestamp = end;
                }

                if (discordSettings.showStateIcon) {
                    activity.smallImageKey = 'playing';
                    activity.smallImageText = sentenceCase(current[2]);
                }
            } else {
                activity.smallImageKey = 'paused';
                activity.smallImageText = sentenceCase(current[2]);
            }

            if (discordSettings.showServerImage && song) {
                if (song._uniqueId === currentSong?._uniqueId && imageUrlRef.current) {
                    if (song._serverType === ServerType.JELLYFIN) {
                        activity.largeImageKey = imageUrlRef.current;
                    } else if (
                        song._serverType === ServerType.NAVIDROME ||
                        song._serverType === ServerType.SUBSONIC
                    ) {
                        try {
                            const info = await api.controller.getAlbumInfo({
                                apiClientProps: {
                                    forceRemoteUrl: true,
                                    serverId: song._serverId,
                                },
                                query: { id: song.albumId },
                            });

                            if (info.imageUrl) {
                                activity.largeImageKey = info.imageUrl;
                            }
                        } catch {
                            /* empty */
                        }
                    }
                }
            }

            if (
                activity.largeImageKey === undefined &&
                lastfmApiKey &&
                song?.album &&
                song?.albumArtists.length
            ) {
                const albumInfo = await fetch(
                    `https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=${lastfmApiKey}&artist=${encodeURIComponent(song.albumArtists[0].name)}&album=${encodeURIComponent(song.album)}&format=json`,
                );

                const albumInfoJson = await albumInfo.json();

                if (albumInfoJson.album?.image?.[3]['#text']) {
                    activity.largeImageKey = albumInfoJson.album.image[3]['#text'];
                }
            }

            // Fall back to default icon if not set
            if (!activity.largeImageKey) {
                activity.largeImageKey = 'icon';
            }

            // Initialize if needed
            const isConnected = await discordRpc?.isConnected();
            if (!isConnected) {
                logFn.debug(logMsg[LogCategory.EXTERNAL].discordRpcInitialized, {
                    category: LogCategory.EXTERNAL,
                    meta: {
                        clientId: discordSettings.clientId,
                    },
                });

                previousEnabledRef.current = true;

                await discordRpc?.initialize(discordSettings.clientId);
            }

            logFn.debug(logMsg[LogCategory.EXTERNAL].discordRpcSetActivity, {
                category: LogCategory.EXTERNAL,
                meta: {
                    albumName: song.album,
                    artistName: song.artists?.[0]?.name,
                    currentStatus: current[2],
                    currentTime: current[1],
                    displayType: discordSettings.displayType,
                    hasLargeImage: !!activity.largeImageKey,
                    hasTimestamps: !!(activity.startTimestamp && activity.endTimestamp),
                    reason,
                    showAsListening: discordSettings.showAsListening,
                    songName: song.name,
                    trackChanged,
                    trigger,
                },
            });
            discordRpc?.setActivity(activity);
        },
        [
            discordSettings.showAsListening,
            discordSettings.showServerImage,
            discordSettings.showStateIcon,
            discordSettings.showPaused,
            lastfmApiKey,
            discordSettings.clientId,
            discordSettings.displayType,
            discordSettings.linkType,
            lastUniqueId,
            currentSong?._uniqueId,
            isRadioActive,
            isRadioPlaying,
            radioMetadata?.artist,
            radioMetadata?.title,
            stationName,
        ],
    );

    const debouncedSetActivity = useDebouncedCallback(setActivity, 1000);

    // Quit Discord RPC if it was enabled and is now disabled
    useEffect(() => {
        if ((!discordSettings.enabled || privateMode) && Boolean(previousEnabledRef.current)) {
            logFn.info(logMsg[LogCategory.EXTERNAL].discordRpcQuit, {
                category: LogCategory.EXTERNAL,
                meta: {
                    enabled: discordSettings.enabled,
                    privateMode,
                },
            });

            previousEnabledRef.current = false;

            return discordRpc?.quit();
        }
    }, [discordSettings.clientId, privateMode, discordSettings.enabled]);

    const getCurrentActivityState = useCallback((): ActivityState => {
        const state = usePlayerStore.getState();
        return [
            state.getCurrentSong(),
            useTimestampStoreBase.getState().timestamp,
            state.player.status,
        ];
    }, []);

    const clearRefreshInterval = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const emitActivityUpdateRef = useRef<(next: ActivityState, trigger: ActivityTrigger) => void>(
        () => {},
    );

    const resetRefreshInterval = useCallback(() => {
        clearRefreshInterval();
        intervalRef.current = setInterval(() => {
            const current = getCurrentActivityState();
            emitActivityUpdateRef.current(current, 'interval');
        }, 15000);
    }, [clearRefreshInterval, getCurrentActivityState]);

    const emitActivityUpdate = useCallback(
        (next: ActivityState, trigger: ActivityTrigger) => {
            debouncedSetActivity(next, trigger);
            resetRefreshInterval();
        },
        [debouncedSetActivity, resetRefreshInterval],
    );

    useEffect(() => {
        emitActivityUpdateRef.current = emitActivityUpdate;
    }, [emitActivityUpdate]);

    useEffect(() => {
        if (!discordSettings.enabled || privateMode) {
            clearRefreshInterval();
            return;
        }

        const initialState = getCurrentActivityState();
        emitActivityUpdate(initialState, 'initial');

        return () => {
            clearRefreshInterval();
        };
    }, [
        clearRefreshInterval,
        discordSettings.enabled,
        emitActivityUpdate,
        getCurrentActivityState,
        privateMode,
    ]);

    usePlayerEvents(
        {
            onCurrentSongChange: ({ song }) => {
                if (!discordEnabledRef.current || privateModeRef.current) {
                    return;
                }

                const playerState = usePlayerStore.getState();
                const activityState: ActivityState = [
                    song,
                    useTimestampStoreBase.getState().timestamp,
                    playerState.player.status,
                ];
                emitActivityUpdateRef.current(activityState, 'track_change');
            },
            onPlayerSeekToTimestamp: ({ timestamp }) => {
                if (!discordEnabledRef.current || privateModeRef.current) {
                    return;
                }

                const playerState = usePlayerStore.getState();
                const activityState: ActivityState = [
                    playerState.getCurrentSong(),
                    timestamp,
                    playerState.player.status,
                ];
                emitActivityUpdateRef.current(activityState, 'seek');
            },
            onPlayerStatus: ({ status }) => {
                if (!discordEnabledRef.current || privateModeRef.current) {
                    return;
                }

                const playerState = usePlayerStore.getState();
                const activityState: ActivityState = [
                    playerState.getCurrentSong(),
                    useTimestampStoreBase.getState().timestamp,
                    status,
                ];
                emitActivityUpdateRef.current(activityState, 'status_change');
            },
        },
        [],
    );
};

const DiscordRpcHookInner = () => {
    useDiscordRpc();
    return null;
};

export const DiscordRpcHook = () => {
    const isElectronEnv = isElectron();
    const isDiscordRpcEnabled = useSettingsStore((state) => state.discord.enabled);
    const isPrivateMode = useAppStore((state) => state.privateMode);
    const discordRpc = isElectronEnv ? window.api.discordRpc : null;

    if (!isElectronEnv || !discordRpc || !isDiscordRpcEnabled || isPrivateMode) {
        return null;
    }

    return React.createElement(DiscordRpcHookInner);
};
