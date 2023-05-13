/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-unused-vars */
import isElectron from 'is-electron';
import merge from 'lodash/merge';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { AppTheme } from '/@/renderer/themes/types';
import {
  TableColumn,
  CrossfadeStyle,
  Play,
  PlaybackStyle,
  PlaybackType,
  TableType,
  Platform,
} from '/@/renderer/types';

export type PersistedTableColumn = {
  column: TableColumn;
  width: number;
};

export type DataTableProps = {
  autoFit: boolean;
  columns: PersistedTableColumn[];
  followCurrentSong?: boolean;
  rowHeight: number;
};

export type SideQueueType = 'sideQueue' | 'sideDrawerQueue';

type MpvSettings = {
  audioExclusiveMode: 'yes' | 'no';
  audioFormat?: 's16' | 's32' | 'float';
  audioSampleRateHz?: number;
  gaplessAudio: 'yes' | 'no' | 'weak';
  replayGainClip: boolean;
  replayGainFallbackDB?: number;
  replayGainMode: 'no' | 'track' | 'album';
  replayGainPreampDB?: number;
};

export enum BindingActions {
  GLOBAL_SEARCH = 'globalSearch',
  LOCAL_SEARCH = 'localSearch',
  MUTE = 'volumeMute',
  NEXT = 'next',
  PAUSE = 'pause',
  PLAY = 'play',
  PLAY_PAUSE = 'playPause',
  PREVIOUS = 'previous',
  SHUFFLE = 'toggleShuffle',
  SKIP_BACKWARD = 'skipBackward',
  SKIP_FORWARD = 'skipForward',
  STOP = 'stop',
  TOGGLE_FULLSCREEN_PLAYER = 'toggleFullscreenPlayer',
  TOGGLE_QUEUE = 'toggleQueue',
  TOGGLE_REPEAT = 'toggleRepeat',
  VOLUME_DOWN = 'volumeDown',
  VOLUME_UP = 'volumeUp',
}

export interface SettingsState {
  general: {
    followSystemTheme: boolean;
    fontContent: string;
    playButtonBehavior: Play;
    showQueueDrawerButton: boolean;
    sideQueueType: SideQueueType;
    skipButtons: {
      enabled: boolean;
      skipBackwardSeconds: number;
      skipForwardSeconds: number;
    };
    theme: AppTheme;
    themeDark: AppTheme;
    themeLight: AppTheme;
    volumeWheelStep: number;
  };
  hotkeys: {
    bindings: Record<BindingActions, { allowGlobal: boolean; hotkey: string; isGlobal: boolean }>;
    globalMediaHotkeys: boolean;
  };
  playback: {
    audioDeviceId?: string | null;
    crossfadeDuration: number;
    crossfadeStyle: CrossfadeStyle;
    mpvExtraParameters: string[];
    mpvProperties: MpvSettings;
    muted: boolean;
    scrobble: {
      enabled: boolean;
      scrobbleAtDuration: number;
      scrobbleAtPercentage: number;
    };
    style: PlaybackStyle;
    type: PlaybackType;
  };
  tab: 'general' | 'playback' | 'window' | 'hotkeys' | string;
  tables: {
    fullScreen: DataTableProps;
    nowPlaying: DataTableProps;
    sideDrawerQueue: DataTableProps;
    sideQueue: DataTableProps;
    songs: DataTableProps;
  };
  window: {
    disableAutoUpdate: boolean;
    exitToTray: boolean;
    minimizeToTray: boolean;
    windowBarStyle: Platform;
  };
}

export interface SettingsSlice extends SettingsState {
  actions: {
    reset: () => void;
    setSettings: (data: Partial<SettingsState>) => void;
  };
}

