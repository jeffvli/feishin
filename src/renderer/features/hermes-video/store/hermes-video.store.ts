import { persist } from 'zustand/middleware';
import { createWithEqualityFn } from 'zustand/traditional';

// Address of the Hermes Music app (e.g. http://umbrel.local:3340). Hermes Music keeps the list of
// music videos found with its /video command; Feishin only asks it which video belongs to a song.
interface HermesVideoState {
    actions: {
        setUrl: (url: string) => void;
    };
    url: string;
}

export const useHermesVideoStore = createWithEqualityFn<HermesVideoState>()(
    persist(
        (set) => ({
            actions: {
                setUrl: (url) => set({ url: url.trim().replace(/\/+$/, '') }),
            },
            url: '',
        }),
        {
            name: 'hermes-video',
            partialize: (state) => ({ url: state.url }),
        },
    ),
);

export const useHermesUrl = () => useHermesVideoStore((state) => state.url);
export const useHermesVideoActions = () => useHermesVideoStore((state) => state.actions);
