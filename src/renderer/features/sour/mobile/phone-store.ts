import type { Song } from '/@/shared/types/domain-types';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface OfflineSong {
    path: string;
    playlists: string[];
    size: number;
    song: Song;
}

// Sour Player for Android: the phone-only settings (Settings > Sour Player > Phone) and what's been
// saved for offline listening.
export interface PhoneSettings {
    // play when headphones or the car connect (and pause when they go, which Android always does)
    autoResume: boolean;
    // Bluetooth devices that open driving mode when they connect (the car)
    carDevices: string[];
    // stream smaller files on mobile data
    dataSaver: boolean;
    drivingAuto: boolean;
    flipToPause: boolean;
    haptics: boolean;
    // the sung lyric line on the lock screen and in the notification
    lockLyrics: boolean;
    notifyFollows: boolean;
    notifyGroups: boolean;
    notifyRequests: boolean;
    offlineLimitMb: number;
    offlineWifiOnly: boolean;
    shake: 'off' | 'shuffle' | 'skip';
}

interface PhoneStore {
    offline: Record<string, OfflineSong>;
    // playlists the user wants kept offline (new songs in them download too)
    offlinePlaylists: Record<string, string>;
    set: (settings: Partial<PhoneSettings>) => void;
    settings: PhoneSettings;
}

export const DEFAULT_PHONE: PhoneSettings = {
    autoResume: true,
    carDevices: [],
    dataSaver: false,
    drivingAuto: true,
    flipToPause: false,
    haptics: false,
    lockLyrics: true,
    notifyFollows: true,
    notifyGroups: true,
    notifyRequests: true,
    offlineLimitMb: 2000,
    offlineWifiOnly: true,
    shake: 'off',
};

export const usePhoneStore = create<PhoneStore>()(
    persist(
        (set) => ({
            offline: {},
            offlinePlaylists: {},
            set: (settings) => set((s) => ({ settings: { ...s.settings, ...settings } })),
            settings: DEFAULT_PHONE,
        }),
        {
            merge: (persisted, current) => {
                const p = (persisted || {}) as Partial<PhoneStore>;
                return {
                    ...current,
                    ...p,
                    settings: { ...DEFAULT_PHONE, ...(p.settings || {}) },
                };
            },
            name: 'sour-phone',
        },
    ),
);

export const usePhoneSettings = () => usePhoneStore((s) => s.settings);

// the phone's connection, refreshed every half minute while the app runs (for the data saver)
export const phoneNet = { type: 'wifi' as string };

// data saver: on mobile data, stream smaller files (128 kbps MP3) instead of the originals
export const phoneTranscode = <T extends { bitrate?: number; enabled?: boolean; format?: string }>(
    transcode: T,
): T => {
    const { dataSaver } = usePhoneStore.getState().settings;
    if (!dataSaver || phoneNet.type !== 'cellular') return transcode;
    return { ...transcode, bitrate: 128, enabled: true, format: 'mp3' };
};
