import merge from 'lodash/merge';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

interface FullScreenPlayerState {
    activeTab: string | 'queue' | 'related' | 'lyrics';
    dynamicBackground?: boolean;
    expanded: boolean;
    opacity: number;
    useImageAspectRatio: boolean;
}

export interface FullScreenPlayerSlice extends FullScreenPlayerState {
    actions: {
        setStore: (data: Partial<FullScreenPlayerSlice>) => void;
    };
}

export const useFullScreenPlayerStore = create<FullScreenPlayerSlice>()(
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
