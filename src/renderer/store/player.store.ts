import map from 'lodash/map';
import merge from 'lodash/merge';
import shuffle from 'lodash/shuffle';
import { nanoid } from 'nanoid/non-secure';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import { PlayerData, QueueData, QueueSong } from '/@/shared/types/domain-types';
import { Play, PlayerRepeat, PlayerShuffle, PlayerStatus } from '/@/shared/types/types';

export interface PlayerSlice extends PlayerState {
    actions: {
        addToQueue: (args: {
            initialIndex: number;
            playType: Play;
            songs: QueueSong[];
        }) => PlayerData;
        autoNext: () => PlayerData;
        checkIsFirstTrack: () => boolean;
        checkIsLastTrack: (type?: 'next' | 'prev') => boolean;
        clearQueue: () => PlayerData;
        getPlayerData: () => PlayerData;
        getQueueData: () => QueueData;
        incrementPlayCount: (ids: string[]) => string[];
        moveToBottomOfQueue: (uniqueIds: string[]) => PlayerData;
        moveToNextOfQueue: (uniqueIds: string[]) => PlayerData;
        moveToTopOfQueue: (uniqueIds: string[]) => PlayerData;
        next: () => PlayerData;
        pause: () => void;
        play: () => void;
        player1: () => QueueSong | undefined;
        player2: () => QueueSong | undefined;
        previous: () => PlayerData;
        removeFromQueue: (uniqueIds: string[]) => PlayerData;
        reorderQueue: (rowUniqueIds: string[], afterUniqueId?: string) => PlayerData;
        restoreQueue: (data: Partial<PlayerState>) => PlayerData;
        setCurrentIndex: (index: number) => PlayerData;
        setCurrentSpeed: (speed: number) => void;
        setCurrentTime: (time: number, seek?: boolean) => void;
        setCurrentTrack: (uniqueId: string) => PlayerData;
        setFallback: (fallback: boolean | null) => boolean;
        setFavorite: (ids: string[], favorite: boolean) => string[];
        setMuted: (muted: boolean) => void;
        setRating: (ids: string[], rating: null | number) => string[];
        setRepeat: (type: PlayerRepeat) => PlayerData;
        setShuffle: (type: PlayerShuffle) => PlayerData;
        setShuffledIndex: (index: number) => PlayerData;
        setStore: (data: Partial<PlayerState>) => void;
        setVolume: (volume: number) => void;
        shuffleQueue: () => PlayerData;
    };
}

export interface PlayerState {
    current: {
        index: number;
        nextIndex: number;
        player: 1 | 2;
        previousIndex: number;
        seek: boolean;
        shuffledIndex: number;
        song?: QueueSong;
        status: PlayerStatus;
        time: number;
    };
    fallback: boolean | null;
    muted: boolean;
    queue: {
        default: QueueSong[];
        previousNode?: QueueSong;
        shuffled: string[];
        sorted: QueueSong[];
    };
    repeat: PlayerRepeat;
    shuffle: PlayerShuffle;
    speed: number;
    volume: number;
}

