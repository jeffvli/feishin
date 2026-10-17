import { useEffect, useRef } from 'react';
import { create } from 'zustand';

import { api } from '/@/renderer/api';
import { groupApi } from '/@/renderer/features/group-play/api/group-play-api';
import { useGroupPlayStore } from '/@/renderer/features/group-play/store/group-play.store';
import { openRequestWindow } from '/@/renderer/features/hermes-request/components/request-button';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { onSourMedia, sourMedia } from '/@/renderer/features/sour/mobile/android';
import { syncOffline } from '/@/renderer/features/sour/mobile/offline';
import { phoneNet, usePhoneStore } from '/@/renderer/features/sour/mobile/phone-store';
import { useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { leaveListenAlongFirst, startListenAlong } from '/@/renderer/features/sour/utils/switching';
import { useCurrentServer, usePlayerStoreBase } from '/@/renderer/store';
import { toast } from '/@/shared/components/toast/toast';
import { LibraryItem, PlaylistListSort, SortOrder } from '/@/shared/types/domain-types';
import { Play, PlayerShuffle, PlayerStatus } from '/@/shared/types/types';

// Everything only the Android app does in the background: links shared to it, the Quick Settings
// tiles, headphones and the car, voice search from Android Auto, shake / flip gestures,
// notifications, the data saver's connection check and offline downloads.

export const useDriving = create<{ open: boolean }>(() => ({ open: false }));
export const openDriving = () => useDriving.setState({ open: true });

// QR codes: "sourplayer:listen:<profile id>:<name>" and "sourplayer:group:<code>"
export const listenCode = (id: string, name: string) => `sourplayer:listen:${id}:${name}`;
export const groupCode = (code: string) => `sourplayer:group:${code}`;

export const useScannedCode = () => {
    const url = useHermesUrl();
    const me = useSourStore((s) => s.me);
    return async (text: string) => {
        const [scheme, kind, a, ...rest] = text.split(':');
        if (scheme !== 'sourplayer') {
            toast.error({ message: "That isn't a Sour Player code" });
            return;
        }
        if (kind === 'listen' && a) {
            await startListenAlong({ id: a, name: rest.join(':') || 'your friend' });
            return;
        }
        if (kind === 'group' && a) {
            if (!(await leaveListenAlongFirst())) return;
            const { actions, userName } = useGroupPlayStore.getState();
            try {
                const res = await groupApi.join(url, a, userName.trim() || 'Guest', me?.id ?? null);
                actions.setSession({ code: a, member: res.member, role: 'member' });
                actions.setState(res.state);
                useGroupPlayStore.setState({ panelOpen: true });
            } catch (error) {
                toast.error({ message: (error as Error).message });
            }
        }
    };
};

// the first link in what was shared (Spotify, YouTube...), or the text itself
const sharedQuery = (text: string) => text.match(/https?:\/\/\S+/)?.[0] ?? text.trim();

// "Hey Google, play ... on Sour Player" / Android Auto search: a playlist by name, else songs
const playSearch = async (raw: string, player: ReturnType<typeof usePlayer>, serverId?: string) => {
    if (!serverId) return;
    const query = raw.replace(/\b(play|playlist|on sour player|sour player)\b/gi, '').trim();
    try {
        if (!query) {
            player.mediaPlay();
            return;
        }
        const lists = await api.controller.getPlaylistList({
            apiClientProps: { serverId },
            query: { sortBy: PlaylistListSort.NAME, sortOrder: SortOrder.ASC, startIndex: 0 },
        } as any);
        const wanted = query.toLowerCase();
        const list = ((lists as any)?.items ?? []).find((p: { name: string }) =>
            p.name.toLowerCase().includes(wanted),
        );
        if (list) {
            player.addToQueueByFetch(serverId, [list.id], LibraryItem.PLAYLIST, Play.NOW);
            return;
        }
        const found = await api.controller.search({
            apiClientProps: { serverId },
            query: {
                albumArtistLimit: 0,
                albumArtistStartIndex: 0,
                albumLimit: 0,
                albumStartIndex: 0,
                query,
                songLimit: 25,
                songStartIndex: 0,
            },
        } as any);
        const songs = (found as any)?.songs ?? [];
        if (songs.length) player.addToQueueByData(songs, Play.NOW);
    } catch {
        // nothing found or offline
    }
};

export const PhoneFeatures = () => {
    const player = usePlayer();
    const playerRef = useRef(player);
    playerRef.current = player;
    const url = useHermesUrl();
    const urlRef = useRef(url);
    urlRef.current = url;
    const server = useCurrentServer();
    const serverRef = useRef(server);
    serverRef.current = server;
    const me = useSourStore((s) => s.me);
    const meRef = useRef(me);
    meRef.current = me;

    // shared links become Hermes Music requests; the tiles open the right thing
    useEffect(() => {
        const handle = async (intent: { text?: string; type: string }) => {
            if (intent.type === 'request') {
                openRequestWindow();
                return;
            }
            if (intent.type === 'driving') {
                openDriving();
                return;
            }
            if (intent.type !== 'share' || !intent.text) return;
            if (!urlRef.current) {
                toast.error({ message: 'Add your Hermes Music address in Settings first' });
                return;
            }
            const query = sharedQuery(intent.text);
            try {
                const res = await fetch(`${urlRef.current}/api/requests`, {
                    body: JSON.stringify({
                        by: useGroupPlayStore.getState().userName.trim() || undefined,
                        profile: meRef.current?.id,
                        query,
                    }),
                    headers: { 'content-type': 'application/json' },
                    method: 'POST',
                });
                const json = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(json.error || 'Hermes Music said no');
                toast.success({
                    message: json.imported
                        ? `Requested ${json.imported} playlists`
                        : `Requested ${json.title || query}`,
                });
            } catch (error) {
                toast.error({ message: (error as Error).message });
            }
        };
        sourMedia('takeIntent')
            .then((r) => r?.intent && handle(r.intent))
            .catch(() => undefined);
        return onSourMedia('intent', handle);
    }, []);

    // headphones, Bluetooth and the car
    useEffect(() => {
        const offDevice = onSourMedia(
            'device',
            (e: { bluetooth: boolean; connected: boolean; name: string }) => {
                const { autoResume, carDevices, drivingAuto } = usePhoneStore.getState().settings;
                if (!e.connected) return; // pausing is handled by "noisy" below
                if (autoResume) playerRef.current.mediaPlay();
                if (e.bluetooth && drivingAuto && carDevices.includes(e.name)) openDriving();
                (window as any).__sourLastBluetooth = e.bluetooth ? e.name : undefined;
            },
        );
        const offAction = onSourMedia('action', (e: { action: string; query?: string }) => {
            if (e.action === 'noisy') playerRef.current.mediaPause();
            if (e.action === 'search' && e.query !== undefined)
                playSearch(e.query, playerRef.current, serverRef.current?.id);
        });
        return () => {
            offDevice();
            offAction();
        };
    }, []);

    // connection type (data saver, offline on Wi-Fi only) and offline downloads
    useEffect(() => {
        const check = () =>
            sourMedia('network')
                .then((n) => {
                    const was = phoneNet.type;
                    phoneNet.type = n.type;
                    if (was !== 'wifi' && n.type === 'wifi') syncOffline();
                })
                .catch(() => undefined);
        check();
        const t1 = window.setInterval(check, 30000);
        const t2 = window.setInterval(() => syncOffline(), 15 * 60000);
        window.setTimeout(() => syncOffline(), 20000);
        return () => {
            window.clearInterval(t1);
            window.clearInterval(t2);
        };
    }, []);

    // shake to shuffle or skip, flip the phone over to pause (and back to play)
    useEffect(() => {
        let lastShake = 0;
        let shakes: number[] = [];
        let downSince = 0;
        let upSince = 0;
        let pausedByFlip = false;
        const onMotion = (e: DeviceMotionEvent) => {
            const { flipToPause, shake } = usePhoneStore.getState().settings;
            const now = Date.now();
            const a = e.acceleration;
            if (shake !== 'off' && a && a.x !== null && a.y !== null && a.z !== null) {
                const force = Math.hypot(a.x, a.y, a.z);
                if (force > 22) {
                    shakes = [...shakes.filter((t) => now - t < 700), now];
                    if (shakes.length >= 2 && now - lastShake > 2000) {
                        lastShake = now;
                        shakes = [];
                        const p = playerRef.current;
                        if (shake === 'shuffle') {
                            usePlayerStoreBase.getState().setShuffle(PlayerShuffle.TRACK);
                            toast.success({ message: 'Shuffled' });
                        }
                        p.mediaNext(false);
                    }
                }
            }
            const g = e.accelerationIncludingGravity;
            if (!flipToPause || !g || g.z === null) return;
            const playing = usePlayerStoreBase.getState().player.status === PlayerStatus.PLAYING;
            if (g.z < -8) {
                upSince = 0;
                if (!downSince) downSince = now;
                if (playing && now - downSince > 800) {
                    pausedByFlip = true;
                    playerRef.current.mediaPause();
                }
            } else if (g.z > 6) {
                downSince = 0;
                if (!upSince) upSince = now;
                if (pausedByFlip && now - upSince > 600) {
                    pausedByFlip = false;
                    playerRef.current.mediaPlay();
                }
            }
        };
        window.addEventListener('devicemotion', onMotion);
        return () => window.removeEventListener('devicemotion', onMotion);
    }, []);

    // notifications: your requests are ready, a followed artist's new release, a friend's Group Play
    useEffect(() => {
        const seenDone = new Set<string>();
        const groupsSeen = new Map<string, string>();
        let first = true;
        const poll = async () => {
            const base = urlRef.current;
            const mine = meRef.current?.id;
            if (!base || !mine) return;
            const settings = usePhoneStore.getState().settings;
            try {
                const list: {
                    artist?: string;
                    askedBy?: string;
                    id: string;
                    profile?: string;
                    query: string;
                    status: string;
                    title?: string;
                }[] = await fetch(`${base}/api/requests`).then((r) => r.json());
                for (const r of list) {
                    if (r.status !== 'done' || r.profile !== mine || seenDone.has(r.id)) continue;
                    seenDone.add(r.id);
                    if (first) continue;
                    const name = r.title
                        ? `${r.artist ? `${r.artist} - ` : ''}${r.title}`
                        : r.query;
                    if (r.askedBy?.endsWith('(new release)')) {
                        if (settings.notifyFollows)
                            sourMedia('notify', { id: r.id, text: name, title: 'New release' });
                    } else if (settings.notifyRequests) {
                        sourMedia('notify', {
                            id: r.id,
                            text: name,
                            title: 'Your request is ready',
                        });
                    }
                }
                const people = await fetch(`${base}/api/profiles`).then((r) => r.json());
                for (const p of (people.profiles ?? people) as {
                    group?: null | { code: string; name: string };
                    id: string;
                    name: string;
                    online?: boolean;
                }[]) {
                    if (p.id === mine) continue;
                    const code = p.online && p.group ? p.group.code : '';
                    const before = groupsSeen.get(p.id);
                    groupsSeen.set(p.id, code);
                    if (first || !code || before === code) continue;
                    if (settings.notifyGroups && useGroupPlayStore.getState().code !== code) {
                        sourMedia('notify', {
                            id: `group-${p.id}-${code}`,
                            text: `${p.group?.name} - open Group Play to join`,
                            title: `${p.name} is in Group Play`,
                        });
                    }
                }
                first = false;
            } catch {
                // offline
            }
        };
        poll();
        const timer = window.setInterval(poll, 60000);
        return () => window.clearInterval(timer);
    }, []);

    return null;
};
