import map from 'lodash/map';
import merge from 'lodash/merge';
import shuffle from 'lodash/shuffle';
import { nanoid } from 'nanoid/non-secure';
import create from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { QueueSong } from '/@/renderer/api/types';
import { PlayerStatus, PlayerRepeat, PlayerShuffle, Play } from '/@/renderer/types';

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
  length: number;
  next?: QueueSong;
  previous?: QueueSong;
}

export interface PlayerSlice extends PlayerState {
  actions: {
    addToQueue: (args: { initialIndex: number; playType: Play; songs: QueueSong[] }) => PlayerData;
    autoNext: () => PlayerData;
    checkIsFirstTrack: () => boolean;
    checkIsLastTrack: () => boolean;
    clearQueue: () => PlayerData;
    getPlayerData: () => PlayerData;
    getQueueData: () => QueueData;
    incrementPlayCount: (ids: string[]) => string[];
    moveToBottomOfQueue: (uniqueIds: string[]) => PlayerData;
    moveToTopOfQueue: (uniqueIds: string[]) => PlayerData;
    next: () => PlayerData;
    pause: () => void;
    play: () => void;
    player1: () => QueueSong | undefined;
    player2: () => QueueSong | undefined;
    previous: () => PlayerData;
    removeFromQueue: (uniqueIds: string[]) => PlayerData;
    reorderQueue: (rowUniqueIds: string[], afterUniqueId?: string) => PlayerData;
    setCurrentIndex: (index: number) => PlayerData;
    setCurrentTime: (time: number) => void;
    setCurrentTrack: (uniqueId: string) => PlayerData;
    setFavorite: (ids: string[], favorite: boolean) => string[];
    setMuted: (muted: boolean) => void;
    setRating: (ids: string[], rating: number | null) => string[];
    setRepeat: (type: PlayerRepeat) => PlayerData;
    setShuffle: (type: PlayerShuffle) => PlayerData;
    setShuffledIndex: (index: number) => PlayerData;
    setStore: (data: Partial<PlayerState>) => void;
    setVolume: (volume: number) => void;
    shuffleQueue: () => PlayerData;
  };
}