export const usePlayerStore = createWithEqualityFn<PlayerSlice>()(
    subscribeWithSelector(
        persist(
            devtools(
                immer((set, get) => ({
                    actions: {
                        addToQueue: (args) => {
                            const { initialIndex, playType, songs } = args;
                            const songsToAddToQueue = map(songs, (song) => ({
                                ...song,
                                uniqueId: nanoid(),
                            }));

                            // If the queue is empty, next/last should behave the same as now
                            if (playType === Play.SHUFFLE) {
                                const songs = shuffle(songsToAddToQueue);
                                const initialSong = songs[0];

                                if (get().shuffle === PlayerShuffle.TRACK) {
                                    const shuffledIds = [
                                        initialSong.uniqueId,
                                        ...shuffle(songs.slice(1).map((song) => song.uniqueId)),
                                    ];

                                    set((state) => {
                                        state.queue.default = songs;
                                        state.queue.shuffled = shuffledIds;
                                        state.current.time = 0;
                                        state.current.player = 1;
                                        state.current.index = 0;
                                        state.current.shuffledIndex = 0;
                                        state.current.song = initialSong;
                                    });
                                } else {
                                    set((state) => {
                                        state.queue.default = songs;
                                        state.queue.shuffled = [];
                                        state.current.time = 0;
                                        state.current.player = 1;
                                        state.current.index = 0;
                                        state.current.shuffledIndex = 0;
                                        state.current.song = initialSong;
                                    });
                                }

                                return get().actions.getPlayerData();
                            }

                            const shuffledQueue = get().queue.shuffled;
                            const queue = get().queue.default;
                            const { shuffledIndex } = get().current;

                            if (playType === Play.NOW || queue.length === 0) {
                                const index = initialIndex || 0;
                                if (get().shuffle === PlayerShuffle.TRACK) {
                                    const initialSong = songsToAddToQueue[index];
                                    const queueCopy = [...songsToAddToQueue];

                                    // Splice the initial song from the queue
                                    queueCopy.splice(index, 1);

                                    const shuffledSongIndicesWithoutInitial = shuffle(
                                        queueCopy,
                                    ).map((song) => song.uniqueId);

                                    // Add the initial song to the start of the shuffled queue
                                    const shuffledSongIndices = [
                                        initialSong.uniqueId,
                                        ...shuffledSongIndicesWithoutInitial,
                                    ];

                                    set((state) => {
                                        state.queue.shuffled = shuffledSongIndices;
                                        state.queue.default = songsToAddToQueue;
                                        state.current.time = 0;
                                        state.current.player = 1;
                                        state.current.index = 0;
                                        state.current.shuffledIndex = 0;
                                        state.current.song = initialSong;
                                    });
                                } else {
                                    set((state) => {
                                        state.queue.default = songsToAddToQueue;
                                        state.current.time = 0;
                                        state.current.player = 1;
                                        state.current.index = index;
                                        state.current.shuffledIndex = 0;
                                        state.current.song = songsToAddToQueue[index];
                                    });
                                }
                            } else if (playType === Play.LAST) {
                                // Shuffle the queue after the current track
                                const shuffledQueueWithNewSongs =
                                    get().shuffle === PlayerShuffle.TRACK
                                        ? [
                                              ...shuffledQueue.slice(0, shuffledIndex + 1),
                                              ...shuffle([
                                                  ...songsToAddToQueue.map((song) => song.uniqueId),
                                                  ...shuffledQueue.slice(shuffledIndex + 1),
                                              ]),
                                          ]
                                        : [];

                                set((state) => {
                                    state.queue.default = [
                                        ...get().queue.default,
                                        ...songsToAddToQueue,
                                    ];
                                    state.queue.shuffled = shuffledQueueWithNewSongs;
                                });
                            } else if (playType === Play.NEXT) {
                                const currentIndex = get().current.index;

                                if (get().shuffle === PlayerShuffle.TRACK) {
                                    const shuffledIndex = get().current.shuffledIndex;
                                    const shuffledQueue = get().queue.shuffled;

                                    // Shuffle the queue after the current track
                                    const shuffledQueueWithNewSongs = [
                                        ...shuffledQueue.slice(0, shuffledIndex + 1),
                                        ...shuffle(songsToAddToQueue.map((song) => song.uniqueId)),
                                        ...shuffledQueue.slice(shuffledIndex + 1),
                                    ];

                                    set((state) => {
                                        state.queue.default = [
                                            ...queue.slice(0, currentIndex + 1),
                                            ...songsToAddToQueue,
                                            ...queue.slice(currentIndex + 1),
                                        ];
                                        state.queue.shuffled = shuffledQueueWithNewSongs;
                                    });
                                } else {
                                    set((state) => {
                                        state.queue.default = [
                                            ...queue.slice(0, currentIndex + 1),
                                            ...songsToAddToQueue,
                                            ...queue.slice(currentIndex + 1),
                                        ];
                                        state.queue.shuffled = [];
                                    });
                                }
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
                                const nextShuffleIndex = isLastTrack
                                    ? 0
                                    : get().current.shuffledIndex + 1;

                                const nextSong = get().queue.default.find(
                                    (song) =>
                                        song.uniqueId === get().queue.shuffled[nextShuffleIndex],
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

                                    if (isLastTrack) {
                                        state.queue.shuffled = shuffle(get().queue.shuffled);
                                    }
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

                            if (isLastTrack && repeat === PlayerRepeat.NONE) {
                                set((state) => {
                                    state.current.time = 0;
                                    state.current.status = PlayerStatus.PAUSED;
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
                        checkIsLastTrack: (type) => {
                            const isShuffled = get().shuffle === PlayerShuffle.TRACK;
                            const queueLength = get().queue.default.length - 1;
                            const modifier = type === 'next' ? 1 : type === 'prev' ? -1 : 0;

                            if (isShuffled) {
                                const currentIndex = get().current.shuffledIndex + modifier;
                                return currentIndex === queueLength;
                            }

                            return get().current.index + modifier === queueLength;
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

                                const next =
                                    nextSongIndex !== undefined
                                        ? (queue.find(
                                              (song) =>
                                                  song.uniqueId ===
                                                  shuffledQueue[nextSongIndex as number],
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
                                    next:
                                        nextSongIndex !== undefined
                                            ? queue[nextSongIndex]
                                            : undefined,
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
                            const foundUniqueIds: string[] = [];

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

                            const songsToMove = queue.filter((song) =>
                                uniqueIds.includes(song.uniqueId),
                            );
                            const songsToStay = queue.filter(
                                (song) => !uniqueIds.includes(song.uniqueId),
                            );

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
                        moveToNextOfQueue: (uniqueIds) => {
                            const queue = get().queue.default;
                            const songsToMove = queue.filter((song) =>
                                uniqueIds.includes(song.uniqueId),
                            );
                            const currentSong = get().current.song;
                            const currentPosition =
                                get().current.index -
                                queue
                                    .slice(0, get().current.index)
                                    .filter((song) => uniqueIds.includes(song.uniqueId)).length;
                            const songsToStay = queue.filter(
                                (song) => !uniqueIds.includes(song.uniqueId),
                            );
                            const newQueue = [
                                ...songsToStay.slice(0, currentPosition + 1),
                                ...songsToMove,
                                ...songsToStay.slice(currentPosition + 1),
                            ];
                            const newCurrentSongIndex = newQueue.findIndex(
                                (song) => song.uniqueId === currentSong?.uniqueId,
                            );
                            set((state) => {
                                state.queue.default = newQueue;
                                state.current.index = newCurrentSongIndex;
                            });
                            return get().actions.getPlayerData();
                        },
                        moveToTopOfQueue: (uniqueIds) => {
                            const queue = get().queue.default;

                            const songsToMove = queue.filter((song) =>
                                uniqueIds.includes(song.uniqueId),
                            );
                            const songsToStay = queue.filter(
                                (song) => !uniqueIds.includes(song.uniqueId),
                            );

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
                                const nextShuffleIndex = isLastTrack
                                    ? 0
                                    : get().current.shuffledIndex + 1;

                                const nextSong = get().queue.default.find(
                                    (song) =>
                                        song.uniqueId === get().queue.shuffled[nextShuffleIndex],
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

                                if (isLastTrack) {
                                    get().actions.setShuffle(PlayerShuffle.TRACK);
                                }
                            } else {
                                let nextIndex = 0;

                                if (repeat === PlayerRepeat.ALL) {
                                    nextIndex = isLastTrack ? 0 : get().current.index + 1;
                                } else {
                                    nextIndex = isLastTrack
                                        ? get().current.index
                                        : get().current.index + 1;
                                }

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
                                const prevShuffleIndex = isFirstTrack
                                    ? 0
                                    : get().current.shuffledIndex - 1;

                                const prevSong = get().queue.default.find(
                                    (song) =>
                                        song.uniqueId === get().queue.shuffled[prevShuffleIndex],
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
                            const currentPosition = get().current.index;
                            let queueShift = 0;

                            let isCurrentSongRemoved = false;

                            const newQueue = queue.filter((song, index) => {
                                const shouldKeep = !uniqueIds.includes(song.uniqueId);
                                if (!shouldKeep) {
                                    if (index < currentPosition) {
                                        queueShift += 1;
                                    } else if (index === currentPosition) {
                                        isCurrentSongRemoved = true;
                                    }
                                }

                                return shouldKeep;
                            });
                            const newShuffledQueue = get().queue.shuffled.filter(
                                (uniqueId) => !uniqueIds.includes(uniqueId),
                            );

                            set((state) => {
                                state.queue.default = newQueue;
                                state.queue.shuffled = newShuffledQueue;
                                if (isCurrentSongRemoved) {
                                    const newPosition = Math.min(
                                        newQueue.length - 1,
                                        currentPosition - queueShift,
                                    );
                                    state.current.song = newQueue[newPosition];
                                    state.current.index = newPosition;
                                } else {
                                    // if we removed any songs prior to the current one,
                                    // shift the index back as necessary
                                    state.current.index -= queueShift;
                                }
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
                                      ...queue.filter((song) =>
                                          rowUniqueIds.includes(song.uniqueId),
                                      ),
                                      ...queueWithoutSelectedRows.slice(moveBeforeIndex),
                                  ]
                                : [
                                      ...queueWithoutSelectedRows,
                                      ...queue.filter((song) =>
                                          rowUniqueIds.includes(song.uniqueId),
                                      ),
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
                        restoreQueue: (data) => {
                            set((state) => {
                                state.current = {
                                    ...state.current,
                                    ...data.current,
                                    time: 0,
                                };
                                state.queue = {
                                    ...state.queue,
                                    ...data.queue,
                                };
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
                        setCurrentSpeed: (speed) => {
                            set((state) => {
                                state.speed = speed;
                            });
                        },
                        setCurrentTime: (time, seek = false) => {
                            set((state) => {
                                state.current.seek = seek;
                                state.current.time = time;
                            });
                        },
                        setCurrentTrack: (uniqueId) => {
                            if (get().shuffle === PlayerShuffle.TRACK) {
                                const defaultIndex = get().queue.default.findIndex(
                                    (song) => song.uniqueId === uniqueId,
                                );

                                const shuffledIndex = get().queue.shuffled.findIndex(
                                    (id) => id === uniqueId,
                                );

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
                        setFallback: (fallback) => {
                            set((state) => {
                                state.fallback = fallback;
                            });

                            return fallback || false;
                        },
                        setFavorite: (ids, favorite) => {
                            const { default: queue } = get().queue;
                            const foundUniqueIds: string[] = [];

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

                            const previousSongId = get().queue.previousNode?.id;
                            if (previousSongId && ids.includes(previousSongId)) {
                                set((state) => {
                                    if (state.queue.previousNode) {
                                        state.queue.previousNode.userFavorite = favorite;
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
                            const foundUniqueIds: string[] = [];

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
                                const currentSongId = get().current.song?.uniqueId;

                                let currentIndex = 0;

                                if (currentSongId) {
                                    currentIndex = get().queue.default.findIndex(
                                        (song) => song.uniqueId === currentSongId,
                                    );
                                }

                                set((state) => {
                                    state.shuffle = type;
                                    state.current.index = currentIndex;
                                    state.queue.shuffled = [];
                                });

                                return get().actions.getPlayerData();
                            }

                            const currentSongId = get().current.song?.uniqueId;

                            const queueWithoutCurrentSong = get().queue.default.filter(
                                (song) => song.uniqueId !== currentSongId,
                            );

                            const shuffledSongIds = shuffle(queueWithoutCurrentSong).map(
                                (song) => song.uniqueId,
                            );

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

                            if (queue.length > 2) {
                                const index = get().current.index;

                                const first = queue.slice(0, index);
                                const second = queue.slice(index + 1);
                                const shuffledQueue = shuffle(first.concat(second));
                                shuffledQueue.splice(index, 0, queue[index]);

                                set((state) => {
                                    state.queue.default = shuffledQueue;
                                });
                            }

                            return get().actions.getPlayerData();
                        },
                    },
                    current: {
                        index: 0,
                        nextIndex: 0,
                        player: 1,
                        previousIndex: 0,
                        seek: false,
                        shuffledIndex: 0,
                        song: {} as QueueSong,
                        status: PlayerStatus.PAUSED,
                        time: 0,
                    },
                    fallback: null,
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
                    speed: 1.0,
                    transcode: {
                        enabled: false,
                    },
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
                    const notPersisted = ['queue', 'current', 'entry', 'fallback'];
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
            moveToNextOfQueue: state.actions.moveToNextOfQueue,
            moveToTopOfQueue: state.actions.moveToTopOfQueue,
            removeFromQueue: state.actions.removeFromQueue,
            reorderQueue: state.actions.reorderQueue,
            restoreQueue: state.actions.restoreQueue,
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
            return a.current.song?.uniqueId === b.current.song?.uniqueId;
        },
    );

export const useCurrentPlayer = () => usePlayerStore((state) => state.current.player);

export const useCurrentStatus = () => usePlayerStore((state) => state.current.status);

export const usePreviousSong = () => usePlayerStore((state) => state.queue.previousNode);

export const useRepeatStatus = () => usePlayerStore((state) => state.repeat);

export const useShuffleStatus = () => usePlayerStore((state) => state.shuffle);

export const useCurrentTime = () => usePlayerStore((state) => state.current.time);

export const useSeeked = () => usePlayerStore((state) => state.current.seek);

export const useVolume = () => usePlayerStore((state) => state.volume);

export const useMuted = () => usePlayerStore((state) => state.muted);

export const useSpeed = () => usePlayerStore((state) => state.speed);

export const usePlayerFallback = () => usePlayerStore((state) => state.fallback);

export const useSetPlayerFallback = () => usePlayerStore((state) => state.actions.setFallback);

export const useSetCurrentSpeed = () => usePlayerStore((state) => state.actions.setCurrentSpeed);

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
