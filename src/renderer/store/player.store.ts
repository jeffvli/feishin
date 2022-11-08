/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-unused-vars */
import produce from 'immer';
import map from 'lodash/map';
import { nanoid } from 'nanoid/non-secure';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Song } from '@/renderer/api/types';
import { Play, PlayerStatus, UniqueId } from '@/renderer/types';

type QueueSong = Song & UniqueId;

export interface PlayerState {
  current: {
    index: number;
    player: 1 | 2;
    song: QueueSong;
    status: PlayerStatus;
    time: number;
  };
  muted: boolean;
  queue: {
    default: QueueSong[];
    previousNode: QueueSong;
    shuffled: QueueSong[];
    sorted: QueueSong[];
  };
  volume: number;
}

export interface PlayerData {
  current: {
    index: number;
    player: 1 | 2;
    song: QueueSong;
    status: PlayerStatus;
  };
  player1: QueueSong;
  player2: QueueSong;
  queue: QueueData;
}

export interface QueueData {
  current: QueueSong;
  next: QueueSong;
  previous: QueueSong;
}

export interface PlayerSlice extends PlayerState {
  addToQueue: (songs: Song[], type: Play) => PlayerData;
  autoNext: () => PlayerData;
  getPlayerData: () => PlayerData;
  getQueueData: () => QueueData;
  next: () => PlayerData;
  pause: () => void;
  play: () => void;
  player1: () => QueueSong;
  player2: () => QueueSong;
  prev: () => PlayerData;
  setCurrentIndex: (index: number) => PlayerData;
  setCurrentTime: (time: number) => void;
  setMuted: (muted: boolean) => void;
  setVolume: (volume: number) => void;
}

export const usePlayerStore = create<PlayerSlice>()(
  persist(
    devtools(
      (set, get) => ({
        addToQueue: (songs, type) => {
          const queueSongs = map(songs, (song) => ({
            ...song,
            uniqueId: nanoid(),
          }));

          if (type === Play.NOW) {
            set(
              produce((state) => {
                state.queue.default = queueSongs;
                state.current.time = 0;
                state.current.player = 1;
                state.current.index = 0;
                state.current.song = queueSongs[0];
              })
            );
          } else if (type === Play.LAST) {
            set(
              produce((state) => {
                state.queue.default = [...get().queue.default, ...queueSongs];
              })
            );
          } else if (type === Play.NEXT) {
            const queue = get().queue.default;
            const currentIndex = get().current.index;

            set(
              produce((state) => {
                state.queue.default = [
                  ...queue.slice(0, currentIndex + 1),
                  ...queueSongs,
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
              state.queue.previousNode = get().current.song;
            })
          );

          return get().getPlayerData();
        },
        current: {
          index: 0,
          player: 1,
          song: {} as QueueSong,
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
        getQueueData: () => {
          const queue = get().queue.default;
          return {
            current: queue[get().current.index],
            next: queue[get().current.index + 1],
            previous: queue[get().current.index - 1],
          };
        },
        muted: false,
        next: () => {
          set(
            produce((state) => {
              state.current.time = 0;
              state.current.index += 1;
              state.current.player = 1;
              state.current.song = state.queue.default[state.current.index];
              state.queue.previousNode = get().current.song;
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
              state.queue.previousNode = get().current.song;
            })
          );

          return get().getPlayerData();
        },
        queue: {
          default: [],
          previousNode: {} as QueueSong,
          shuffled: [],
          sorted: [],
        },
        setCurrentIndex: (index) => {
          set(
            produce((state) => {
              state.current.time = 0;
              state.current.index = index;
              state.current.player = 1;
              state.current.song = state.queue.default[index];
              state.queue.previousNode = get().current.song;
            })
          );

          return get().getPlayerData();
        },
        setCurrentTime: (time) => {
          set(
            produce((state) => {
              state.current.time = time;
            })
          );
        },
        setMuted: (muted: boolean) => {
          set(
            produce((state) => {
              state.muted = muted;
            })
          );
        },
        setVolume: (volume: number) => {
          set(
            produce((state) => {
              state.volume = volume;
            })
          );
        },
        volume: 50,
      }),
      { name: 'store_player' }
    ),
    { name: 'store_player' }
  )
);
