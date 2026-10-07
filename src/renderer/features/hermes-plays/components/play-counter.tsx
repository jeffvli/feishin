import { useEffect } from 'react';

import { usePlayCountStore } from '/@/renderer/features/hermes-plays/store/play-count.store';
import { usePlayerStoreBase } from '/@/renderer/store/player.store';
import { PlayerStatus } from '/@/shared/types/types';

// Counts a play once a song has actually been listened to: half of it, or 30 seconds for longer songs.
export const PlayCounter = () => {
    useEffect(() => {
        let playing: string | undefined;
        let heard = 0;
        let counted = false;
        const timer = setInterval(() => {
            const player = usePlayerStoreBase.getState();
            const song = player.getCurrentSong();
            if (!song) return;
            if (song._uniqueId !== playing) {
                playing = song._uniqueId;
                heard = 0;
                counted = false;
            }
            if (counted || player.player.status !== PlayerStatus.PLAYING) return;
            heard += 1;
            const needed = Math.min(30, Math.max(5, (song.duration ?? 0) / 2000));
            if (heard >= needed) {
                counted = true;
                usePlayCountStore.getState().addPlay(song);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return null;
};
