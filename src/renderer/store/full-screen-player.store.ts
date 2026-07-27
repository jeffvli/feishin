import merge from 'lodash/merge';
import omit from 'lodash/omit';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

export type FullScreenPlayerCoverArtSize = 'large' | 'medium' | 'small';

export type FullScreenPlayerItemAlignment = 'center' | 'left' | 'right';

export interface FullScreenPlayerSlice extends FullScreenPlayerState {
    actions: {
        setStore: (data: Partial<FullScreenPlayerSlice>) => void;
    };
}

export type FullScreenPlayerTitleDisplayType = 'multiLine' | 'scroll';

interface FullScreenPlayerState {
    activeTab: 'lyrics' | 'queue' | 'related' | string;
    coverArtSize: FullScreenPlayerCoverArtSize;
    dynamicBackground?: boolean;
    dynamicImageBlur: number;
    dynamicIsImage?: boolean;
    expanded: boolean;
    opacity: number;
    playerItemAlignment: FullScreenPlayerItemAlignment;
    titleDisplayType: FullScreenPlayerTitleDisplayType;
    titleLineCount: number;
    useImageAspectRatio: boolean;
    visualizerExpanded: boolean;
    visualizerReturnToPlayer: boolean;
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
                coverArtSize: 'medium',
                dynamicBackground: true,
                dynamicImageBlur: 1.5,
                dynamicIsImage: false,
                expanded: false,
                opacity: 20,
                playerItemAlignment: 'center',
                titleDisplayType: 'scroll',
                titleLineCount: 3,
                useImageAspectRatio: false,
                visualizerExpanded: false,
                visualizerReturnToPlayer: false,
            })),
            { name: 'store_full_screen_player' },
        ),
        {
            merge: (persistedState, currentState) => {
                return merge(currentState, persistedState);
            },
            migrate: (persistedState, version) => {
                if (version <= 2) {
                    return {} as FullScreenPlayerState;
                }

                return persistedState;
            },
            name: 'store_full_screen_player',
            // `visualizerReturnToPlayer` is transient navigation intent used only to route
            // the "shrink visualizer" action back to the full-screen player; it isn't
            // meaningful across app restarts, so it's excluded from persistence.
            partialize: (state) => omit(state, ['visualizerReturnToPlayer']),
            version: 4,
        },
    ),
);

export const useFullScreenPlayerStoreActions = () =>
    useFullScreenPlayerStore((state) => state.actions);

export const useSetFullScreenPlayerStore = () =>
    useFullScreenPlayerStore((state) => state.actions.setStore);

export const useFullScreenPlayerOverlayState = () =>
    useFullScreenPlayerStore(
        (state) => ({
            expanded: state.expanded,
            visualizerExpanded: state.visualizerExpanded,
        }),
        shallow,
    );
