import { persist } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';

import { type QueueSong } from '/@/shared/types/domain-types';

export interface PlayEntry {
    album: string;
    artist: string;
    count: number;
    id: string;
    imageId: null | string;
    last: number;
    name: string;
    serverId: string;
}

// Songs played on this computer and how often, so "Most played" shows what you listen to, even when
// several people share one music server login. Kept to the 500 most played songs.
interface PlayCountStore {
    addPlay: (song: QueueSong) => void;
    plays: Record<string, PlayEntry>;
}

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
                            id: song.id,
                            imageId: song.imageId ?? null,
                            last: Date.now(),
                            name: song.name,
                            serverId: song._serverId,
                        },
                    };
                    const entries = Object.values(plays);
                    if (entries.length <= 500) return { plays };
                    const keep = entries.sort((a, b) => b.count - a.count).slice(0, 500);
                    return { plays: Object.fromEntries(keep.map((entry) => [entry.id, entry])) };
                }),
            plays: {},
        }),
        { name: 'hermes-plays' },
    ),
);
