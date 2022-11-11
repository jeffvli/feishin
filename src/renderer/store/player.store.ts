/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-unused-vars */
import map from 'lodash/map';
import shuffle from 'lodash/shuffle';
import { nanoid } from 'nanoid/non-secure';
import create from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { Song } from '@/renderer/api/types';
import {
  Play,
  PlayerRepeat,
  PlayerShuffle,
  PlayerStatus,
  UniqueId,
} from '@/renderer/types';

type QueueSong = Song & UniqueId;

export interface PlayerState {
  current: {
    index: number;
    nextIndex: number;
    player: 1 | 2;
    previousIndex: number;
    shuffledIndex: number;
    song?: QueueSong;
    status: PlayerStatus;
    time: number;
  };
  muted: boolean;
  queue: {
    default: QueueSong[];
    previousNode?: QueueSong;
    shuffled: string[];
    sorted: QueueSong[];
  };
  repeat: PlayerRepeat;
  shuffle: PlayerShuffle;
  volume: number;
}

export interface PlayerData {
  current: {
    index: number;
    nextIndex?: number;
    player: 1 | 2;
    previousIndex?: number;
    shuffledIndex: number;
    song?: QueueSong;
    status: PlayerStatus;
  };
  player1?: QueueSong;
  player2?: QueueSong;
  queue: QueueData;
}

export interface QueueData {
  current?: QueueSong;
  next?: QueueSong;
  previous?: QueueSong;
}

export interface PlayerSlice extends PlayerState {
  addToQueue: (songs: Song[], type: Play) => PlayerData;
  autoNext: () => PlayerData;
  checkIsFirstTrack: () => boolean;
  checkIsLastTrack: () => boolean;
  // getNextTrack: () => QueueSong;
  // getPreviousTrack: () => QueueSong;
  getPlayerData: () => PlayerData;
  getQueueData: () => QueueData;
  next: () => PlayerData;
  pause: () => void;
  play: () => void;
  player1: () => QueueSong | undefined;
  player2: () => QueueSong | undefined;
  prev: () => PlayerData;
  setCurrentIndex: (index: number) => PlayerData;
  setCurrentTime: (time: number) => void;
  setMuted: (muted: boolean) => void;
  setRepeat: (type: PlayerRepeat) => PlayerData;
  setShuffle: (type: PlayerShuffle) => PlayerData;
  setShuffledIndex: (index: number) => PlayerData;
  setStore: (data: Partial<PlayerState>) => void;
  setVolume: (volume: number) => void;
}

