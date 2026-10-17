import type { QueueSong, Song } from '/@/shared/types/domain-types';

import { api } from '/@/renderer/api';
import { isAndroidApp, sourMedia } from '/@/renderer/features/sour/mobile/android';
import { usePhoneStore } from '/@/renderer/features/sour/mobile/phone-store';

// Offline listening on Android: songs of chosen playlists are saved in the app's own storage, and
// the player uses the saved file instead of streaming whenever there is one.

const fileUrl = (path: string) => {
    const cap = (window as any).Capacitor;
    return cap?.convertFileSrc ? cap.convertFileSrc(`file://${path}`) : `file://${path}`;
};

// the saved copy of a song, if there is one (used by the player for every song it plays)
export const offlineUrl = (song?: null | QueueSong | { id: string }): string | undefined => {
    if (!song || !isAndroidApp()) return undefined;
    const saved = usePhoneStore.getState().offline[song.id];
    return saved ? fileUrl(saved.path) : undefined;
};

export const offlineBytes = () =>
    Object.values(usePhoneStore.getState().offline).reduce((n, s) => n + (s.size || 0), 0);

let running = false;
let progress: (text: string) => void = () => undefined;
export const onOfflineProgress = (fn: (text: string) => void) => {
    progress = fn;
};

const onWifi = async () => {
    const net = await sourMedia('network').catch(() => ({ type: 'wifi' }));
    return net.type === 'wifi';
};

// downloads whatever the offline playlists still miss (one at a time, respecting Wi-Fi only and the
// size limit)
export const syncOffline = async () => {
    if (running || !isAndroidApp()) return;
    running = true;
    try {
        const state = usePhoneStore.getState();
        const { offlineLimitMb, offlineWifiOnly } = state.settings;
        if (offlineWifiOnly && !(await onWifi())) {
            progress('Waiting for Wi-Fi to download');
            return;
        }
        for (const [playlistId, serverId] of Object.entries(state.offlinePlaylists)) {
            const res = await api.controller
                .getPlaylistSongList({
                    apiClientProps: { serverId },
                    query: { id: playlistId },
                } as any)
                .catch(() => null);
            const songs: Song[] = (res as any)?.items ?? [];
            for (const song of songs) {
                const now = usePhoneStore.getState();
                if (!now.offlinePlaylists[playlistId]) break; // turned off meanwhile
                const have = now.offline[song.id];
                if (have) {
                    if (!have.playlists.includes(playlistId)) {
                        usePhoneStore.setState((s) => ({
                            offline: {
                                ...s.offline,
                                [song.id]: { ...have, playlists: [...have.playlists, playlistId] },
                            },
                        }));
                    }
                    continue;
                }
                if (offlineBytes() > offlineLimitMb * 1024 * 1024) {
                    progress('Storage limit reached (change it in Offline)');
                    return;
                }
                if (offlineWifiOnly && !(await onWifi())) {
                    progress('Waiting for Wi-Fi to download');
                    return;
                }
                progress(`Downloading ${song.name}`);
                const url = await api.controller.getStreamUrl({
                    apiClientProps: { serverId: song._serverId },
                    query: { id: song.id, transcode: false } as any,
                });
                const ext = (song.container || 'mp3').toLowerCase();
                const saved = await sourMedia('saveOffline', { ext, id: song.id, url }).catch(
                    () => null,
                );
                if (!saved) continue;
                usePhoneStore.setState((s) => ({
                    offline: {
                        ...s.offline,
                        [song.id]: {
                            path: saved.path,
                            playlists: [playlistId],
                            size: saved.size,
                            song,
                        },
                    },
                }));
            }
        }
        progress('All offline playlists are saved');
    } finally {
        running = false;
    }
};

export const setPlaylistOffline = async (playlistId: string, serverId: string, on: boolean) => {
    if (on) {
        usePhoneStore.setState((s) => ({
            offlinePlaylists: { ...s.offlinePlaylists, [playlistId]: serverId },
        }));
        syncOffline();
        return;
    }
    const { offline, offlinePlaylists } = usePhoneStore.getState();
    const rest = { ...offlinePlaylists };
    delete rest[playlistId];
    const keep: typeof offline = {};
    for (const [id, item] of Object.entries(offline)) {
        const playlists = item.playlists.filter((p) => p !== playlistId);
        if (playlists.length) keep[id] = { ...item, playlists };
        else await sourMedia('removeOffline', { id }).catch(() => undefined);
    }
    usePhoneStore.setState({ offline: keep, offlinePlaylists: rest });
};

export const clearOffline = async () => {
    await sourMedia('clearOffline').catch(() => undefined);
    usePhoneStore.setState({ offline: {}, offlinePlaylists: {} });
};
