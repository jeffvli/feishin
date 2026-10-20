import { useEffect, useRef } from 'react';

import { api } from '/@/renderer/api';
import { useGroupPlayStore } from '/@/renderer/features/group-play/store/group-play.store';
import { isBlockedSong, useSourStore } from '/@/renderer/features/sour/store/sour.store';
import { usePlayerSong } from '/@/renderer/store';
import { addToQueueByData, usePlayerStoreBase } from '/@/renderer/store/player.store';
import { useTimestampStoreBase } from '/@/renderer/store/timestamp.store';
import { toast } from '/@/shared/components/toast/toast';
import { Played, type Song } from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

// Keep playing: when the last song in the queue is nearly over, more like it is added so the music
// doesn't stop (songs similar to it, or random ones from the same genre when the server has none).
// Never in Group Play or Listen Along, where someone else decides what plays.
export const KeepPlaying = () => {
    const on = useSourStore((s) => s.look.keepPlaying ?? true);
    const song = usePlayerSong();
    const length = useRef(0);
    length.current = song?.duration ? song.duration / 1000 : 0;
    const done = useRef<null | string>(null);

    useEffect(() => {
        if (!on) return undefined;
        return useTimestampStoreBase.subscribe((s) => {
            // cheap check first (this runs several times a second): only near the end of a song
            if (!length.current || length.current - s.timestamp > 20) return;
            const data = usePlayerStoreBase.getState().getPlayerData();
            const now = data.currentSong;
            // something comes next (more queue, or repeat): nothing to add
            if (!now || data.nextSong || done.current === now._uniqueId) return;
            if (useGroupPlayStore.getState().code || useSourStore.getState().listenAlong) return;
            done.current = now._uniqueId;
            void addMore(now);
        });
    }, [on]);
    return null;
};

const addMore = async (song: Song) => {
    const serverId = song._serverId;
    const inQueue = new Set(
        usePlayerStoreBase
            .getState()
            .getQueue()
            .items.map((x) => x.id),
    );
    let more: Song[] = await api.controller
        .getSimilarSongs({ apiClientProps: { serverId }, query: { count: 25, songId: song.id } })
        .catch(() => []);
    if (more.filter((x) => !inQueue.has(x.id)).length < 5) {
        const random = await api.controller
            .getRandomSongList({
                apiClientProps: { serverId },
                query: { genre: song.genres?.[0]?.name, limit: 25, played: Played.All },
            })
            .catch(() => null);
        more = [...more, ...(random?.items ?? [])];
    }
    const seen = new Set<string>();
    const picks = more
        .filter((x) => !inQueue.has(x.id) && !isBlockedSong(x) && !seen.has(x.id) && seen.add(x.id))
        .slice(0, 15);
    if (!picks.length) return;
    await addToQueueByData(Play.LAST, picks);
    toast.info({ message: `Keep playing: added ${picks.length} songs like ${song.name}` });
};

// Up next: a small heads-up a few seconds before the song ends (Sour Studio > Extras)
export const UpNextHeadsUp = () => {
    const on = useSourStore((s) => !!s.look.upNext);
    const song = usePlayerSong();
    const length = useRef(0);
    length.current = song?.duration ? song.duration / 1000 : 0;
    const told = useRef<null | string>(null);
    useEffect(() => {
        if (!on) return undefined;
        return useTimestampStoreBase.subscribe((s) => {
            const left = length.current - s.timestamp;
            if (!length.current || left > 12 || left < 2) return;
            const { currentSong, nextSong } = usePlayerStoreBase.getState().getPlayerData();
            if (!currentSong || !nextSong || told.current === currentSong._uniqueId) return;
            told.current = currentSong._uniqueId;
            toast.info({
                autoClose: 6000,
                message: `Up next: ${nextSong.name} - ${nextSong.artistName}`,
            });
        });
    }, [on]);
    return null;
};
