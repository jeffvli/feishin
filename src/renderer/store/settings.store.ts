/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-unused-vars */
import merge from 'lodash/merge';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AppTheme } from '@/renderer/themes/types';
import {
  CrossfadeStyle,
  Play,
  PlaybackStyle,
  PlaybackType,
  TableColumn,
} from '@/renderer/types';

export type PersistedTableColumn = {
  column: TableColumn;
  width: number;
};

export type DataTableProps = {
  autoFit: boolean;
  columns: PersistedTableColumn[];
  followCurrentSong: boolean;
  rowHeight: number;
};

export interface SettingsState {
  general: {
    followSystemTheme: boolean;
    theme: AppTheme;
    themeDark: AppTheme;
    themeLight: AppTheme;
  };
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
  tables: {
    nowPlaying: DataTableProps;
    sideDrawerQueue: DataTableProps;
    sideQueue: DataTableProps;
  };
}

export interface SettingsSlice extends SettingsState {
  setSettings: (data: Partial<SettingsState>) => void;
}

export const useSettingsStore = create<SettingsSlice>()(
  persist(
    devtools(
      immer((set, get) => ({
        general: {
          followSystemTheme: false,
          theme: AppTheme.DEFAULT_DARK,
          themeDark: AppTheme.DEFAULT_DARK,
          themeLight: AppTheme.DEFAULT_LIGHT,
        },
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
        tables: {
          nowPlaying: {
            autoFit: true,
            columns: [
              {
                column: TableColumn.ROW_INDEX,
                width: 50,
              },
              {
                column: TableColumn.TITLE,
                width: 500,
              },
              {
                column: TableColumn.DURATION,
                width: 100,
              },
              {
                column: TableColumn.ALBUM,
                width: 100,
              },
              {
                column: TableColumn.ALBUM_ARTIST,
                width: 100,
              },
              {
                column: TableColumn.GENRE,
                width: 100,
              },
              {
                column: TableColumn.YEAR,
                width: 100,
              },
            ],
            followCurrentSong: true,
            rowHeight: 30,
          },
          sideDrawerQueue: {
            autoFit: true,
            columns: [
              {
                column: TableColumn.TITLE_COMBINED,
                width: 500,
              },
              {
                column: TableColumn.DURATION,
                width: 100,
              },
            ],
            followCurrentSong: true,
            rowHeight: 60,
          },
          sideQueue: {
            autoFit: true,
            columns: [
              {
                column: TableColumn.ROW_INDEX,
                width: 50,
              },
              {
                column: TableColumn.TITLE_COMBINED,
                width: 500,
              },
              {
                column: TableColumn.DURATION,
                width: 100,
              },
            ],
            followCurrentSong: true,
            rowHeight: 60,
          },
        },
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
