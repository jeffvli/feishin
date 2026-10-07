import { persist } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';

import { type QueueSong } from '/@/shared/types/domain-types';

export interface PlayEntry {
    album: string;
    artist: string;
    count: number;
    duration?: number;
    id: string;
    imageId: null | string;
    last: number;
    name: string;
    serverId: string;
}

// Songs played on this computer and how often, so "Most played" shows what you listen to, even when
// several people share one music server login. Kept to the 500 most played songs. `days` keeps how
// often each song played per day (about a year), for the weekly recap and the year in review.
interface PlayCountStore {
    addPlay: (song: QueueSong) => void;
    days: Record<string, Record<string, number>>;
    plays: Record<string, PlayEntry>;
}

const today = () => new Date().toISOString().slice(0, 10);

export const usePlayCountStore = createWithEqualityFn<PlayCountStore>()(
    persist(
        (set) => ({
            addPlay: (song) =>
                set((state) => {
                    const old = state.plays[song.id];
                    const plays = {
                        ...state.plays,
                        [song.id]: {
                            album: song.album || '',
                            artist: song.artistName,
                            count: (old?.count ?? 0) + 1,
                            duration: song.duration ?? undefined,
                            id: song.id,
                            imageId: song.imageId ?? null,
                            last: Date.now(),
                            name: song.name,
                            serverId: song._serverId,
                        },
                    };
                    const day = today();
                    const days = { ...state.days, [day]: { ...state.days[day] } };
                    days[day][song.id] = (days[day][song.id] ?? 0) + 1;
                    for (const key of Object.keys(days).sort().slice(0, -400)) delete days[key];
                    const entries = Object.values(plays);
                    if (entries.length <= 500) return { days, plays };
                    const keep = entries.sort((a, b) => b.count - a.count).slice(0, 500);
                    return {
                        days,
                        plays: Object.fromEntries(keep.map((entry) => [entry.id, entry])),
                    };
                }),
            days: {},
            plays: {},
        }),
        { name: 'hermes-plays' },
    ),
);

// plays per song over the last `n` days, most played first
export const playsSince = (n: number) => {
    const { days, plays } = usePlayCountStore.getState();
    const from = new Date(Date.now() - n * 86400000).toISOString().slice(0, 10);
    const counts = new Map<string, number>();
    for (const [day, songs] of Object.entries(days)) {
        if (day < from) continue;
        for (const [id, count] of Object.entries(songs))
            counts.set(id, (counts.get(id) ?? 0) + count);
    }
    return [...counts.entries()]
        .map(([id, count]) => ({ count, entry: plays[id] }))
        .filter((x) => x.entry)
        .sort((a, b) => b.count - a.count);
};
