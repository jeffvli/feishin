import { useQuery } from '@tanstack/react-query';
import { persist } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';

import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { type Me, sourApi } from '/@/renderer/features/sour/api/sour-api';
import { type Song } from '/@/shared/types/domain-types';

interface BlockedArtist {
    id: null | string;
    name: string;
}

// This computer's Sour Player profile (the key is what lets it change the profile) and the artists
// you don't want Auto DJ to play. Both stay on this computer.
interface SourStore {
    block: (artist: BlockedArtist) => void;
    blocked: BlockedArtist[];
    me: Me | null;
    setMe: (me: Me | null) => void;
    unblock: (name: string) => void;
}

export const useSourStore = createWithEqualityFn<SourStore>()(
    persist(
        (set) => ({
            block: (artist) =>
                set((state) =>
                    state.blocked.some((b) => b.name.toLowerCase() === artist.name.toLowerCase())
                        ? state
                        : { blocked: [...state.blocked, artist] },
                ),
            blocked: [],
            me: null,
            setMe: (me) => set({ me }),
            unblock: (name) =>
                set((state) => ({
                    blocked: state.blocked.filter(
                        (b) => b.name.toLowerCase() !== name.toLowerCase(),
                    ),
                })),
        }),
        { name: 'sour-player' },
    ),
);

// true when any of the song's artists is blocked from Auto DJ
export const isBlockedSong = (song: Song) => {
    const { blocked } = useSourStore.getState();
    if (!blocked.length) return false;
    const names = new Set(blocked.map((b) => b.name.toLowerCase()));
    const ids = new Set(blocked.map((b) => b.id).filter(Boolean));
    const artists = [...(song.artists || []), ...(song.albumArtists || [])];
    return (
        names.has((song.artistName || '').toLowerCase()) ||
        artists.some((a) => (a.id && ids.has(a.id)) || names.has((a.name || '').toLowerCase()))
    );
};

// everyone with a Sour Player profile, refreshed every 15 seconds
export const useSourProfiles = () => {
    const url = useHermesUrl();
    return useQuery({
        enabled: !!url,
        queryFn: () => sourApi.list(url),
        queryKey: ['sour-profiles', url],
        refetchInterval: 15000,
    });
};
