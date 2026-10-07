import { useQuery } from '@tanstack/react-query';
import { persist } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';

import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { type Me, sourApi } from '/@/renderer/features/sour/api/sour-api';
import { type Song } from '/@/shared/types/domain-types';

export interface Pin {
    id: string;
    imageId: null | string;
    kind: 'album' | 'playlist' | 'profile';
    name: string;
}

export interface SavedGroup {
    djRotation: boolean;
    guestControl: boolean;
    listed: boolean;
    name: string;
}

// Sour Player's look and comfort switches (Settings > Sour Player)
export interface SourLook {
    albumAccent: boolean;
    animatedBackground: boolean;
    autoVideo: boolean;
    hiddenButtons: string[];
    reducedMotion: boolean;
    seasonal: boolean;
    startupSound: boolean;
}

interface BlockedArtist {
    id: null | string;
    name: string;
}

// This computer's Sour Player state: the profile key (what lets it change the profile), blocked
// artists, private song notes, pinned sidebar items, saved groups and look settings.
interface SourStore {
    block: (artist: BlockedArtist) => void;
    blocked: BlockedArtist[];
    crossfade: Record<string, number>;
    lastInbox: number;
    listenAlong: null | string;
    look: SourLook;
    me: Me | null;
    notes: Record<string, string>;
    pins: Pin[];
    savedGroups: SavedGroup[];
    seenMilestones: string[];
    set: (changes: Partial<Omit<SourStore, 'block' | 'set' | 'setLook' | 'unblock'>>) => void;
    setLook: (changes: Partial<SourLook>) => void;
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
            crossfade: {},
            lastInbox: 0,
            listenAlong: null,
            look: {
                albumAccent: false,
                animatedBackground: false,
                autoVideo: false,
                hiddenButtons: [],
                reducedMotion: false,
                seasonal: false,
                startupSound: false,
            },
            me: null,
            notes: {},
            pins: [],
            savedGroups: [],
            seenMilestones: [],
            set: (changes) => set(changes),
            setLook: (changes) => set((state) => ({ look: { ...state.look, ...changes } })),
            setMe: (me) => set({ me }),
            unblock: (name) =>
                set((state) => ({
                    blocked: state.blocked.filter(
                        (b) => b.name.toLowerCase() !== name.toLowerCase(),
                    ),
                })),
        }),
        {
            merge: (persisted, current) => {
                const saved = (persisted || {}) as Partial<SourStore>;
                return { ...current, ...saved, look: { ...current.look, ...(saved.look || {}) } };
            },
            name: 'sour-player',
        },
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

// your own profile, with the private bits (picture history, resume point)
export const useMyProfile = () => {
    const url = useHermesUrl();
    const me = useSourStore((state) => state.me);
    return useQuery({
        enabled: !!url && !!me,
        queryFn: () => sourApi.me(url, me as Me),
        queryKey: ['sour-me', url, me?.id],
        refetchInterval: 60000,
    });
};
