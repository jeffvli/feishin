/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-unused-vars */
import merge from 'lodash/merge';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import {
  CrossfadeStyle,
  Play,
  PlaybackStyle,
  PlaybackType,
} from '@/renderer/types';

export interface SettingsState {
  player: {
    audioDeviceId?: string | null;
    crossfadeDuration: number;
    crossfadeStyle: CrossfadeStyle;
    globalMediaHotkeys: boolean;
    muted: boolean;
    playButtonBehavior: Play;
    scrobble: {
      enabled: boolean;
      scrobbleAtPercentage: number;
    };
    skipButtons: {
      enabled: boolean;
      skipBackwardSeconds: number;
      skipForwardSeconds: number;
    };
    style: PlaybackStyle;
    type: PlaybackType;
  };
  tab: 'general' | 'playback' | 'view' | string;
}

export interface SettingsSlice extends SettingsState {
  setSettings: (data: Partial<SettingsState>) => void;
}

export const useSettingsStore = create<SettingsSlice>()(
  persist(
    devtools(
      immer((set, get) => ({
        player: {
          audioDeviceId: undefined,
          crossfadeDuration: 5,
          crossfadeStyle: CrossfadeStyle.EQUALPOWER,
          globalMediaHotkeys: true,
          muted: false,
          playButtonBehavior: Play.NOW,
          scrobble: {
            enabled: false,
            scrobbleAtPercentage: 75,
          },
          skipButtons: {
            enabled: true,
            skipBackwardSeconds: 10,
            skipForwardSeconds: 30,
          },
          style: PlaybackStyle.GAPLESS,
          type: PlaybackType.LOCAL,
        },
        setSettings: (data) => {
          set({ ...get(), ...data });
        },
        tab: 'general',
      })),
      { name: 'store_settings' }
    ),
    {
      merge: (persistedState, currentState) => {
        return merge(currentState, persistedState);
      },
      name: 'store_settings',
      version: 1,
    }
  )
);
