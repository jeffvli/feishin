/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-unused-vars */
import produce from 'immer';
import create from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  Play,
  CrossfadeStyle,
  PlaybackStyle,
  PlaybackType,
  PlayerRepeat,
  PlayerStatus,
  Song,
} from '../../types';
import { setLocalStorageSettings } from '../utils';

export interface PlayerState {
  current: {
    index: number;
    player: 1 | 2;
    song: Song;
    status: PlayerStatus;
    time: number;
  };
  queue: {
    default: Song[];
    shuffled: Song[];
    sorted: Song[];
  };
  settings: {
    crossfadeDuration: number;
    crossfadeStyle: CrossfadeStyle;
    muted: boolean;
    repeat: PlayerRepeat;
    shuffle: boolean;
    style: PlaybackStyle;
    type: PlaybackType;
    volume: number;
  };
}

export interface PlayerData {
  current: {
    index: number;
    player: 1 | 2;
    song: Song;
    status: PlayerStatus;
    time: number;
  };
  player1: Song;
  player2: Song;
  queue: {
    current: Song;
    next: Song;
    previous: Song;
  };
}

export interface PlayerSlice extends PlayerState {
  addToQueue: (songs: Song[], type: Play) => PlayerData;
  autoNext: () => PlayerData;
  getPlayerData: () => PlayerData;
  next: () => PlayerData;
  pause: () => void;
  play: () => void;
  player1: () => Song;
  player2: () => Song;
  prev: () => PlayerData;
  setCurrentTime: (time: number) => void;
  setSettings: (settings: Partial<PlayerState['settings']>) => void;
}

export const usePlayerStore = create<PlayerSlice>()(
  devtools((set, get) => ({
    addToQueue: (songs, type) => {
      if (type === Play.NOW) {
        set(
          produce((state) => {
            state.queue.default = songs;
            state.current.time = 0;
            state.current.player = 1;
            state.current.index = 0;
            state.current.song = songs[0];
          })
        );
      } else if (type === Play.LAST) {
        set(
          produce((state) => {
            state.queue.default = [...get().queue.default, ...songs];
          })
        );
      } else if (type === Play.NEXT) {
        const queue = get().queue.default;
        const currentIndex = get().current.index;

        set(
          produce((state) => {
            state.queue.default = [
              ...queue.slice(0, currentIndex + 1),
              ...songs,
              ...queue.slice(currentIndex + 1),
            ];
          })
        );
      }

      return get().getPlayerData();
    },
    autoNext: () => {
      set(
        produce((state) => {
          state.current.time = 0;
          state.current.index += 1;
          state.current.player = state.current.player === 1 ? 2 : 1;
          state.current.song = state.queue.default[state.current.index];
        })
      );

      return get().getPlayerData();
    },
    current: {
      index: 0,
      player: 1,
      song: {} as Song,
      status: PlayerStatus.PAUSED,
      time: 0,
    },
    getPlayerData: () => {
      const queue = get().queue.default;
      const currentPlayer = get().current.player;

      const player1 =
        currentPlayer === 1
          ? queue[get().current.index]
          : queue[get().current.index + 1];

      const player2 =
        currentPlayer === 1
          ? queue[get().current.index + 1]
          : queue[get().current.index];

      return {
        current: {
          index: get().current.index,
          player: get().current.player,
          song: get().current.song,
          status: get().current.status,
          time: get().current.time,
        },
        player1,
        player2,
        queue: {
          current: queue[get().current.index],
          next: queue[get().current.index + 1],
          previous: queue[get().current.index - 1],
        },
      };
    },
    next: () => {
      set(
        produce((state) => {
          state.current.time = 0;
          state.current.index += 1;
          state.current.player = 1;
          state.current.song = state.queue.default[state.current.index];
        })
      );

      return get().getPlayerData();
    },
    pause: () => {
      set(
        produce((state) => {
          state.current.status = PlayerStatus.PAUSED;
        })
      );
    },
    play: () => {
      set(
        produce((state) => {
          state.current.status = PlayerStatus.PLAYING;
        })
      );
    },
    player1: () => {
      return get().getPlayerData().player1;
    },
    player2: () => {
      return get().getPlayerData().player2;
    },
    prev: () => {
      set(
        produce((state) => {
          state.current.time = 0;
          state.current.index =
            state.current.index - 1 < 0 ? 0 : state.current.index - 1;
          state.current.player = 1;
          state.current.song = state.queue.default[state.current.index];
        })
      );

      return get().getPlayerData();
    },
    queue: {
      default: [],
      shuffled: [],
      sorted: [],
    },
    setCurrentTime: (time) => {
      set(
        produce((state) => {
          state.current.time = time;
        })
      );
    },
    setSettings: (settings) => {
      set(
        produce((state) => {
          state.settings = { ...get().settings, ...settings };
        })
      );

      try {
        setLocalStorageSettings('player', get().settings);
      } catch (err) {
        console.log('none');
      }
    },
    settings: {
      crossfadeDuration: 5,
      crossfadeStyle: CrossfadeStyle.EQUALPOWER,
      muted: false,
      repeat: PlayerRepeat.NONE,
      shuffle: false,
      style: PlaybackStyle.GAPLESS,
      type: PlaybackType.LOCAL,
      volume: 50,
    },
  }))
);
