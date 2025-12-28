import merge from 'lodash/merge';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createWithEqualityFn } from 'zustand/traditional';

import { AlbumListSort, SortOrder } from '/@/shared/types/domain-types';
import { Platform } from '/@/shared/types/types';

export interface AppSlice extends AppState {
    actions: {
        setAlbumArtistDetailGroupingType: (groupingType: 'all' | 'primary') => void;
        setAlbumArtistDetailSort: (sortBy: AlbumListSort, sortOrder: SortOrder) => void;
        setAppStore: (data: Partial<AppSlice>) => void;
        setPageSidebar: (key: string, value: boolean) => void;
        setPrivateMode: (enabled: boolean) => void;
        setShowTimeRemaining: (enabled: boolean) => void;
        setSideBar: (options: Partial<SidebarProps>) => void;
        setTitleBar: (options: Partial<TitlebarProps>) => void;
    };
}

export interface AppState {
    albumArtistDetailSort: {
        groupingType: 'all' | 'primary';
        sortBy: AlbumListSort;
        sortOrder: SortOrder;
    };
    commandPalette: CommandPaletteProps;
    isReorderingQueue: boolean;
    pageSidebar: Record<string, boolean>;
    platform: Platform;
    privateMode: boolean;
    showTimeRemaining: boolean;
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
                    setAlbumArtistDetailGroupingType: (groupingType) => {
                        set((state) => {
                            state.albumArtistDetailSort.groupingType = groupingType;
                        });
                    },
                    setAlbumArtistDetailSort: (sortBy, sortOrder) => {
                        set((state) => {
                            state.albumArtistDetailSort = {
                                ...state.albumArtistDetailSort,
                                sortBy,
                                sortOrder,
                            };
                        });
                    },
                    setAppStore: (data) => {
                        set({ ...get(), ...data });
                    },
                    setPageSidebar: (key, value) => {
                        set((state) => {
                            if (value) {
                                state.pageSidebar[key] = value;
                            } else {
                                delete state.pageSidebar[key];
                            }
                        });
                    },
                    setPrivateMode: (privateMode) => {
                        set((state) => {
                            state.privateMode = privateMode;
                        });
                    },
                    setShowTimeRemaining: (showTimeRemaining) => {
                        set((state) => {
                            state.showTimeRemaining = showTimeRemaining;
                        });
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
                albumArtistDetailSort: {
                    groupingType: 'primary',
                    sortBy: AlbumListSort.RELEASE_DATE,
                    sortOrder: SortOrder.DESC,
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
                pageSidebar: {},
                platform: Platform.WINDOWS,
                privateMode: false,
                showTimeRemaining: false,
                sidebar: {
                    collapsed: false,
                    expanded: [],
                    image: false,
                    leftWidth: '400px',
                    rightExpanded: false,
                    rightWidth: '600px',
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
            migrate: (persistedState, version) => {
                if (version <= 2) {
                    return {} as AppState;
                }

                return persistedState;
            },
            name: 'store_app',
            version: 3,
        },
    ),
);

export const useAppStoreActions = () => useAppStore((state) => state.actions);

export const useSidebarStore = () => useAppStore((state) => state.sidebar);

export const useSidebarRightExpanded = () => useAppStore((state) => state.sidebar.rightExpanded);

export const useSetTitlebar = () => useAppStore((state) => state.actions.setTitleBar);

export const useTitlebarStore = () => useAppStore((state) => state.titlebar);

export const useCommandPalette = () => useAppStore((state) => state.commandPalette);

export const usePageSidebar = (key: string): [boolean, (value: boolean) => void] => {
    const isOpen = useAppStore((state) => state.pageSidebar[key] ?? false);
    const setPageSidebar = useAppStore((state) => state.actions.setPageSidebar);

    const setIsOpen = (value: boolean) => {
        setPageSidebar(key, value);
    };

    return [isOpen, setIsOpen];
};
