import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Platform } from '@/renderer/types';

type SidebarProps = {
  expanded: string[];
  leftWidth: string;
  rightWidth: string;
};
export interface AppState {
  platform: Platform;
  sidebar: {
    expanded: string[];
    leftWidth: string;
    rightWidth: string;
  };
}

export interface AppSlice extends AppState {
  setAppStore: (data: Partial<AppSlice>) => void;
  setSidebar: (options: Partial<SidebarProps>) => void;
}

export const useAppStore = create<AppSlice>()(
  persist(
    devtools(
      immer((set, get) => ({
        platform: Platform.WINDOWS,
        setAppStore: (data) => {
          set({ ...get(), ...data });
        },
        setSidebar: (options) => {
          set((state) => {
            state.sidebar = { ...state.sidebar, ...options };
          });
        },
        sidebar: {
          expanded: [],
          leftWidth: '230px',
          rightWidth: '230px',
        },
      })),
      { name: 'app' }
    ),
    { name: 'store_app' }
  )
);
