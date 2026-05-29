import { useShallow } from 'zustand/react/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

export type SleepTimerMode = 'endOfAlbum' | 'endOfSong' | 'timed';

interface SleepTimerActions {
    cancelTimer: () => void;
    setRemaining: (remaining: number) => void;
    setTargetAlbumId: (albumId: null | string) => void;
    startEndOfAlbumTimer: () => void;
    startEndOfSongTimer: () => void;
    startTimedTimer: (durationSeconds: number) => void;
}

interface SleepTimerState {
    /** Whether the timer is currently active */
    active: boolean;
    /** The mode of the timer */
    mode: SleepTimerMode;
    /** Remaining seconds (only ticks while playing) */
    remaining: number;
    /** Album Id for song when mode activated */
    targetAlbumId: null | string;
}

export const useSleepTimerStore = createWithEqualityFn<SleepTimerActions & SleepTimerState>()(
    (set) => ({
        active: false,
        cancelTimer: () => {
            set({
                active: false,
                mode: 'timed',
                remaining: 0,
                targetAlbumId: null,
            });
        },
        mode: 'timed',
        remaining: 0,

        setRemaining: (remaining: number) => {
            set({ remaining });
        },

        setTargetAlbumId: (albumId: null | string) => {
            set({ targetAlbumId: albumId });
        },

        startEndOfAlbumTimer: () => {
            set({
                active: true,
                mode: 'endOfAlbum',
                remaining: 0,
                targetAlbumId: null,
            });
        },

        startEndOfSongTimer: () => {
            set({
                active: true,
                mode: 'endOfSong',
                remaining: 0,
                targetAlbumId: null,
            });
        },

        startTimedTimer: (durationSeconds: number) => {
            set({
                active: true,
                mode: 'timed',
                remaining: durationSeconds,
                targetAlbumId: null,
            });
        },

        targetAlbumId: null,
    }),
);

// Selectors
export const useSleepTimerActive = () => useSleepTimerStore((s) => s.active);
export const useSleepTimerMode = () => useSleepTimerStore((s) => s.mode);
export const useSleepTimerRemaining = () => useSleepTimerStore((s) => s.remaining);
export const useSleepTimerActions = () =>
    useSleepTimerStore(
        useShallow((s) => ({
            cancelTimer: s.cancelTimer,
            setRemaining: s.setRemaining,
            setTargetAlbumId: s.setTargetAlbumId,
            startEndOfAlbumTimer: s.startEndOfAlbumTimer,
            startEndOfSongTimer: s.startEndOfSongTimer,
            startTimedTimer: s.startTimedTimer,
        })),
    );
