import merge from 'lodash/merge';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createWithEqualityFn } from 'zustand/traditional';

export interface FullScreenPlayerSlice extends FullScreenPlayerState {
    actions: {
        setStore: (data: Partial<FullScreenPlayerSlice>) => void;
    };
}

interface FullScreenPlayerState {
    activeTab: 'lyrics' | 'queue' | 'related' | string;
    dynamicBackground?: boolean;
    dynamicImageBlur: number;
    dynamicIsImage?: boolean;
    expanded: boolean;
    opacity: number;
    useImageAspectRatio: boolean;
}

export const useFullScreenPlayerStore = createWithEqualityFn<FullScreenPlayerSlice>()(
    persist(
        devtools(
            immer((set, get) => ({
                actions: {
                    setStore: (data) => {
                        set({ ...get(), ...data });
                    },
                },
                activeTab: 'queue',
                dynamicBackground: true,
                dynamicImageBlur: 1.5,
                dynamicIsImage: false,
                expanded: false,
                opacity: 60,
                useImageAspectRatio: false,
            })),
            { name: 'store_full_screen_player' },
        ),
        {
            merge: (persistedState, currentState) => {
                return merge(currentState, persistedState);
            },
            name: 'store_full_screen_player',
            version: 2,
        },
    ),
);

export const useFullScreenPlayerStoreActions = () =>
    useFullScreenPlayerStore((state) => state.actions);

export const useSetFullScreenPlayerStore = () =>
    useFullScreenPlayerStore((state) => state.actions.setStore);
