import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { CardDisplayType, Platform } from '@/renderer/types';

type SidebarProps = {
  expanded: string[];
  image: boolean;
  leftWidth: string;
  rightExpanded: boolean;
  rightWidth: string;
};

type LibraryPageProps = {
  list: ListProps;
};

type ListProps = {
  display: CardDisplayType;
  size: number;
  type: 'list' | 'grid';
};

export interface AppState {
  albums: LibraryPageProps;
  platform: Platform;
  sidebar: {
    expanded: string[];
    image: boolean;
    leftWidth: string;
    rightExpanded: boolean;
    rightWidth: string;
  };
}

export interface AppSlice extends AppState {
  setAppStore: (data: Partial<AppSlice>) => void;
  setPage: (page: 'albums', options: Partial<LibraryPageProps>) => void;
  setSidebar: (options: Partial<SidebarProps>) => void;
}

export const useAppStore = create<AppSlice>()(
  persist(
    devtools(
      immer((set, get) => ({
        albums: {
          list: {
            display: CardDisplayType.CARD,
            size: 50,
            type: 'list',
          },
        },
        platform: Platform.WINDOWS,
        setAppStore: (data) => {
          set({ ...get(), ...data });
        },
        setPage: (page: 'albums', data: any) => {
          set((state) => {
            state[page] = { ...state[page], ...data };
          });
        },
        setSidebar: (options) => {
          set((state) => {
            state.sidebar = { ...state.sidebar, ...options };
          });
        },
        sidebar: {
          expanded: [],
          image: false,
          leftWidth: '230px',
          rightExpanded: false,
          rightWidth: '230px',
        },
      })),
      { name: 'app' }
    ),
    { name: 'store_app' }
  )
);
