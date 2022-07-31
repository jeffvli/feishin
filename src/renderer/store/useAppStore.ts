import create from 'zustand';
import { devtools } from 'zustand/middleware';
import { Platform } from '../../types';

export interface AppState {
  currentPage: {
    scrollY: number;
    title: string;
  };
  platform: Platform;
}

export interface AppSlice extends AppState {
  setAppStore: (data: Partial<AppSlice>) => void;
}

const persistedAppState = JSON.parse(localStorage.getItem('app') || '{}');

export const useAppStore = create<AppSlice>()(
  devtools((set, get) => ({
    currentPage: persistedAppState.currentPage,
    platform: persistedAppState.platform,
    setAppStore: (data) => {
      set({ ...get(), ...data });
    },
  }))
);