export const usePlayerStore = create<PlayerSlice>()(
  subscribeWithSelector(
    persist(
      devtools(
        immer((set, get) => ({
          actions: {
            addToQueue: (args) => {
              const { playType, songs } = args;
              const { shuffledIndex } = get().current;
              const shuffledQueue = get().queue.shuffled;
              const queueSongs = map(songs, (song) => ({
                ...song,
                uniqueId: nanoid(),
              }));

              if (playType === Play.NOW) {
                if (get().shuffle === PlayerShuffle.TRACK) {
                  const shuffledSongs = shuffle(queueSongs);
                  const foundIndex = queueSongs.findIndex(
                    (song) => song.uniqueId === shuffledSongs[0].uniqueId,
                  );
                  set((state) => {
                    state.queue.shuffled = shuffledSongs.map((song) => song.uniqueId);
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
              } else if (playType === Play.LAST) {
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
              } else if (playType === Play.NEXT) {
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

              return get().actions.getPlayerData();
            },
            autoNext: () => {
              const isLastTrack = get().actions.checkIsLastTrack();
              const { repeat } = get();

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
                const nextShuffleIndex = isLastTrack ? 0 : get().current.shuffledIndex + 1;

                const nextSong = get().queue.default.find(
                  (song) => song.uniqueId === get().queue.shuffled[nextShuffleIndex],
                );

                const nextSongIndex = get().queue.default.findIndex(
                  (song) => song.uniqueId === nextSong!.uniqueId,
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

              return get().actions.getPlayerData();
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
            clearQueue: () => {
              set((state) => {
                state.queue.default = [];
                state.queue.shuffled = [];
                state.queue.sorted = [];
                state.current.index = 0;
                state.current.shuffledIndex = 0;
                state.current.player = 1;
                state.current.song = undefined;
              });

              return get().actions.getPlayerData();
            },
            getPlayerData: () => {
              const queue = get().queue.default;
              const currentPlayer = get().current.player;
              const { repeat } = get();
              const isLastTrack = get().actions.checkIsLastTrack();
              const isFirstTrack = get().actions.checkIsFirstTrack();

              let player1;
              let player2;
              if (get().shuffle === PlayerShuffle.TRACK) {
                const shuffledQueue = get().queue.shuffled;
                const { shuffledIndex } = get().current;
                const current = queue.find(
                  (song) => song.uniqueId === shuffledQueue[shuffledIndex],
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
                      (song) => song.uniqueId === shuffledQueue[nextSongIndex as number],
                    ) as QueueSong)
                  : undefined;

                const previous = queue.find(
                  (song) => song.uniqueId === shuffledQueue[shuffledIndex - 1],
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
                    length: get().queue.default.length || 0,
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
                  length: get().queue.default.length || 0,
                  next: nextSongIndex !== undefined ? queue[nextSongIndex] : undefined,
                  previous: queue[currentIndex - 1],
                },
              };
            },
            getQueueData: () => {
              const queue = get().queue.default;
              return {
                current: queue[get().current.index],
                length: queue.length || 0,
                next: queue[get().current.index + 1],
                previous: queue[get().current.index - 1],
              };
            },
            incrementPlayCount: (ids) => {
              const { default: queue } = get().queue;
              const foundUniqueIds = [];

              for (const id of ids) {
                const foundIndex = queue.findIndex((song) => song.id === id);
                if (foundIndex !== -1) {
                  foundUniqueIds.push(queue[foundIndex].uniqueId);
                  set((state) => {
                    state.queue.default[foundIndex].playCount += 1;
                  });
                }
              }

              const currentSongId = get().current.song?.id;
              if (currentSongId && ids.includes(currentSongId)) {
                set((state) => {
                  if (state.current.song) {
                    state.current.song.playCount += 1;
                  }
                });
              }

              return foundUniqueIds;
            },
            moveToBottomOfQueue: (uniqueIds) => {
              const queue = get().queue.default;

              const songsToMove = queue.filter((song) => uniqueIds.includes(song.uniqueId));
              const songsToStay = queue.filter((song) => !uniqueIds.includes(song.uniqueId));

              const reorderedQueue = [...songsToStay, ...songsToMove];

              const currentSongUniqueId = get().current.song?.uniqueId;
              const newCurrentSongIndex = reorderedQueue.findIndex(
                (song) => song.uniqueId === currentSongUniqueId,
              );

              set((state) => {
                state.current.index = newCurrentSongIndex;
                state.queue.default = reorderedQueue;
              });

              return get().actions.getPlayerData();
            },
            moveToTopOfQueue: (uniqueIds) => {
              const queue = get().queue.default;

              const songsToMove = queue.filter((song) => uniqueIds.includes(song.uniqueId));
              const songsToStay = queue.filter((song) => !uniqueIds.includes(song.uniqueId));

              const reorderedQueue = [...songsToMove, ...songsToStay];

              const currentSongUniqueId = get().current.song?.uniqueId;
              const newCurrentSongIndex = reorderedQueue.findIndex(
                (song) => song.uniqueId === currentSongUniqueId,
              );

              set((state) => {
                state.current.index = newCurrentSongIndex;
                state.queue.default = reorderedQueue;
              });

              return get().actions.getPlayerData();
            },
            next: () => {
              const isLastTrack = get().actions.checkIsLastTrack();
              const { repeat } = get();

              if (get().shuffle === PlayerShuffle.TRACK) {
                const nextShuffleIndex = isLastTrack ? 0 : get().current.shuffledIndex + 1;

                const nextSong = get().queue.default.find(
                  (song) => song.uniqueId === get().queue.shuffled[nextShuffleIndex],
                );

                const nextSongIndex = get().queue.default.findIndex(
                  (song) => song.uniqueId === nextSong?.uniqueId,
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

              return get().actions.getPlayerData();
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
              return get().actions.getPlayerData().player1;
            },
            player2: () => {
              return get().actions.getPlayerData().player2;
            },
            previous: () => {
              const isFirstTrack = get().actions.checkIsFirstTrack();
              const { repeat } = get();

              if (get().shuffle === PlayerShuffle.TRACK) {
                const prevShuffleIndex = isFirstTrack ? 0 : get().current.shuffledIndex - 1;

                const prevSong = get().queue.default.find(
                  (song) => song.uniqueId === get().queue.shuffled[prevShuffleIndex],
                );

                const prevIndex = get().queue.default.findIndex(
                  (song) => song.uniqueId === prevSong?.uniqueId,
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

              return get().actions.getPlayerData();
            },
            removeFromQueue: (uniqueIds) => {
              const queue = get().queue.default;

              const newQueue = queue.filter((song) => !uniqueIds.includes(song.uniqueId));

              set((state) => {
                state.queue.default = newQueue;
              });

              return get().actions.getPlayerData();
            },
            reorderQueue: (rowUniqueIds: string[], afterUniqueId?: string) => {
              // Don't move if dropping on top of a selected row
              if (afterUniqueId && rowUniqueIds.includes(afterUniqueId)) {
                return get().actions.getPlayerData();
              }

              const queue = get().queue.default;
              const currentSongUniqueId = get().current.song?.uniqueId;
              const queueWithoutSelectedRows = queue.filter(
                (song) => !rowUniqueIds.includes(song.uniqueId),
              );

              const moveBeforeIndex = queueWithoutSelectedRows.findIndex(
                (song) => song.uniqueId === afterUniqueId,
              );

              // AG-Grid does not provide node data when a row is moved to the bottom of the list
              const reorderedQueue = afterUniqueId
                ? [
                    ...queueWithoutSelectedRows.slice(0, moveBeforeIndex),
                    ...queue.filter((song) => rowUniqueIds.includes(song.uniqueId)),
                    ...queueWithoutSelectedRows.slice(moveBeforeIndex),
                  ]
                : [
                    ...queueWithoutSelectedRows,
                    ...queue.filter((song) => rowUniqueIds.includes(song.uniqueId)),
                  ];

              const currentSongIndex = reorderedQueue.findIndex(
                (song) => song.uniqueId === currentSongUniqueId,
              );

              set({
                current: { ...get().current, index: currentSongIndex },
                queue: { ...get().queue, default: reorderedQueue },
              });

              return get().actions.getPlayerData();
            },
            setCurrentIndex: (index) => {
              if (get().shuffle === PlayerShuffle.TRACK) {
                const foundSong = get().queue.default.find(
                  (song) => song.uniqueId === get().queue.shuffled[index],
                );
                const foundIndex = get().queue.default.findIndex(
                  (song) => song.uniqueId === foundSong?.uniqueId,
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

              return get().actions.getPlayerData();
            },
            setCurrentTime: (time) => {
              set((state) => {
                state.current.time = time;
              });
            },
            setCurrentTrack: (uniqueId) => {
              if (get().shuffle === PlayerShuffle.TRACK) {
                const defaultIndex = get().queue.default.findIndex(
                  (song) => song.uniqueId === uniqueId,
                );

                const shuffledIndex = get().queue.shuffled.findIndex((id) => id === uniqueId);

                set((state) => {
                  state.current.time = 0;
                  state.current.index = defaultIndex;
                  state.current.shuffledIndex = shuffledIndex;
                  state.current.player = 1;
                  state.current.song = state.queue.default[defaultIndex];
                  state.queue.previousNode = get().current.song;
                });
              } else {
                const defaultIndex = get().queue.default.findIndex(
                  (song) => song.uniqueId === uniqueId,
                );

                set((state) => {
                  state.current.time = 0;
                  state.current.index = defaultIndex;
                  state.current.player = 1;
                  state.current.song = state.queue.default[defaultIndex];
                  state.queue.previousNode = get().current.song;
                });
              }

              return get().actions.getPlayerData();
            },
            setFavorite: (ids, favorite) => {
              const { default: queue } = get().queue;
              const foundUniqueIds = [];

              for (const id of ids) {
                const foundIndex = queue.findIndex((song) => song.id === id);
                if (foundIndex !== -1) {
                  foundUniqueIds.push(queue[foundIndex].uniqueId);
                  set((state) => {
                    state.queue.default[foundIndex].userFavorite = favorite;
                  });
                }
              }

              const currentSongId = get().current.song?.id;
              if (currentSongId && ids.includes(currentSongId)) {
                set((state) => {
                  if (state.current.song) {
                    state.current.song.userFavorite = favorite;
                  }
                });
              }

              return foundUniqueIds;
            },
            setMuted: (muted: boolean) => {
              set((state) => {
                state.muted = muted;
              });
            },
            setRating: (ids, rating) => {
              const { default: queue } = get().queue;
              const foundUniqueIds = [];

              for (const id of ids) {
                const foundIndex = queue.findIndex((song) => song.id === id);
                if (foundIndex !== -1) {
                  foundUniqueIds.push(queue[foundIndex].uniqueId);
                  set((state) => {
                    state.queue.default[foundIndex].userRating = rating;
                  });
                }
              }

              const currentSongId = get().current.song?.id;
              if (currentSongId && ids.includes(currentSongId)) {
                set((state) => {
                  if (state.current.song) {
                    state.current.song.userRating = rating;
                  }
                });
              }

              return foundUniqueIds;
            },
            setRepeat: (type: PlayerRepeat) => {
              set((state) => {
                state.repeat = type;
              });

              return get().actions.getPlayerData();
            },
            setShuffle: (type: PlayerShuffle) => {
              if (type === PlayerShuffle.NONE) {
                set((state) => {
                  state.shuffle = type;
                  state.queue.shuffled = [];
                });

                return get().actions.getPlayerData();
              }

              const currentSongId = get().current.song?.uniqueId;

              const queueWithoutCurrentSong = get().queue.default.filter(
                (song) => song.uniqueId !== currentSongId,
              );

              const shuffledSongIds = shuffle(queueWithoutCurrentSong).map((song) => song.uniqueId);

              set((state) => {
                state.shuffle = type;
                state.current.shuffledIndex = 0;
                state.queue.shuffled = [currentSongId!, ...shuffledSongIds];
              });

              return get().actions.getPlayerData();
            },
            setShuffledIndex: (index) => {
              set((state) => {
                state.current.time = 0;
                state.current.shuffledIndex = index;
                state.current.player = 1;
                state.current.song = state.queue.default[index];
                state.queue.previousNode = get().current.song;
              });

              return get().actions.getPlayerData();
            },
            setStore: (data) => {
              set({ ...get(), ...data });
            },
            setVolume: (volume: number) => {
              set((state) => {
                state.volume = volume;
              });
            },
            shuffleQueue: () => {
              const queue = get().queue.default;
              const shuffledQueue = shuffle(queue);

              const currentSongUniqueId = get().current.song?.uniqueId;
              const newCurrentSongIndex = shuffledQueue.findIndex(
                (song) => song.uniqueId === currentSongUniqueId,
              );

              set((state) => {
                state.current.index = newCurrentSongIndex;
                state.queue.default = shuffledQueue;
              });

              return get().actions.getPlayerData();
            },
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
          muted: false,
          queue: {
            default: [],
            played: [],
            previousNode: {} as QueueSong,
            shuffled: [],
            sorted: [],
          },
          repeat: PlayerRepeat.NONE,
          shuffle: PlayerShuffle.NONE,
          volume: 50,
        })),
        { name: 'store_player' },
      ),
      {
        merge: (persistedState, currentState) => {
          return merge(currentState, persistedState);
        },
        name: 'store_player',
        partialize: (state) => {
          const notPersisted = ['queue', 'current'];
          return Object.fromEntries(
            Object.entries(state).filter(([key]) => !notPersisted.includes(key)),
          );
        },
        version: 1,
      },
    ),
  ),
);

export const usePlayerStoreActions = () => usePlayerStore((state) => state.actions);

export const usePlayerControls = () =>
  usePlayerStore(
    (state) => ({
      autoNext: state.actions.autoNext,
      next: state.actions.next,
      pause: state.actions.pause,
      play: state.actions.play,
      previous: state.actions.previous,
      setCurrentIndex: state.actions.setCurrentIndex,
      setMuted: state.actions.setMuted,
      setRepeat: state.actions.setRepeat,
      setShuffle: state.actions.setShuffle,
      setShuffledIndex: state.actions.setShuffledIndex,
      setVolume: state.actions.setVolume,
    }),
    shallow,
  );

export const useQueueControls = () =>
  usePlayerStore(
    (state) => ({
      addToQueue: state.actions.addToQueue,
      clearQueue: state.actions.clearQueue,
      moveToBottomOfQueue: state.actions.moveToBottomOfQueue,
      moveToTopOfQueue: state.actions.moveToTopOfQueue,
      removeFromQueue: state.actions.removeFromQueue,
      reorderQueue: state.actions.reorderQueue,
      setCurrentIndex: state.actions.setCurrentIndex,
      setCurrentTrack: state.actions.setCurrentTrack,
      setShuffledIndex: state.actions.setShuffledIndex,
      shuffleQueue: state.actions.shuffleQueue,
    }),
    shallow,
  );

export const useQueueData = () => usePlayerStore((state) => state.actions.getQueueData);

export const usePlayer1Data = () => usePlayerStore((state) => state.actions.player1());

export const usePlayer2Data = () => usePlayerStore((state) => state.actions.player2());

export const useSetCurrentTime = () => usePlayerStore((state) => state.actions.setCurrentTime);

export const useIsFirstTrack = () => usePlayerStore((state) => state.actions.checkIsFirstTrack);

export const useIsLastTrack = () => usePlayerStore((state) => state.actions.checkIsLastTrack);

export const useDefaultQueue = () => usePlayerStore((state) => state.queue.default);

export const useCurrentSong = () => usePlayerStore((state) => state.current.song);

export const usePlayerData = () =>
  usePlayerStore(
    (state) => state.actions.getPlayerData(),
    (a, b) => {
      return a.current.nextIndex === b.current.nextIndex;
    },
  );

export const useCurrentPlayer = () => usePlayerStore((state) => state.current.player);

export const useCurrentStatus = () => usePlayerStore((state) => state.current.status);

export const usePreviousSong = () => usePlayerStore((state) => state.queue.previousNode);

export const useRepeatStatus = () => usePlayerStore((state) => state.repeat);

export const useShuffleStatus = () => usePlayerStore((state) => state.shuffle);

export const useCurrentTime = () => usePlayerStore((state) => state.current.time);

export const useVolume = () => usePlayerStore((state) => state.volume);

export const useMuted = () => usePlayerStore((state) => state.muted);

export const useSetQueueFavorite = () => usePlayerStore((state) => state.actions.setFavorite);

export const useSetQueueRating = () => usePlayerStore((state) => state.actions.setRating);

export const useIncrementQueuePlayCount = () =>
  usePlayerStore((state) => state.actions.incrementPlayCount);

export const useQueueStatus = () =>
  usePlayerStore(
    (state) => ({
      currentSong: state.current.song,
      index: state.current.index,
      length: state.queue.default.length,
    }),
    shallow,
  );
