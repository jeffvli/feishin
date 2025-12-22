import { SetActivity, StatusDisplayType } from '@xhayper/discord-rpc';
import isElectron from 'is-electron';
import { useCallback, useEffect, useRef, useState } from 'react';

import { controller } from '/@/renderer/api/controller';
import {
    DiscordDisplayType,
    DiscordLinkType,
    useAppStore,
    useDiscordSettings,
    useGeneralSettings,
    usePlayerStore,
    useTimestampStoreBase,
} from '/@/renderer/store';
import { sentenceCase } from '/@/renderer/utils';
import { LogCategory, logFn } from '/@/renderer/utils/logger';
import { logMsg } from '/@/renderer/utils/logger-message';
import { useDebouncedCallback } from '/@/shared/hooks/use-debounced-callback';
import { QueueSong, ServerType } from '/@/shared/types/domain-types';
import { PlayerStatus } from '/@/shared/types/types';

const discordRpc = isElectron() ? window.api.discordRpc : null;
type ActivityState = [QueueSong | undefined, number, PlayerStatus];

const MAX_FIELD_LENGTH = 127;

const truncate = (field: string) =>
    field.length <= MAX_FIELD_LENGTH ? field : field.substring(0, MAX_FIELD_LENGTH - 1) + '…';

export const useDiscordRpc = () => {
    const discordSettings = useDiscordSettings();
    const generalSettings = useGeneralSettings();
    const privateMode = useAppStore((state) => state.privateMode);
    const [lastUniqueId, setlastUniqueId] = useState('');

    const previousEnabledRef = useRef<boolean>(discordSettings.enabled);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const previousActivityStateRef = useRef<ActivityState | null>(null);

    const setActivity = useCallback(
        async (current: ActivityState, previous: ActivityState) => {
            // Check if track changed by comparing with previous state
            const song = current[0];
            const previousSong = previous[0];
            const trackChangedByState =
                song && previousSong
                    ? song._uniqueId !== previousSong._uniqueId
                    : song !== previousSong;
            const trackChanged = song ? lastUniqueId !== song._uniqueId : false;

            if (
                !current[0] || // No track
                (current[2] === 'paused' && !discordSettings.showPaused) // Track paused with show paused setting disabled
            ) {
                let reason: string;
                if (!current[0]) {
                    reason = 'no_track';
                } else if (current[1] === 0) {
                    reason = 'start_of_track';
                } else {
                    reason = 'paused_with_show_paused_disabled';
                }

                logFn.debug(logMsg[LogCategory.EXTERNAL].discordRpcActivityCleared, {
                    category: LogCategory.EXTERNAL,
                    meta: {
                        reason,
                        status: current[2],
                    },
                });
                return discordRpc?.clearActivity();
            }

            if (!song) {
                return;
            }

            /*
                1. If the song has just started, update status
                2. If we jump more then 1.2 seconds from last state, update status to match
                3. If the current song id is completely different, update status
                4. If the player state changed, update status
            */
            if (
                previous[1] === 0 ||
                Math.abs(current[1] - previous[1]) > 1.2 ||
                trackChangedByState ||
                trackChanged ||
                current[2] !== previous[2]
            ) {
                if (trackChangedByState || trackChanged) {
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

                let reason: string;
                if (trackChangedByState || trackChanged) {
                    reason = 'track_changed';
                } else if (previous[1] === 0) {
                    reason = 'song_started';
                } else if (Math.abs(current[1] - previous[1]) > 1.2) {
                    reason = 'time_jump';
                } else {
                    reason = 'player_state_changed';
                }

                const start = Math.round(Date.now() - current[1] * 1000);
                const end = Math.round(start + song.duration);

                const artists = song?.artists.map((artist) => artist.name).join(', ');

                const statusDisplayMap = {
                    [DiscordDisplayType.ARTIST_NAME]: StatusDisplayType.STATE,
                    [DiscordDisplayType.FEISHIN]: StatusDisplayType.NAME,
                    [DiscordDisplayType.SONG_NAME]: StatusDisplayType.DETAILS,
                };

                const activity: SetActivity = {
                    details: truncate((song?.name && song.name.padEnd(2, ' ')) || 'Idle'),
                    instance: false,
                    largeImageKey: undefined,
                    largeImageText: truncate(
                        (song?.album && song.album.padEnd(2, ' ')) || 'Unknown album',
                    ),
                    smallImageKey: undefined,
                    smallImageText: sentenceCase(current[2]),
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
                    activity.detailsUrl =
                        'https://www.last.fm/music/' +
                        encodeURIComponent(song.albumArtists[0].name) +
                        '/' +
                        encodeURIComponent(song.album || '_') +
                        '/' +
                        encodeURIComponent(song.name);
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

                    activity.smallImageKey = 'playing';
                } else {
                    activity.smallImageKey = 'paused';
                }

                if (discordSettings.showServerImage && song) {
                    if (song._serverType === ServerType.JELLYFIN && song.imageUrl) {
                        activity.largeImageKey = song.imageUrl;
                    } else if (song._serverType === ServerType.NAVIDROME) {
                        try {
                            const info = await controller.getAlbumInfo({
                                apiClientProps: { serverId: song._serverId },
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

                if (
                    activity.largeImageKey === undefined &&
                    generalSettings.lastfmApiKey &&
                    song?.album &&
                    song?.albumArtists.length
                ) {
                    const albumInfo = await fetch(
                        `https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=${generalSettings.lastfmApiKey}&artist=${encodeURIComponent(song.albumArtists[0].name)}&album=${encodeURIComponent(song.album)}&format=json`,
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
                        previousStatus: previous[2],
                        previousTime: previous[1],
                        reason,
                        showAsListening: discordSettings.showAsListening,
                        songName: song.name,
                        trackChanged: trackChangedByState || trackChanged,
                    },
                });
                discordRpc?.setActivity(activity);
            } else {
                logFn.debug(logMsg[LogCategory.EXTERNAL].discordRpcUpdateSkipped, {
                    category: LogCategory.EXTERNAL,
                    meta: {
                        currentStatus: current[2],
                        currentTime: current[1],
                        previousStatus: previous[2],
                        previousTime: previous[1],
                        timeDiff: Math.abs(current[1] - previous[1]),
                        trackChanged: trackChangedByState || trackChanged,
                    },
                });
            }
        },
        [
            discordSettings.showAsListening,
            discordSettings.showServerImage,
            discordSettings.showPaused,
            generalSettings.lastfmApiKey,
            discordSettings.clientId,
            discordSettings.displayType,
            discordSettings.linkType,
            lastUniqueId,
        ],
    );

    const debouncedSetActivity = useDebouncedCallback(setActivity, 500);

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

    useEffect(() => {
        if (!discordSettings.enabled || privateMode) {
            return;
        }

        const getCurrentActivityState = (): ActivityState => {
            const state = usePlayerStore.getState();
            const currentSong = state.getCurrentSong();
            const currentTime = useTimestampStoreBase.getState().timestamp;
            const status = state.player.status;
            return [currentSong, currentTime, status];
        };

        const resetInterval = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            intervalRef.current = setInterval(() => {
                const current = getCurrentActivityState();
                const previous = previousActivityStateRef.current || current;
                debouncedSetActivity(current, previous);
                previousActivityStateRef.current = current;
            }, 15000);
        };

        resetInterval();

        const initialState = getCurrentActivityState();
        let previousUniqueId = initialState[0]?._uniqueId || '';

        previousActivityStateRef.current = initialState;

        // Set activity immediately when Discord RPC is enabled
        debouncedSetActivity(initialState, initialState);

        const unsubSongChange = usePlayerStore.subscribe(
            (state): ActivityState => {
                const currentSong = state.getCurrentSong();
                const currentTime = useTimestampStoreBase.getState().timestamp;
                const status = state.player.status;

                return [currentSong, currentTime, status];
            },
            (current, previous) => {
                const currentUniqueId = current[0]?._uniqueId || '';
                const trackChanged = previousUniqueId !== currentUniqueId;

                if (trackChanged && current[0]) {
                    resetInterval();
                    previousUniqueId = currentUniqueId;
                }

                const activity: ActivityState = [
                    current[0] as QueueSong,
                    current[1] as number,
                    current[2] as PlayerStatus,
                ];

                // Use the ref as the source of truth for previous state
                const previousActivity: ActivityState =
                    previousActivityStateRef.current ||
                    (previous
                        ? [
                              previous[0] as QueueSong,
                              previous[1] as number,
                              previous[2] as PlayerStatus,
                          ]
                        : activity);

                debouncedSetActivity(activity, previousActivity);

                previousActivityStateRef.current = activity;
            },
        );

        return () => {
            unsubSongChange();
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [
        debouncedSetActivity,
        discordSettings.clientId,
        discordSettings.enabled,
        privateMode,
        setActivity,
    ]);
};
