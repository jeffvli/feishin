import { SetActivity, StatusDisplayType } from '@xhayper/discord-rpc';
import isElectron from 'is-electron';
import { useCallback, useEffect, useState } from 'react';

import { controller } from '/@/renderer/api/controller';
import {
    DiscordDisplayType,
    DiscordLinkType,
    getServerById,
    useAppStore,
    useDiscordSettings,
    useGeneralSettings,
    usePlayerStore,
} from '/@/renderer/store';
import { QueueSong, ServerType } from '/@/shared/types/domain-types';
import { PlayerStatus } from '/@/shared/types/types';

const discordRpc = isElectron() ? window.api.discordRpc : null;

export const useDiscordRpc = () => {
    const discordSettings = useDiscordSettings();
    const generalSettings = useGeneralSettings();
    const { privateMode } = useAppStore();
    const [lastUniqueId, setlastUniqueId] = useState('');

    const setActivity = useCallback(
        async (
            current: (number | PlayerStatus | QueueSong | undefined)[],
            previous: (number | PlayerStatus | QueueSong | undefined)[],
        ) => {
            if (
                !current[0] || // No track
                current[1] === 0 || // Start of track
                (current[2] === 'paused' && !discordSettings.showPaused) // Track paused with show paused setting disabled
            )
                return discordRpc?.clearActivity();

            // Handle change detection
            const song = current[0] as QueueSong;
            const trackChanged = lastUniqueId !== song.uniqueId;

            /*
                1. If the song has just started, update status
                2. If we jump more then 1.2 seconds from last state, update status to match
                3. If the current song id is completely different, update status
                4. If the player state changed, update status
            */
            if (
                previous[1] === 0 ||
                Math.abs((current[1] as number) - (previous[1] as number)) > 1.2 ||
                trackChanged ||
                current[2] !== previous[2]
            ) {
                if (trackChanged) setlastUniqueId(song.uniqueId);

                const start = Math.round(Date.now() - (current[1] as number) * 1000);
                const end = Math.round(start + song.duration);

                const artists = song?.artists.map((artist) => artist.name).join(', ');

                const statusDisplayMap = {
                    [DiscordDisplayType.ARTIST_NAME]: StatusDisplayType.STATE,
                    [DiscordDisplayType.FEISHIN]: StatusDisplayType.NAME,
                    [DiscordDisplayType.SONG_NAME]: StatusDisplayType.DETAILS,
                };

                const activity: SetActivity = {
                    details: song?.name.padEnd(2, ' ') || 'Idle',
                    instance: false,
                    largeImageKey: undefined,
                    largeImageText: song?.album || 'Unknown album',
                    smallImageKey: undefined,
                    smallImageText: current[2] as string,
                    state: artists || 'Unknown artist',
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

                if ((current[2] as PlayerStatus) === PlayerStatus.PLAYING) {
                    if (start && end) {
                        activity.startTimestamp = start;
                        activity.endTimestamp = end;
                    }

                    activity.smallImageKey = 'playing';
                } else {
                    activity.smallImageKey = 'paused';
                }

                if (discordSettings.showServerImage && song) {
                    if (song.serverType === ServerType.JELLYFIN && song.imageUrl) {
                        activity.largeImageKey = song.imageUrl;
                    } else if (song.serverType === ServerType.NAVIDROME) {
                        const server = getServerById(song.serverId);

                        try {
                            const info = await controller.getAlbumInfo({
                                apiClientProps: { server },
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
                if (!isConnected) await discordRpc?.initialize(discordSettings.clientId);

                discordRpc?.setActivity(activity);
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

    useEffect(() => {
        if (!discordSettings.enabled || privateMode) return discordRpc?.quit();

        return () => {
            discordRpc?.quit();
        };
    }, [discordSettings.clientId, privateMode, discordSettings.enabled]);

    useEffect(() => {
        if (!discordSettings.enabled || privateMode) return;
        const unsubSongChange = usePlayerStore.subscribe(
            (state) => [state.current.song, state.current.time, state.current.status],
            setActivity,
        );
        return () => {
            unsubSongChange();
        };
    }, [discordSettings.enabled, privateMode, setActivity]);
};