const initialState: SettingsState = {
  general: {
    followSystemTheme: false,
    fontContent: 'Poppins',
    playButtonBehavior: Play.NOW,
    showQueueDrawerButton: false,
    sideQueueType: 'sideDrawerQueue',
    skipButtons: {
      enabled: false,
      skipBackwardSeconds: 5,
      skipForwardSeconds: 10,
    },
    theme: AppTheme.DEFAULT_DARK,
    themeDark: AppTheme.DEFAULT_DARK,
    themeLight: AppTheme.DEFAULT_LIGHT,
    volumeWheelStep: 5,
  },
  hotkeys: {
    bindings: {
      globalSearch: { allowGlobal: false, hotkey: 'mod+k', isGlobal: false },
      localSearch: { allowGlobal: false, hotkey: 'mod+f', isGlobal: false },
      next: { allowGlobal: true, hotkey: '', isGlobal: false },
      pause: { allowGlobal: true, hotkey: '', isGlobal: false },
      play: { allowGlobal: true, hotkey: '', isGlobal: false },
      playPause: { allowGlobal: true, hotkey: '', isGlobal: false },
      previous: { allowGlobal: true, hotkey: '', isGlobal: false },
      skipBackward: { allowGlobal: true, hotkey: '', isGlobal: false },
      skipForward: { allowGlobal: true, hotkey: '', isGlobal: false },
      stop: { allowGlobal: true, hotkey: '', isGlobal: false },
      toggleFullscreenPlayer: { allowGlobal: false, hotkey: '', isGlobal: false },
      toggleQueue: { allowGlobal: false, hotkey: '', isGlobal: false },
      toggleRepeat: { allowGlobal: true, hotkey: '', isGlobal: false },
      toggleShuffle: { allowGlobal: true, hotkey: '', isGlobal: false },
      volumeDown: { allowGlobal: true, hotkey: '', isGlobal: false },
      volumeMute: { allowGlobal: true, hotkey: '', isGlobal: false },
      volumeUp: { allowGlobal: true, hotkey: '', isGlobal: false },
    },
    globalMediaHotkeys: false,
  },
  playback: {
    audioDeviceId: undefined,
    crossfadeDuration: 5,
    crossfadeStyle: CrossfadeStyle.EQUALPOWER,
    mpvExtraParameters: [],
    mpvProperties: {
      audioExclusiveMode: 'no',
      audioFormat: undefined,
      audioSampleRateHz: undefined,
      gaplessAudio: 'weak',
      replayGainClip: true,
      replayGainFallbackDB: undefined,
      replayGainMode: 'no',
      replayGainPreampDB: 0,
    },
    muted: false,
    scrobble: {
      enabled: true,
      scrobbleAtDuration: 240,
      scrobbleAtPercentage: 75,
    },
    style: PlaybackStyle.GAPLESS,
    type: PlaybackType.LOCAL,
  },
  tab: 'general',
  tables: {
    fullScreen: {
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
        {
          column: TableColumn.USER_FAVORITE,
          width: 100,
        },
      ],
      followCurrentSong: true,
      rowHeight: 60,
    },
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
    songs: {
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
        {
          column: TableColumn.ALBUM,
          width: 300,
        },
        {
          column: TableColumn.ARTIST,
          width: 100,
        },
        {
          column: TableColumn.YEAR,
          width: 100,
        },
      ],
      rowHeight: 60,
    },
  },
  window: {
    disableAutoUpdate: false,
    exitToTray: false,
    minimizeToTray: false,
    windowBarStyle: Platform.WEB,
  },
};

export const useSettingsStore = create<SettingsSlice>()(
  persist(
    devtools(
      immer((set, get) => ({
        actions: {
          reset: () => {
            if (!isElectron()) {
              set({
                ...initialState,
                playback: {
                  ...initialState.playback,
                  type: PlaybackType.WEB,
                },
              });
            } else {
              set(initialState);
            }
          },
          setSettings: (data) => {
            set({ ...get(), ...data });
          },
        },
        ...initialState,
      })),
      { name: 'store_settings' },
    ),
    {
      merge: (persistedState, currentState) => {
        return merge(currentState, persistedState);
      },
      name: 'store_settings',
      version: 5,
    },
  ),
);

export const useSettingsStoreActions = () => useSettingsStore((state) => state.actions);

export const usePlaybackSettings = () => useSettingsStore((state) => state.playback, shallow);

export const useTableSettings = (type: TableType) =>
  useSettingsStore((state) => state.tables[type]);

export const useGeneralSettings = () => useSettingsStore((state) => state.general, shallow);

export const usePlayerType = () => useSettingsStore((state) => state.playback.type, shallow);

export const usePlayButtonBehavior = () =>
  useSettingsStore((state) => state.general.playButtonBehavior, shallow);

export const useWindowSettings = () => useSettingsStore((state) => state.window, shallow);

export const useHotkeySettings = () => useSettingsStore((state) => state.hotkeys, shallow);

export const useMpvSettings = () =>
  useSettingsStore((state) => state.playback.mpvProperties, shallow);
