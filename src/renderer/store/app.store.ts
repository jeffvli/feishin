import merge from 'lodash/merge';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createWithEqualityFn } from 'zustand/traditional';

import { Platform } from '/@/shared/types/types';

export interface AppSlice extends AppState {
    actions: {
        setAppStore: (data: Partial<AppSlice>) => void;
        setSideBar: (options: Partial<SidebarProps>) => void;
        setTitleBar: (options: Partial<TitlebarProps>) => void;
    };
}

export interface AppState {
    commandPalette: CommandPaletteProps;
    isReorderingQueue: boolean;
    platform: Platform;
    sidebar: SidebarProps;
    titlebar: TitlebarProps;
}

type CommandPaletteProps = {
    close: () => void;
    open: () => void;
    opened: boolean;
    toggle: () => void;
};

type SidebarProps = {
    collapsed: boolean;
    expanded: string[];
    image: boolean;
    leftWidth: string;
    rightExpanded: boolean;
    rightWidth: string;
};

type TitlebarProps = {
    backgroundColor: string;
    outOfView: boolean;
};

export const useAppStore = createWithEqualityFn<AppSlice>()(
    persist(
        devtools(
            immer((set, get) => ({
                actions: {
                    setAppStore: (data) => {
                        set({ ...get(), ...data });
                    },
                    setSideBar: (options) => {
                        set((state) => {
                            state.sidebar = { ...state.sidebar, ...options };
                        });
                    },
                    setTitleBar: (options) => {
                        set((state) => {
                            state.titlebar = { ...state.titlebar, ...options };
                        });
                    },
                },
                commandPalette: {
                    close: () => {
                        set((state) => {
                            state.commandPalette.opened = false;
                        });
                    },
                    open: () => {
                        set((state) => {
                            state.commandPalette.opened = true;
                        });
                    },
                    opened: false,
                    toggle: () => {
                        set((state) => {
                            state.commandPalette.opened = !state.commandPalette.opened;
                        });
                    },
                },
                isReorderingQueue: false,
                platform: Platform.WINDOWS,
                sidebar: {
                    collapsed: false,
                    expanded: [],
                    image: false,
                    leftWidth: '400px',
                    rightExpanded: false,
                    rightWidth: '400px',
                },
                titlebar: {
                    backgroundColor: '#000000',
                    outOfView: false,
                },
            })),
            { name: 'store_app' },
        ),
        {
            merge: (persistedState, currentState) => {
                return merge(currentState, persistedState);
            },
            name: 'store_app',
            version: 2,
        },
    ),
);

export const useAppStoreActions = () => useAppStore((state) => state.actions);

export const useSidebarStore = () => useAppStore((state) => state.sidebar);

export const useSidebarRightExpanded = () => useAppStore((state) => state.sidebar.rightExpanded);

export const useSetTitlebar = () => useAppStore((state) => state.actions.setTitleBar);

export const useTitlebarStore = () => useAppStore((state) => state.titlebar);

export const useCommandPalette = () => useAppStore((state) => state.commandPalette);
