import merge from 'lodash/merge';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Platform } from '/@/renderer/types';

type SidebarProps = {
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

export interface AppState {
  isReorderingQueue: boolean;
  platform: Platform;
  sidebar: {
    expanded: string[];
    image: boolean;
    leftWidth: string;
    rightExpanded: boolean;
    rightWidth: string;
  };
  titlebar: TitlebarProps;
}

export interface AppSlice extends AppState {
  actions: {
    setAppStore: (data: Partial<AppSlice>) => void;
    setSidebar: (options: Partial<SidebarProps>) => void;
    setTitlebar: (options: Partial<TitlebarProps>) => void;
  };
}

export const useAppStore = create<AppSlice>()(
  persist(
    devtools(
      immer((set, get) => ({
        actions: {
          setAppStore: (data) => {
            set({ ...get(), ...data });
          },
          setSidebar: (options) => {
            set((state) => {
              state.sidebar = { ...state.sidebar, ...options };
            });
          },
          setTitlebar: (options) => {
            set((state) => {
              state.titlebar = { ...state.titlebar, ...options };
            });
          },
        },
        isReorderingQueue: false,
        platform: Platform.WINDOWS,
        sidebar: {
          expanded: [],
          image: false,
          leftWidth: '230px',
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
      version: 1,
    },
  ),
);

export const useAppStoreActions = () => useAppStore((state) => state.actions);

export const useSidebarStore = () => useAppStore((state) => state.sidebar);

export const useSidebarRightExpanded = () => useAppStore((state) => state.sidebar.rightExpanded);

export const useSetTitlebar = () => useAppStore((state) => state.actions.setTitlebar);

export const useTitlebarStore = () => useAppStore((state) => state.titlebar);
