import { useEffect } from 'react';

import { toGroupSong } from '/@/renderer/features/group-play/api/group-play-api';
import { useGroupPlayStore } from '/@/renderer/features/group-play/store/group-play.store';
import { usePlayCountStore } from '/@/renderer/features/hermes-plays/store/play-count.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { sourApi } from '/@/renderer/features/sour/api/sour-api';
import { deviceId } from '/@/renderer/features/sour/components/social';
import { useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { usePlayerStoreBase } from '/@/renderer/store/player.store';
import { useTimestampStoreBase } from '/@/renderer/store/timestamp.store';
import { PlayerStatus } from '/@/shared/types/types';

// Sets up this computer's profile on Hermes Music the first time, then tells it every 15 seconds that
// you're online, what you're listening to and where (for listen along and resume), and which group
// you're in. Songs you hid from your activity are never sent. Every 10 minutes your recent plays
// are shown on your profile.
export const SourPresence = () => {
    const url = useHermesUrl();
    const me = useSourStore((state) => state.me);

    useEffect(() => {
        if (!url || me) return;
        const name = useGroupPlayStore.getState().userName.trim() || 'Listener';
        sourApi
            .register(url, name)
            .then((res) => useSourStore.getState().setMe({ id: res.id, key: res.key }))
            .catch(() => {});
    }, [me, url]);

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
                    // Hermes Music was reset or this is a different one: make a new profile
                    if (/unknown profile/.test(error.message)) useSourStore.getState().setMe(null);
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
