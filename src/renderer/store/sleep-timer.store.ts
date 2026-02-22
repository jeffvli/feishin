import { useShallow } from 'zustand/react/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

export type SleepTimerMode = 'endOfSong' | 'timed';

interface SleepTimerActions {
    cancelTimer: () => void;
    setRemaining: (remaining: number) => void;
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
}

export const useSleepTimerStore = createWithEqualityFn<SleepTimerActions & SleepTimerState>()(
    (set) => ({
        active: false,
        cancelTimer: () => {
            set({
                active: false,
                mode: 'timed',
                remaining: 0,
            });
        },
        mode: 'timed',
        remaining: 0,

        setRemaining: (remaining: number) => {
            set({ remaining });
        },

        startEndOfSongTimer: () => {
            set({
                active: true,
                mode: 'endOfSong',
                remaining: 0,
            });
        },

        startTimedTimer: (durationSeconds: number) => {
            set({
                active: true,
                mode: 'timed',
                remaining: durationSeconds,
            });
        },
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
            startEndOfSongTimer: s.startEndOfSongTimer,
            startTimedTimer: s.startTimedTimer,
        })),
    );
