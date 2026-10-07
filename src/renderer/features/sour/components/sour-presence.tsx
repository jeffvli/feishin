import { useEffect, useRef } from 'react';

import { toGroupSong } from '/@/renderer/features/group-play/api/group-play-api';
import { useGroupPlayStore } from '/@/renderer/features/group-play/store/group-play.store';
import { usePlayCountStore } from '/@/renderer/features/hermes-plays/store/play-count.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { sourApi } from '/@/renderer/features/sour/api/sour-api';
import { deviceId } from '/@/renderer/features/sour/components/social';
import { useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { useCurrentServer } from '/@/renderer/store';
import { useAuthStore } from '/@/renderer/store/auth.store';
import { usePlayerStoreBase } from '/@/renderer/store/player.store';
import { useTimestampStoreBase } from '/@/renderer/store/timestamp.store';
import { toast } from '/@/shared/components/toast/toast';
import { ServerType } from '/@/shared/types/domain-types';
import { PlayerStatus } from '/@/shared/types/types';

// Your profile is your Navidrome account: Sour Player signs in to Hermes Music with the music server login
// (Hermes Music checks it with Navidrome), so every computer you log into gets the same profile. An older
// profile made on this computer joins the account's profile. Then it tells Hermes Music every 15 seconds that
// you're online, what you're listening to and where (for listen along and resume), and which group
// you're in. Songs you hid from your activity are never sent. Every 10 minutes your recent plays
// are shown on your profile.
export const SourPresence = () => {
    const url = useHermesUrl();
    const me = useSourStore((state) => state.me);
    const server = useCurrentServer();
    const account = server?.username?.trim().toLowerCase() || '';
    // the login token the app already uses for the music server (Hermes Music checks it with Navidrome)
    const credential = useAuthStore((state) => state.currentServer?.credential) || '';
    const canLink = !!credential && server?.type !== ServerType.JELLYFIN;
    const warned = useRef('');

    useEffect(() => {
        if (!url || !server) return undefined;
        if (!canLink) {
            // Jellyfin logins can't be checked by Hermes Music: a profile just for this computer
            if (!me) {
                const name =
                    useGroupPlayStore.getState().userName.trim() || server.username || 'Listener';
                sourApi
                    .register(url, name)
                    .then((res) => useSourStore.getState().setMe({ id: res.id, key: res.key }))
                    .catch(() => {});
            }
            return undefined;
        }
        if (me && me.account === account) return undefined;
        let stopped = false;
        let retry: ReturnType<typeof setTimeout> | undefined;
        const signIn = () => {
            const before = useSourStore.getState().me;
            sourApi
                .navidrome(url, {
                    credential,
                    key: before?.key,
                    name: useGroupPlayStore.getState().userName.trim() || server.username,
                    profile: before?.id,
                })
                .then((res) => {
                    if (stopped) return;
                    useSourStore
                        .getState()
                        .setMe({ account: res.account, id: res.id, key: res.key });
                    useGroupPlayStore.getState().actions.setUserName(res.profile.name);
                    if (res.merged || (before && !before.account)) {
                        toast.success({
                            message: `Your Sour profile is now tied to your Navidrome account (${res.account}) and works on every computer you sign in to`,
                        });
                    } else if (before && before.id !== res.id) {
                        toast.info({ message: `Signed in to Sour as ${res.profile.name}` });
                    }
                })
                .catch((error: Error) => {
                    if (stopped) return;
                    if (/not found|no such profile|returned 404/i.test(error.message)) {
                        // Hermes Music from before accounts: keep (or make) a profile for this computer
                        if (!before) {
                            const name =
                                useGroupPlayStore.getState().userName.trim() ||
                                server.username ||
                                'Listener';
                            sourApi
                                .register(url, name)
                                .then((res) =>
                                    useSourStore.getState().setMe({ id: res.id, key: res.key }),
                                )
                                .catch(() => {});
                        }
                        return;
                    }
                    if (warned.current !== error.message) {
                        warned.current = error.message;
                        toast.warn({ message: `Sour profile: ${error.message}` });
                    }
                    retry = setTimeout(signIn, 120000);
                });
        };
        signIn();
        return () => {
            stopped = true;
            if (retry) clearTimeout(retry);
        };
        // me?.account / me?.id are what matter; the whole object changes on every key refresh
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [account, canLink, credential, me?.account, me?.id, server?.id, url]);

    useEffect(() => {
        if (!url || !me) return undefined;
        let hidden: string[] = [];
        const refreshHidden = () =>
            sourApi
                .me(url, me)
                .then((p) => {
                    hidden = p.custom?.hiddenSongs ?? [];
                })
                .catch(() => {});
        refreshHidden();
        const beat = () => {
            const player = usePlayerStoreBase.getState();
            const song = player.getCurrentSong();
            const shown = song && !hidden.includes(song.id) ? song : null;
            const group = useGroupPlayStore.getState().state;
            sourApi
                .presence(url, me, {
                    device: deviceId(),
                    group: group && !group.ended ? { code: group.code, name: group.name } : null,
                    listening: shown ? toGroupSong(shown) : null,
                    playing: player.player.status === PlayerStatus.PLAYING,
                    position: useTimestampStoreBase.getState().timestamp,
                })
                .catch((error: Error) => {
                    // Hermes Music was reset or this is a different one: sign in again (unless this
                    // computer already switched profiles, e.g. it just joined its Navidrome account)
                    if (
                        /unknown profile/.test(error.message) &&
                        useSourStore.getState().me?.id === me.id
                    )
                        useSourStore.getState().setMe(null);
                });
        };
        // your last plays on your profile (merged into the latest profile so nothing else is lost)
        const publishRecent = async () => {
            const plays = Object.values(usePlayCountStore.getState().plays)
                .filter((p) => !hidden.includes(p.id))
                .sort((a, b) => b.last - a.last)
                .slice(0, 10)
                .map((p) => ({
                    album: p.album,
                    artist: p.artist,
                    duration: p.duration ?? 0,
                    id: p.id,
                    imageId: p.imageId,
                    title: p.name,
                }));
            if (!plays.length) return;
            const profile = await sourApi.me(url, me).catch(() => null);
            if (!profile) return;
            const before = (profile.custom?.recentPlays ?? []).map((s) => s.id).join();
            if (before === plays.map((s) => s.id).join()) return;
            await sourApi
                .update(url, me, { custom: { ...profile.custom, recentPlays: plays } })
                .catch(() => {});
        };
        beat();
        const timer = setInterval(beat, 15000);
        const hiddenTimer = setInterval(refreshHidden, 120000);
        const recentTimer = setInterval(publishRecent, 10 * 60000);
        return () => {
            clearInterval(timer);
            clearInterval(hiddenTimer);
            clearInterval(recentTimer);
        };
    }, [me, url]);

    return null;
};