export const usePlayerStore = create<PlayerSlice>()(
  persist(
    devtools(
      immer((set, get) => ({
        addToQueue: (songs, type) => {
          const shuffledIndex = get().current.shuffledIndex;
          const shuffledQueue = get().queue.shuffled;
          const queueSongs = map(songs, (song) => ({
            ...song,
            uniqueId: nanoid(),
          }));

          if (type === Play.NOW) {
            if (get().shuffle === PlayerShuffle.TRACK) {
              const shuffledSongs = shuffle(queueSongs);
              const foundIndex = queueSongs.findIndex(
                (song) => song.uniqueId === shuffledSongs[0].uniqueId
              );
              set((state) => {
                state.queue.shuffled = shuffledSongs.map(
                  (song) => song.uniqueId
                );
              });

              set((state) => {
                state.queue.default = queueSongs;
                state.current.time = 0;
                state.current.player = 1;
                state.current.index = foundIndex;
                state.current.shuffledIndex = 0;
                state.current.song = shuffledSongs[0];
              });
            } else {
              set((state) => {
                state.queue.default = queueSongs;
                state.current.time = 0;
                state.current.player = 1;
                state.current.index = 0;
                state.current.shuffledIndex = 0;
                state.current.song = queueSongs[0];
              });
            }
          } else if (type === Play.LAST) {
            // Shuffle the queue after the current track
            const shuffledQueueWithNewSongs =
              get().shuffle === PlayerShuffle.TRACK
                ? [
                    ...shuffledQueue.slice(0, shuffledIndex + 1),
                    ...shuffle([
                      ...queueSongs.map((song) => song.uniqueId),
                      ...shuffledQueue.slice(shuffledIndex + 1),
                    ]),
                  ]
                : [];

            set((state) => {
              state.queue.default = [...get().queue.default, ...queueSongs];
              state.queue.shuffled = shuffledQueueWithNewSongs;
            });
          } else if (type === Play.NEXT) {
            const queue = get().queue.default;
            const currentIndex = get().current.index;

            // Shuffle the queue after the current track
            const shuffledQueueWithNewSongs =
              get().shuffle === PlayerShuffle.TRACK
                ? [
                    ...shuffledQueue.slice(0, shuffledIndex + 1),
                    ...shuffle([
                      ...queueSongs.map((song) => song.uniqueId),
                      ...shuffledQueue.slice(shuffledIndex + 1),
                    ]),
                  ]
                : [];

            set((state) => {
              state.queue.default = [
                ...queue.slice(0, currentIndex + 1),
                ...queueSongs,
                ...queue.slice(currentIndex + 1),
              ];
              state.queue.shuffled = shuffledQueueWithNewSongs;
            });
          }

          return get().getPlayerData();
        },
        autoNext: () => {
          const isLastTrack = get().checkIsLastTrack();
          const repeat = get().repeat;

          if (repeat === PlayerRepeat.ONE) {
            const nextIndex = get().current.index;

            set((state) => {
              state.current.time = 0;
              state.current.index = nextIndex;
              state.current.shuffledIndex = get().current.shuffledIndex;
              state.current.player = state.current.player === 1 ? 2 : 1;
              state.current.song = get().queue.default[nextIndex];
              state.queue.previousNode = get().current.song;
            });
          } else if (get().shuffle === PlayerShuffle.TRACK) {
            const nextShuffleIndex = isLastTrack
              ? 0
              : get().current.shuffledIndex + 1;

            const nextSong = get().queue.default.find(
              (song) => song.uniqueId === get().queue.shuffled[nextShuffleIndex]
            );

            const nextSongIndex = get().queue.default.findIndex(
              (song) => song.uniqueId === nextSong!.uniqueId
            );

            set((state) => {
              state.current.time = 0;
              state.current.index = nextSongIndex!;
              state.current.shuffledIndex = nextShuffleIndex;
              state.current.player = state.current.player === 1 ? 2 : 1;
              state.current.song = nextSong!;
              state.queue.previousNode = get().current.song;
            });
          } else {
            const nextIndex = isLastTrack ? 0 : get().current.index + 1;

            set((state) => {
              state.current.time = 0;
              state.current.index = nextIndex;
              state.current.player = state.current.player === 1 ? 2 : 1;
              state.current.song = get().queue.default[nextIndex];
              state.queue.previousNode = get().current.song;
            });
          }

          return get().getPlayerData();
        },
        checkIsFirstTrack: () => {
          const currentIndex =
            get().shuffle === PlayerShuffle.TRACK
              ? get().current.shuffledIndex
              : get().current.index;

          return currentIndex === 0;
        },
        checkIsLastTrack: () => {
          const currentIndex =
            get().shuffle === PlayerShuffle.TRACK
              ? get().current.shuffledIndex
              : get().current.index;

          return currentIndex === get().queue.default.length - 1;
        },
        current: {
          index: 0,
          nextIndex: 0,
          player: 1,
          previousIndex: 0,
          shuffledIndex: 0,
          song: {} as QueueSong,
          status: PlayerStatus.PAUSED,
          time: 0,
        },
        // getNextTrack: () => {
        //   const shuffle = get().shuffle;
        //   const queue = get().queue.default;
        //   const shuffledQueue = get().queue.shuffled;

        //   if (shuffle === PlayerShuffle.TRACK) {

        //   }

        //   const currentIndex =
        //     shuffle === PlayerShuffle.TRACK
        //       ? get().current.shuffledIndex
        //       : get().current.index;

        //   const current = queue.find(
        //     (song) => song.uniqueId === queue[currentIndex]
        //   ) as QueueSong;

        //   let nextSongIndex: number | undefined;
        //   if (repeat === PlayerRepeat.ALL) {
        //     if (isLastTrack) nextSongIndex = 0;
        //     else nextSongIndex = currentIndex + 1;
        //   }

        //   if (repeat === PlayerRepeat.ONE) {
        //     nextSongIndex = currentIndex;
        //   }

        //   if (repeat === PlayerRepeat.NONE) {
        //     if (isLastTrack) nextSongIndex = undefined;
        //     else nextSongIndex = currentIndex + 1;
        //   }

        //   const next = nextSongIndex
        //     ? (queue.find(
        //         (song) => song.uniqueId === queue[nextSongIndex as number]
        //       ) as QueueSong)
        //     : undefined;
        // },
        getPlayerData: () => {
          const queue = get().queue.default;
          const currentPlayer = get().current.player;
          const repeat = get().repeat;
          const isLastTrack = get().checkIsLastTrack();
          const isFirstTrack = get().checkIsFirstTrack();

          let player1;
          let player2;
          if (get().shuffle === PlayerShuffle.TRACK) {
            const shuffledQueue = get().queue.shuffled;
            const shuffledIndex = get().current.shuffledIndex;
            const current = queue.find(
              (song) => song.uniqueId === shuffledQueue[shuffledIndex]
            ) as QueueSong;

            let nextSongIndex: number | undefined;
            let previousSongIndex: number | undefined;
            if (repeat === PlayerRepeat.ALL) {
              if (isLastTrack) nextSongIndex = 0;
              else nextSongIndex = shuffledIndex + 1;

              if (isFirstTrack) previousSongIndex = queue.length - 1;
              else previousSongIndex = shuffledIndex - 1;
            }

            if (repeat === PlayerRepeat.ONE) {
              nextSongIndex = shuffledIndex;
              previousSongIndex = shuffledIndex;
            }

            if (repeat === PlayerRepeat.NONE) {
              if (isLastTrack) nextSongIndex = undefined;
              else nextSongIndex = shuffledIndex + 1;

              if (isFirstTrack) previousSongIndex = undefined;
              else previousSongIndex = shuffledIndex - 1;
            }

            const next = nextSongIndex
              ? (queue.find(
                  (song) =>
                    song.uniqueId === shuffledQueue[nextSongIndex as number]
                ) as QueueSong)
              : undefined;

            const previous = queue.find(
              (song) => song.uniqueId === shuffledQueue[shuffledIndex - 1]
            ) as QueueSong;

            player1 = currentPlayer === 1 ? current : next;
            player2 = currentPlayer === 1 ? next : current;

            return {
              current: {
                index: get().current.index,
                nextIndex: nextSongIndex,
                player: get().current.player,
                previousIndex: previousSongIndex,
                shuffledIndex: get().current.shuffledIndex,
                song: get().current.song,
                status: get().current.status,
              },
              player1,
              player2,
              queue: {
                current,
                next,
                previous,
              },
            };
          }

          const currentIndex = get().current.index;

          let nextSongIndex;
          let previousSongIndex;
          if (repeat === PlayerRepeat.ALL) {
            if (isLastTrack) nextSongIndex = 0;
            else nextSongIndex = currentIndex + 1;

            if (isFirstTrack) previousSongIndex = queue.length - 1;
            else previousSongIndex = currentIndex - 1;
          }

          if (repeat === PlayerRepeat.ONE) {
            nextSongIndex = currentIndex;
            previousSongIndex = currentIndex;
          }

          if (repeat === PlayerRepeat.NONE) {
            if (isLastTrack) nextSongIndex = undefined;
            else nextSongIndex = currentIndex + 1;

            if (isFirstTrack) previousSongIndex = undefined;
            else previousSongIndex = currentIndex - 1;
          }

          player1 =
            currentPlayer === 1
              ? queue[currentIndex]
              : nextSongIndex !== undefined
              ? queue[nextSongIndex]
              : undefined;

          player2 =
            currentPlayer === 1
              ? nextSongIndex !== undefined
                ? queue[nextSongIndex]
                : undefined
              : queue[currentIndex];

          return {
            current: {
              index: currentIndex,
              nextIndex: nextSongIndex,
              player: get().current.player,
              previousIndex: previousSongIndex,
              shuffledIndex: get().current.shuffledIndex,
              song: get().current.song,
              status: get().current.status,
            },
            player1,
            player2,
            queue: {
              current: queue[currentIndex],
              next:
                nextSongIndex !== undefined ? queue[nextSongIndex] : undefined,
              previous: queue[currentIndex - 1],
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
          const isLastTrack = get().checkIsLastTrack();
          const repeat = get().repeat;

          if (get().shuffle === PlayerShuffle.TRACK) {
            const nextShuffleIndex = isLastTrack
              ? 0
              : get().current.shuffledIndex + 1;

            const nextSong = get().queue.default.find(
              (song) => song.uniqueId === get().queue.shuffled[nextShuffleIndex]
            );

            const nextSongIndex = get().queue.default.findIndex(
              (song) => song.uniqueId === nextSong?.uniqueId
            );

            set((state) => {
              state.current.time = 0;
              state.current.index = nextSongIndex!;
              state.current.shuffledIndex = nextShuffleIndex;
              state.current.player = 1;
              state.current.song = nextSong!;
              state.queue.previousNode = get().current.song;
            });
          } else {
            const nextIndex =
              repeat === PlayerRepeat.ALL
                ? isLastTrack
                  ? 0
                  : get().current.index + 1
                : isLastTrack
                ? get().current.index
                : get().current.index + 1;

            set((state) => {
              state.current.time = 0;
              state.current.index = nextIndex;
              state.current.player = 1;
              state.current.song = get().queue.default[nextIndex];
              state.queue.previousNode = get().current.song;
            });
          }

          return get().getPlayerData();
        },
        pause: () => {
          set((state) => {
            state.current.status = PlayerStatus.PAUSED;
          });
        },
        play: () => {
          set((state) => {
            state.current.status = PlayerStatus.PLAYING;
          });
        },
        player1: () => {
          return get().getPlayerData().player1;
        },
        player2: () => {
          return get().getPlayerData().player2;
        },
        prev: () => {
          const isFirstTrack = get().checkIsFirstTrack();
          const repeat = get().repeat;

          if (get().shuffle === PlayerShuffle.TRACK) {
            const prevShuffleIndex = isFirstTrack
              ? 0
              : get().current.shuffledIndex - 1;

            const prevSong = get().queue.default.find(
              (song) => song.uniqueId === get().queue.shuffled[prevShuffleIndex]
            );

            const prevIndex = get().queue.default.findIndex(
              (song) => song.uniqueId === prevSong?.uniqueId
            );

            set((state) => {
              state.current.time = 0;
              state.current.index = prevIndex!;
              state.current.shuffledIndex = prevShuffleIndex;
              state.current.player = 1;
              state.current.song = prevSong!;
              state.queue.previousNode = get().current.song;
            });
          } else {
            let prevIndex: number;
            if (repeat === PlayerRepeat.ALL) {
              prevIndex = isFirstTrack
                ? get().queue.default.length - 1
                : get().current.index - 1;
            } else {
              prevIndex = isFirstTrack ? 0 : get().current.index - 1;
            }

            set((state) => {
              state.current.time = 0;
              state.current.index = prevIndex;
              state.current.player = 1;
              state.current.song = state.queue.default[state.current.index];
              state.queue.previousNode = get().current.song;
            });
          }

          return get().getPlayerData();
        },
        queue: {
          default: [],
          played: [],
          previousNode: {} as QueueSong,
          shuffled: [],
          sorted: [],
        },
        repeat: PlayerRepeat.NONE,
        setCurrentIndex: (index) => {
          if (get().shuffle === PlayerShuffle.TRACK) {
            const foundSong = get().queue.default.find(
              (song) => song.uniqueId === get().queue.shuffled[index]
            );
            const foundIndex = get().queue.default.findIndex(
              (song) => song.uniqueId === foundSong?.uniqueId
            );
            set((state) => {
              state.current.time = 0;
              state.current.index = foundIndex!;
              state.current.shuffledIndex = index;
              state.current.player = 1;
              state.current.song = foundSong!;
              state.queue.previousNode = get().current.song;
            });
          } else {
            set((state) => {
              state.current.time = 0;
              state.current.index = index;
              state.current.player = 1;
              state.current.song = state.queue.default[index];
              state.queue.previousNode = get().current.song;
            });
          }

          return get().getPlayerData();
        },
        setCurrentTime: (time) => {
          set((state) => {
            state.current.time = time;
          });
        },
        setMuted: (muted: boolean) => {
          set((state) => {
            state.muted = muted;
          });
        },
        setRepeat: (type: PlayerRepeat) => {
          set((state) => {
            state.repeat = type;
          });

          return get().getPlayerData();
        },
        setShuffle: (type: PlayerShuffle) => {
          if (type === PlayerShuffle.NONE) {
            set((state) => {
              state.shuffle = type;
              state.queue.shuffled = [];
            });

            return get().getPlayerData();
          }

          const currentSongId = get().current.song?.uniqueId;

          const queueWithoutCurrentSong = get().queue.default.filter(
            (song) => song.uniqueId !== currentSongId
          );

          const shuffledSongIds = shuffle(queueWithoutCurrentSong).map(
            (song) => song.uniqueId
          );

          set((state) => {
            state.shuffle = type;
            state.current.shuffledIndex = 0;
            state.queue.shuffled = [currentSongId!, ...shuffledSongIds];
          });

          return get().getPlayerData();
        },
        setShuffledIndex: (index) => {
          set((state) => {
            state.current.time = 0;
            state.current.shuffledIndex = index;
            state.current.player = 1;
            state.current.song = state.queue.default[index];
            state.queue.previousNode = get().current.song;
          });

          return get().getPlayerData();
        },
        setStore: (data) => {
          set({ ...get(), ...data });
        },
        setVolume: (volume: number) => {
          set((state) => {
            state.volume = volume;
          });
        },
        shuffle: PlayerShuffle.NONE,
        volume: 50,
      })),
      { name: 'store_player' }
    ),
    { name: 'store_player' }
  )
);
