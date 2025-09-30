import { SetActivity, StatusDisplayType } from '@xhayper/discord-rpc';
import isElectron from 'is-electron';
import { useCallback, useEffect, useState } from 'react';

import { controller } from '/@/renderer/api/controller';
import {
    DiscordDisplayType,
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
                !current[0] ||
                current[1] === 0 ||
                (current[2] === 'paused' && !discordSettings.showPaused)
            ) {
                return discordRpc?.clearActivity();
            }

            const song = current[0] as QueueSong;
            const trackChanged = lastUniqueId !== song.uniqueId;

            if (
                previous[1] === 0 ||
                Math.abs((current[1] as number) - (previous[1] as number)) > 1.2 ||
                trackChanged ||
                current[2] !== previous[2]
            ) {
                if (trackChanged) setlastUniqueId(song.uniqueId);

                const start = Math.round(Date.now() - (current[1] as number) * 1000);
                const end = Math.round(start + song.duration);
                const artists = song?.artists.map((a) => a.name).join(', ');

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
                    type: discordSettings.showAsListening ? 2 : 0,
                };

                // Decide small image icon
                if ((current[2] as PlayerStatus) === PlayerStatus.PLAYING) {
                    if (start && end) {
                        activity.startTimestamp = start;
                        activity.endTimestamp = end;
                    }

                    if (discordSettings.showPaused) {
                        activity.smallImageKey = 'playing';
                        activity.smallImageText = String(current[2] ?? '');
                    } else {
                        activity.smallImageKey = discordSettings.useAppIconWhenNotPaused
                            ? 'icon'
                            : 'playing';
                        activity.smallImageText = discordSettings.useAppIconWhenNotPaused
                            ? 'Feishin'
                            : String(current[2] ?? '');
                    }
                } else if ((current[2] as PlayerStatus) === PlayerStatus.PAUSED) {
                    if (discordSettings.showPaused) {
                        activity.smallImageKey = 'paused';
                    }
                }

                // Load large image from Jellyfin, Navidrome, or Last.fm
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
                            if (info.imageUrl) activity.largeImageKey = info.imageUrl;
                        } catch {}
                    }
                }

                if (
                    !activity.largeImageKey &&
                    generalSettings.lastfmApiKey &&
                    song.album &&
                    song.albumArtists.length
                ) {
                    try {
                        const albumInfo = await fetch(
                            `https://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=${generalSettings.lastfmApiKey}&artist=${encodeURIComponent(song.albumArtists[0].name)}&album=${encodeURIComponent(song.album)}&format=json`,
                        );
                        const albumInfoJson = await albumInfo.json();
                        const img = albumInfoJson.album?.image?.[3]?.['#text'];
                        if (img) activity.largeImageKey = img;
                    } catch {}
                }

                if (!activity.largeImageKey) {
                    activity.largeImageKey = 'icon';
                }

                const isConnected = await discordRpc?.isConnected();
                if (!isConnected) {
                    await discordRpc?.initialize(discordSettings.clientId);
                }

                discordRpc?.setActivity(activity);
            }
        },
        [
            discordSettings.showAsListening,
            discordSettings.showServerImage,
            discordSettings.showPaused,
            discordSettings.useAppIconWhenNotPaused, // ✅ Include in deps
            generalSettings.lastfmApiKey,
            discordSettings.clientId,
            discordSettings.displayType,
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
