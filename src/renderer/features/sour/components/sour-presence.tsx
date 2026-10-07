import { useEffect } from 'react';

import { toGroupSong } from '/@/renderer/features/group-play/api/group-play-api';
import { useGroupPlayStore } from '/@/renderer/features/group-play/store/group-play.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { sourApi } from '/@/renderer/features/sour/api/sour-api';
import { useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { usePlayerStoreBase } from '/@/renderer/store/player.store';
import { PlayerStatus } from '/@/shared/types/types';

// Sets up this computer's profile on Hermes Music the first time, then tells it every 15 seconds that
// you're online and what you're listening to.
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
        const beat = () => {
            const player = usePlayerStoreBase.getState();
            const song = player.getCurrentSong();
            const playing = player.player.status === PlayerStatus.PLAYING;
            sourApi
                .presence(url, me, song ? toGroupSong(song) : null, playing)
                .catch((error: Error) => {
                    // Hermes Music was reset or this is a different one: make a new profile
                    if (/unknown profile/.test(error.message)) useSourStore.getState().setMe(null);
                });
        };
        beat();
        const timer = setInterval(beat, 15000);
        return () => clearInterval(timer);
    }, [me, url]);

    return null;
};
