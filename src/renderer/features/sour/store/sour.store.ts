import { useQuery } from '@tanstack/react-query';
import { persist } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';

import { type GroupSong } from '/@/renderer/features/group-play/store/group-play.store';
import { useHermesUrl } from '/@/renderer/features/hermes-video/store/hermes-video.store';
import { type Me, sourApi } from '/@/renderer/features/sour/api/sour-api';
import { type Song } from '/@/shared/types/domain-types';

export type BarVisualizerStyle = 'bars' | 'glow' | 'halo' | 'pulp' | 'river';

// a song played on this computer (queue history, "on repeat")
export interface HistoryEntry {
    at: number;
    song: GroupSong;
}

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

// Sour Player's look and comfort switches (Settings > Sour Player and the Sour Studio)
export interface SourLook {
    albumAccent: boolean;
    animatedBackground: boolean;
    // restart into a downloaded update by itself when nothing is playing
    autoUpdate: boolean;
    // a picture (or GIF) behind the Home page (stored on this computer), and how much it's dimmed
    homeBackground: boolean;
    homeBackgroundDim: number;
    autoVideo: boolean;
    barLayout: 'classic' | 'floating';
    // the look of the small visualizer in the player bar and the mini player
    barStyle: BarVisualizerStyle;
    barVisualizer: boolean;
    corners: 'normal' | 'round' | 'sharp';
    cursor: boolean;
    dailyTheme: boolean;
    density: number;
    fadeCovers: boolean;
    glass: boolean;
    hiddenButtons: string[];
    holidays: boolean;
    hoverPreview: boolean;
    iconPack: string;
    lemonLoader: boolean;
    lyricStyle: 'centered' | 'huge' | 'karaoke';
    pressFx: boolean;
    reducedMotion: boolean;
    seasonal: boolean;
    sidebarRight: boolean;
    // Simple mode: only the basics (play, search, playlists, requests), no extras or effects
    simple: boolean;
    socialToasts: boolean;
    splash: boolean;
    stageScene: 'drive' | 'none' | 'rain' | 'snow' | 'stars';
    stageVinyl: boolean;
    startupSound: boolean;
    visualizer: VisualizerStyle;
}

export type VisualizerStyle = 'bars' | 'glow' | 'halo' | 'orbit' | 'pulp' | 'river' | 'soul';

export const DEFAULT_LOOK: SourLook = {
    albumAccent: false,
    animatedBackground: false,
    autoUpdate: true,
    autoVideo: false,
    barLayout: 'classic',
    barStyle: 'bars',
    barVisualizer: true,
    corners: 'normal',
    cursor: false,
    dailyTheme: false,
    density: 1,
    fadeCovers: true,
    glass: false,
    hiddenButtons: [],
    holidays: true,
    homeBackground: false,
    homeBackgroundDim: 45,
    hoverPreview: false,
    iconPack: 'classic',
    lemonLoader: true,
    lyricStyle: 'centered',
    pressFx: true,
    reducedMotion: false,
    seasonal: false,
    sidebarRight: false,
    simple: false,
    socialToasts: true,
    splash: true,
    stageScene: 'none',
    stageVinyl: false,
    startupSound: false,
    visualizer: 'bars',
};

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
    greeted: string;
    // playlists hidden from this computer's sidebar (right-click a playlist > Hide)
    hiddenPlaylists?: { id: string; name: string }[];
    history: HistoryEntry[];
    holidayRestore: null | { holiday: string; theme: string };
    lastInbox: number;
    lastSocial: number;
    listenAlong: null | string;
    listenAlongName?: null | string;
    look: SourLook;
    me: Me | null;
    notes: Record<string, string>;
    pins: Pin[];
    repeatNotified: Record<string, string>;
    savedGroups: SavedGroup[];
    seenMilestones: string[];
    set: (changes: Partial<Omit<SourStore, 'block' | 'set' | 'setLook' | 'unblock'>>) => void;
    setLook: (changes: Partial<SourLook>) => void;
    setMe: (me: Me | null) => void;
    unblock: (name: string) => void;
}

// Simple mode is on (Settings > Sour Player)
export const useSimpleMode = () => useSourStore((state) => !!state.look.simple);

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
            greeted: '',
            hiddenPlaylists: [],
            history: [],
            holidayRestore: null,
            lastInbox: 0,
            lastSocial: 0,
            listenAlong: null,
            listenAlongName: null,
            look: DEFAULT_LOOK,
            me: null,
            notes: {},
            pins: [],
            repeatNotified: {},
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
                const look = { ...current.look, ...(saved.look || {}) };
                // older versions could leave odd values behind; keep the look within range
                look.density = Math.min(1.25, Math.max(0.8, Number(look.density) || 1));
                if (!Array.isArray(look.hiddenButtons)) look.hiddenButtons = [];
                return {
                    ...current,
                    ...saved,
                    history: Array.isArray(saved.history) ? saved.history.slice(0, 300) : [],
                    look,
                };
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
        // many parts of the app read this; one fetch serves them all
        staleTime: 10000,
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
        staleTime: 30000,
    });
};
