import type { QueueSong, Song } from '/@/shared/types/domain-types';

import { api } from '/@/renderer/api';
import { isNativeApp, sourMedia } from '/@/renderer/features/sour/mobile/android';
import { usePhoneStore } from '/@/renderer/features/sour/mobile/phone-store';

// Offline listening: songs of chosen playlists are saved on the phone, and the player uses the saved
// copy instead of streaming whenever there is one. The Android / iPhone apps keep them as files; the
// web app (Hermes Music's /app/, the iPhone Home Screen app) keeps them in the browser's storage.

// the web app served by Hermes Music (Safari > Add to Home Screen on an iPhone)
export const isWebApp = () => !isNativeApp() && window.location.pathname.startsWith('/app/');
export const offlineAvailable = () => isNativeApp() || isWebApp();

const CACHE = 'sour-offline';
const cacheKey = (id: string) => `/app/__offline/${encodeURIComponent(id)}`;
// song id -> a blob: link to its saved copy (made when the app starts, so playing is instant)
const webUrls = new Map<string, string>();

export const loadWebOffline = async () => {
    if (!isWebApp() || !('caches' in window)) return;
    navigator.storage?.persist?.().catch(() => false); // ask the browser not to clear them
    const cache = await caches.open(CACHE);
    for (const id of Object.keys(usePhoneStore.getState().offline)) {
        if (webUrls.has(id)) continue;
        const hit = await cache.match(cacheKey(id));
        if (hit) webUrls.set(id, URL.createObjectURL(await hit.blob()));
    }
};

const saveCopy = async (
    song: Song,
    url: string,
): Promise<null | { path: string; size: number }> => {
    if (isNativeApp()) {
        const ext = (song.container || 'mp3').toLowerCase();
        return sourMedia('saveOffline', { ext, id: song.id, url }).catch(() => null);
    }
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const blob = await res.blob();
        const cache = await caches.open(CACHE);
        await cache.put(
            cacheKey(song.id),
            new Response(blob, { headers: { 'content-type': blob.type || 'audio/mpeg' } }),
        );
        webUrls.set(song.id, URL.createObjectURL(blob));
        return { path: song.id, size: blob.size };
    } catch {
        return null; // offline, or the phone is out of space
    }
};

const removeCopy = async (id: string) => {
    if (isNativeApp()) return sourMedia('removeOffline', { id }).catch(() => undefined);
    const link = webUrls.get(id);
    if (link) URL.revokeObjectURL(link);
    webUrls.delete(id);
    if ('caches' in window) await (await caches.open(CACHE)).delete(cacheKey(id));
    return undefined;
};

const fileUrl = (path: string) => {
    const cap = (window as any).Capacitor;
    return cap?.convertFileSrc ? cap.convertFileSrc(`file://${path}`) : `file://${path}`;
};

// the saved copy of a song, if there is one (used by the player for every song it plays)
export const offlineUrl = (song?: null | QueueSong | { id: string }): string | undefined => {
    if (!song) return undefined;
    if (isWebApp()) return webUrls.get(song.id);
    if (!isNativeApp()) return undefined;
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
    if (!isNativeApp()) {
        // browsers on iPhone don't tell; Android Chrome does
        const type = (navigator as any).connection?.type;
        return type !== 'cellular';
    }
    const net = await sourMedia('network').catch(() => ({ type: 'wifi' }));
    return net.type === 'wifi';
};

// downloads whatever the offline playlists still miss (one at a time, respecting Wi-Fi only and the
// size limit)
export const syncOffline = async () => {
    if (running || !offlineAvailable()) return;
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
                const saved = await saveCopy(song, url);
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
        else await removeCopy(id);
    }
    usePhoneStore.setState({ offline: keep, offlinePlaylists: rest });
};

export const clearOffline = async () => {
    if (isNativeApp()) await sourMedia('clearOffline').catch(() => undefined);
    else {
        for (const link of webUrls.values()) URL.revokeObjectURL(link);
        webUrls.clear();
        if ('caches' in window) await caches.delete(CACHE);
    }
    usePhoneStore.setState({ offline: {}, offlinePlaylists: {} });
};
