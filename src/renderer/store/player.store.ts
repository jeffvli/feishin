import merge from 'lodash/merge';
import { nanoid } from 'nanoid';
import { create } from 'zustand';
import { createJSONStorage, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';

import { createSelectors } from '/@/renderer/lib/zustand';
import { useSettingsStore } from '/@/renderer/store/settings.store';
import { idbStateStorage } from '/@/renderer/store/utils';
import { shuffleInPlace } from '/@/renderer/utils/shuffle';
import { PlayerData, QueueData, QueueSong, Song } from '/@/shared/types/domain-types';
import {
    Play,
    PlayerQueueType,
    PlayerRepeat,
    PlayerShuffle,
    PlayerStatus,
    PlayerStyle,
} from '/@/shared/types/types';

export interface PlayerState extends Actions, State {}

export type QueueGroupingProperty = keyof QueueSong;

interface Actions {
    addToQueueByType: (items: Song[], playType: Play) => void;
    addToQueueByUniqueId: (items: Song[], uniqueId: string, edge: 'bottom' | 'top') => void;
    clearQueue: () => void;
    clearSelected: (items: QueueSong[]) => void;
    decreaseVolume: (value: number) => void;
    getCurrentSong: () => QueueSong | undefined;
    getQueue: (groupBy?: QueueGroupingProperty) => GroupedQueue;
    getQueueOrder: () => {
        groups: { count: number; name: string }[];
        items: QueueSong[];
    };
    increaseVolume: (value: number) => void;
    mediaAutoNext: () => PlayerData;
    mediaNext: () => void;
    mediaPause: () => void;
    mediaPlay: (id?: string) => void;
    mediaPrevious: () => void;
    mediaSeekToTimestamp: (timestamp: number) => void;
    mediaSkipBackward: (offset?: number) => void;
    mediaSkipForward: (offset?: number) => void;
    mediaStop: () => void;
    mediaToggleMute: () => void;
    mediaTogglePlayPause: () => void;
    moveSelectedTo: (items: QueueSong[], uniqueId: string, edge: 'bottom' | 'top') => void;
    moveSelectedToBottom: (items: QueueSong[]) => void;
    moveSelectedToNext: (items: QueueSong[]) => void;
    moveSelectedToTop: (items: QueueSong[]) => void;
    setCrossfadeDuration: (duration: number) => void;
    setQueueType: (queueType: PlayerQueueType) => void;
    setRepeat: (repeat: PlayerRepeat) => void;
    setShuffle: (shuffle: PlayerShuffle) => void;
    setSpeed: (speed: number) => void;
    setTimestamp: (timestamp: number) => void;
    setTransitionType: (transitionType: PlayerStyle) => void;
    setVolume: (volume: number) => void;
    shuffle: () => void;
    shuffleAll: () => void;
    shuffleSelected: (items: QueueSong[]) => void;
    toggleRepeat: () => void;
    toggleShuffle: () => void;
}

interface GroupedQueue {
    groups: { count: number; name: string }[];
    items: QueueSong[];
}

interface State {
    player: {
        crossfadeDuration: number;
        index: number;
        muted: boolean;
        playerNum: 1 | 2;
        queueType: PlayerQueueType;
        repeat: PlayerRepeat;
        seekToTimestamp: string;
        shuffle: PlayerShuffle;
        speed: number;
        status: PlayerStatus;
        timestamp: number;
        transitionType: PlayerStyle;
        volume: number;
    };
    queue: QueueData;
}

export const usePlayerStoreBase = create<PlayerState>()(
    persist(
        subscribeWithSelector(
            immer((set, get) => ({
                addToQueueByType: (items, playType) => {
                    const newItems = items.map(toQueueSong);
                    const newUniqueIds = newItems.map((item) => item._uniqueId);

                    const queueType = getQueueType();

                    switch (queueType) {
                        case PlayerQueueType.DEFAULT: {
                            switch (playType) {
                                case Play.LAST: {
                                    set((state) => {
                                        const currentIndex = state.player.index;
                                        // Add new songs to songs object
                                        newItems.forEach((item) => {
                                            state.queue.songs[item._uniqueId] = item;
                                        });

                                        state.queue.default = [
                                            ...state.queue.default,
                                            ...newUniqueIds,
                                        ];

                                        if (state.player.shuffle === PlayerShuffle.TRACK) {
                                            state.queue.shuffled = [
                                                ...state.queue.shuffled.slice(0, currentIndex),
                                                state.queue.shuffled[currentIndex],
                                                ...shuffleInPlace([
                                                    ...state.queue.shuffled.slice(currentIndex + 1),
                                                    ...newUniqueIds,
                                                ]),
                                            ];
                                        }
                                    });
                                    break;
                                }
                                case Play.NEXT: {
                                    set((state) => {
                                        const currentIndex = state.player.index;
                                        // Add new songs to songs object
                                        newItems.forEach((item) => {
                                            state.queue.songs[item._uniqueId] = item;
                                        });

                                        state.queue.default = [
                                            ...state.queue.default.slice(0, currentIndex + 1),
                                            ...newUniqueIds,
                                            ...state.queue.default.slice(currentIndex + 1),
                                        ];

                                        if (state.player.shuffle === PlayerShuffle.TRACK) {
                                            state.queue.shuffled = [
                                                ...state.queue.shuffled.slice(0, currentIndex),
                                                state.queue.shuffled[currentIndex],
                                                ...shuffleInPlace([
                                                    ...state.queue.shuffled.slice(currentIndex + 1),
                                                    ...newUniqueIds,
                                                ]),
                                            ];
                                        }
                                    });
                                    break;
                                }
                                case Play.NOW: {
                                    set((state) => {
                                        // Add new songs to songs object
                                        newItems.forEach((item) => {
                                            state.queue.songs[item._uniqueId] = item;
                                        });

                                        state.queue.default = [];
                                        state.player.index = 0;
                                        state.player.status = PlayerStatus.PLAYING;
                                        state.player.playerNum = 1;
                                        state.queue.default = newUniqueIds;

                                        if (state.player.shuffle === PlayerShuffle.TRACK) {
                                            state.queue.shuffled = shuffleInPlace(newUniqueIds);
                                        }
                                    });

                                    break;
                                }
                            }
                            break;
                        }
                        case PlayerQueueType.PRIORITY: {
                            switch (playType) {
                                case Play.LAST: {
                                    set((state) => {
                                        // Add new songs to songs object
                                        newItems.forEach((item) => {
                                            state.queue.songs[item._uniqueId] = item;
                                        });

                                        state.queue.priority = [
                                            ...state.queue.priority,
                                            ...newUniqueIds,
                                        ];

                                        state.queue.shuffled = [
                                            ...state.queue.shuffled,
                                            ...newUniqueIds,
                                        ];
                                    });
                                    break;
                                }
                                case Play.NEXT: {
                                    set((state) => {
                                        const currentIndex = state.player.index;
                                        const isInPriority =
                                            currentIndex < state.queue.priority.length;

                                        // Add new songs to songs object
                                        newItems.forEach((item) => {
                                            state.queue.songs[item._uniqueId] = item;
                                        });

                                        if (isInPriority) {
                                            state.queue.priority = [
                                                ...state.queue.priority.slice(0, currentIndex + 1),
                                                ...newUniqueIds,
                                                ...state.queue.priority.slice(currentIndex + 1),
                                            ];
                                        } else {
                                            state.queue.priority = [
                                                ...state.queue.priority,
                                                ...newUniqueIds,
                                            ];
                                        }

                                        state.queue.shuffled = [
                                            ...state.queue.shuffled.slice(0, currentIndex),
                                            state.queue.shuffled[currentIndex],
                                            ...shuffleInPlace([
                                                ...state.queue.shuffled.slice(currentIndex + 1),
                                                ...newUniqueIds,
                                            ]),
                                        ];
                                    });
                                    break;
                                }
                                case Play.NOW: {
                                    set((state) => {
                                        // Add new songs to songs object
                                        newItems.forEach((item) => {
                                            state.queue.songs[item._uniqueId] = item;
                                        });

                                        state.queue.default = [];
                                        state.player.status = PlayerStatus.PLAYING;
                                        state.player.playerNum = 1;

                                        // Add the first item after the current playing track

                                        const currentIndex = state.player.index;

                                        const queue = state.getQueue();
                                        const currentTrack = queue.items[currentIndex];

                                        if (queue.items.length === 0) {
                                            state.queue.priority = [newUniqueIds[0]];
                                            state.queue.default = newUniqueIds.slice(1);
                                            state.player.index = 0;
                                        } else if (currentTrack) {
                                            const priorityIndex = state.queue.priority.findIndex(
                                                (id) => id === currentTrack._uniqueId,
                                            );

                                            // If the current track is in the priority queue, add the first item after the current track
                                            if (priorityIndex !== -1) {
                                                state.queue.priority = [
                                                    ...state.queue.priority.slice(
                                                        0,
                                                        priorityIndex + 1,
                                                    ),
                                                    newUniqueIds[0],
                                                    ...state.queue.priority.slice(
                                                        priorityIndex + 1,
                                                    ),
                                                ];

                                                state.player.index = priorityIndex + 1;

                                                state.queue.default = [
                                                    ...state.queue.default,
                                                    ...newUniqueIds.slice(1),
                                                ];
                                            } else {
                                                // If the current track is not in the priority queue, add it to the end of the priority queue
                                                state.queue.priority = [
                                                    ...state.queue.priority.slice(0, currentIndex),
                                                    newUniqueIds[0],
                                                    ...state.queue.priority.slice(currentIndex),
                                                ];

                                                state.queue.default = [
                                                    ...state.queue.default,
                                                    ...newUniqueIds.slice(1),
                                                ];

                                                state.player.index =
                                                    state.queue.priority.length - 1;
                                            }
                                        }

                                        if (state.player.shuffle === PlayerShuffle.TRACK) {
                                            state.queue.shuffled = shuffleInPlace(newUniqueIds);
                                        }
                                    });
                                    break;
                                }
                            }
                            break;
                        }
                    }
                },
                addToQueueByUniqueId: (items, uniqueId, edge) => {
                    const newItems = items.map(toQueueSong);
                    const newUniqueIds = newItems.map((item) => item._uniqueId);
                    const queueType = getQueueType();

                    set((state) => {
                        // Add new songs to songs object
                        newItems.forEach((item) => {
                            state.queue.songs[item._uniqueId] = item;
                        });

                        if (queueType === PlayerQueueType.DEFAULT) {
                            const index = state.queue.default.findIndex((id) => id === uniqueId);

                            const insertIndex = Math.max(0, edge === 'top' ? index : index + 1);

                            // Recalculate the player index if we're inserting items above the current index
                            if (insertIndex <= state.player.index) {
                                state.player.index = state.player.index + newUniqueIds.length;
                            }

                            const newQueue = [
                                ...state.queue.default.slice(0, insertIndex),
                                ...newUniqueIds,
                                ...state.queue.default.slice(insertIndex),
                            ];

                            recalculatePlayerIndex(state, newQueue);

                            state.queue.default = newQueue;
                        } else {
                            const priorityIndex = state.queue.priority.findIndex(
                                (id) => id === uniqueId,
                            );

                            if (priorityIndex !== -1) {
                                const insertIndex = Math.max(
                                    0,
                                    edge === 'top' ? priorityIndex : priorityIndex + 1,
                                );

                                state.queue.priority = [
                                    ...state.queue.priority.slice(0, insertIndex),
                                    ...newUniqueIds,
                                    ...state.queue.priority.slice(insertIndex),
                                ];
                            } else {
                                const defaultIndex = state.queue.default.findIndex(
                                    (id) => id === uniqueId,
                                );

                                if (defaultIndex !== -1) {
                                    const insertIndex = Math.max(
                                        0,
                                        edge === 'top' ? defaultIndex : defaultIndex + 1,
                                    );

                                    state.queue.default = [
                                        ...state.queue.default.slice(0, insertIndex),
                                        ...newUniqueIds,
                                        ...state.queue.default.slice(insertIndex),
                                    ];
                                }
                            }

                            if (state.player.shuffle === PlayerShuffle.TRACK) {
                                const currentIndex = state.player.index;

                                state.queue.shuffled = [
                                    ...state.queue.shuffled.slice(0, currentIndex),
                                    state.queue.shuffled[currentIndex],
                                    ...shuffleInPlace([
                                        ...state.queue.shuffled.slice(currentIndex + 1),
                                        ...newUniqueIds,
                                    ]),
                                ];
                            }
                        }
                    });
                },
                clearQueue: () => {
                    set((state) => {
                        state.player.index = -1;
                        state.queue.default = [];
                        state.queue.priority = [];
                        state.queue.songs = {};
                    });
                },
                clearSelected: (items: QueueSong[]) => {
                    set((state) => {
                        const uniqueIds = items.map((item) => item._uniqueId);

                        state.queue.default = state.queue.default.filter(
                            (id) => !uniqueIds.includes(id),
                        );

                        state.queue.priority = state.queue.priority.filter(
                            (id) => !uniqueIds.includes(id),
                        );

                        // Remove songs from songs object if they're not in default or priority
                        const remainingIds = new Set([
                            ...state.queue.default,
                            ...state.queue.priority,
                        ]);
                        const filteredSongs: Record<string, QueueSong> = {};
                        Object.values(state.queue.songs).forEach((song) => {
                            if (remainingIds.has(song._uniqueId)) {
                                filteredSongs[song._uniqueId] = song;
                            }
                        });
                        state.queue.songs = filteredSongs;

                        const newQueue = [...state.queue.priority, ...state.queue.default];

                        recalculatePlayerIndex(state, newQueue);
                    });
                },
                decreaseVolume: (value: number) => {
                    set((state) => {
                        state.player.volume = Math.max(0, state.player.volume - value);
                    });
                },
                getCurrentSong: () => {
                    const queue = get().getQueue();
                    return queue.items[get().player.index];
                },
                getQueue: (groupBy?: QueueGroupingProperty) => {
                    const queue = get().getQueueOrder();
                    const queueType = getQueueType();

                    if (!groupBy || queueType === PlayerQueueType.PRIORITY) {
                        return queue;
                    }

                    // Track groups in order of appearance
                    const groups: { count: number; name: string }[] = [];
                    const seenGroups = new Set<string>();

                    // Process items and build groups in order
                    queue.items.forEach((item) => {
                        const groupValue = String(item[groupBy] || 'Unknown');

                        if (!seenGroups.has(groupValue)) {
                            seenGroups.add(groupValue);
                            groups.push({ count: 1, name: groupValue });
                        } else {
                            // Find the last occurrence of this group value
                            const lastIndex = [...groups]
                                .reverse()
                                .findIndex((g) => g.name === groupValue);
                            if (lastIndex === -1) return;

                            // If the previous group is different, create a new group
                            const previousGroup = groups[groups.length - 1];
                            if (previousGroup.name !== groupValue) {
                                groups.push({ count: 1, name: groupValue });
                            } else {
                                // Increment the count of the last matching group
                                groups[groups.length - 1].count++;
                            }
                        }
                    });

                    return { groups, items: queue.items };
                },
                getQueueOrder: () => {
                    const queueType = getQueueType();
                    const state = get();
                    const songsMap = new Map(Object.entries(state.queue.songs));

                    if (queueType === PlayerQueueType.PRIORITY) {
                        const defaultIds = state.queue.default;
                        const priorityIds = state.queue.priority;

                        const defaultQueue = defaultIds
                            .map((id) => songsMap.get(id))
                            .filter((song): song is QueueSong => song !== undefined);
                        const priorityQueue = priorityIds
                            .map((id) => songsMap.get(id))
                            .filter((song): song is QueueSong => song !== undefined);

                        return {
                            groups: [
                                { count: priorityQueue.length, name: 'Priority' },
                                { count: defaultQueue.length, name: 'Default' },
                            ],
                            items: [...priorityQueue, ...defaultQueue],
                        };
                    }

                    const defaultIds = state.queue.default;
                    const defaultQueue = defaultIds
                        .map((id) => songsMap.get(id))
                        .filter((song): song is QueueSong => song !== undefined);

                    return {
                        groups: [{ count: defaultQueue.length, name: 'All' }],
                        items: defaultQueue,
                    };
                },
                increaseVolume: (value: number) => {
                    set((state) => {
                        state.player.volume = Math.min(100, state.player.volume + value);
                    });
                },
                mediaAutoNext: () => {
                    const currentIndex = get().player.index;
                    const player = get().player;
                    const repeat = player.repeat;
                    const queue = get().getQueueOrder();

                    const newPlayerNum = player.playerNum === 1 ? 2 : 1;
                    let newIndex = Math.min(queue.items.length - 1, currentIndex + 1);
                    let newStatus = PlayerStatus.PLAYING;

                    if (repeat === PlayerRepeat.ONE) {
                        newIndex = currentIndex;
                    }

                    if (newIndex === queue.items.length - 1) {
                        newStatus = PlayerStatus.PAUSED;
                    }

                    set((state) => {
                        state.player.index = newIndex;
                        state.player.playerNum = newPlayerNum;
                        state.player.timestamp = 0;
                        state.player.status = newStatus;
                    });

                    return {
                        currentSong: queue.items[newIndex],
                        index: newIndex,
                        muted: player.muted,
                        nextSong: queue.items[newIndex + 1],
                        num: newPlayerNum,
                        player1:
                            newPlayerNum === 1 ? queue.items[newIndex] : queue.items[newIndex + 1],
                        player2:
                            newPlayerNum === 2 ? queue.items[newIndex] : queue.items[newIndex + 1],
                        previousSong: queue.items[newIndex - 1],
                        queue: get().queue,
                        queueLength: queue.items.length,
                        repeat: player.repeat,
                        shuffle: player.shuffle,
                        speed: player.speed,
                        status: newStatus,
                        transitionType: player.transitionType,
                        volume: player.volume,
                    };
                },
                mediaNext: () => {
                    const currentIndex = get().player.index;
                    const queue = get().getQueueOrder();

                    set((state) => {
                        state.player.index = Math.min(queue.items.length - 1, currentIndex + 1);
                        state.player.playerNum = 1;
                    });
                },
                mediaPause: () => {
                    set((state) => {
                        state.player.status = PlayerStatus.PAUSED;
                    });
                },
                mediaPlay: (id?: string) => {
                    set((state) => {
                        if (id) {
                            const queue = state.getQueue();

                            const index = queue.items.findIndex((item) => item._uniqueId === id);

                            if (index !== -1) {
                                state.player.index = index;
                            }
                        }

                        state.player.status = PlayerStatus.PLAYING;
                    });
                },
                mediaPrevious: () => {
                    const currentIndex = get().player.index;

                    set((state) => {
                        // Only decrement if we're not at the start
                        state.player.index = Math.max(0, currentIndex - 1);
                    });
                },
                mediaSeekToTimestamp: (timestamp: number) => {
                    set((state) => {
                        state.player.seekToTimestamp = uniqueSeekToTimestamp(timestamp);
                    });
                },
                mediaSkipBackward: (offset?: number) => {
                    set((state) => {
                        const offsetFromSettings =
                            useSettingsStore.getState().general.skipButtons.skipBackwardSeconds;
                        const timeToSkip = offset ?? offsetFromSettings ?? 5;
                        const newTimestamp = Math.max(0, state.player.timestamp - timeToSkip);

                        state.player.seekToTimestamp = uniqueSeekToTimestamp(newTimestamp);
                    });
                },
                mediaSkipForward: (offset?: number) => {
                    set((state) => {
                        const queue = state.getQueue();
                        const index = state.player.index;
                        const currentTrack = queue.items[index];
                        const duration = currentTrack?.duration;
                        const offsetFromSettings =
                            useSettingsStore.getState().general.skipButtons.skipForwardSeconds;
                        const timeToSkip = offset ?? offsetFromSettings ?? 5;

                        if (!duration) {
                            return;
                        }

                        const newTimestamp = Math.min(
                            duration - 1,
                            state.player.timestamp + timeToSkip,
                        );

                        state.player.seekToTimestamp = uniqueSeekToTimestamp(newTimestamp);
                    });
                },
                mediaStop: () => {
                    set((state) => {
                        state.player.status = PlayerStatus.PAUSED;
                        state.player.timestamp = 0;
                        state.player.index = -1;
                        state.queue.default = [];
                        state.queue.priority = [];
                        state.queue.songs = {};
                    });
                },
                mediaToggleMute: () => {
                    set((state) => {
                        state.player.muted = !state.player.muted;
                    });
                },
                mediaTogglePlayPause: () => {
                    set((state) => {
                        if (state.player.status === PlayerStatus.PLAYING) {
                            state.player.status = PlayerStatus.PAUSED;
                        } else {
                            state.player.status = PlayerStatus.PLAYING;
                        }
                    });
                },
                moveSelectedTo: (items: QueueSong[], uniqueId: string, edge: 'bottom' | 'top') => {
                    const queueType = getQueueType();
                    const itemUniqueIds = items.map((item) => item._uniqueId);

                    set((state) => {
                        const existingIds = new Set(Object.keys(state.queue.songs));

                        // Add new songs to songs object (avoiding duplicates)
                        items.forEach((item) => {
                            if (!existingIds.has(item._uniqueId)) {
                                state.queue.songs[item._uniqueId] = item;
                            }
                        });

                        if (queueType == PlayerQueueType.DEFAULT) {
                            // Find the index of the drop target
                            const index = state.queue.default.findIndex((id) => id === uniqueId);

                            // Get the new index based on the edge
                            const insertIndex = Math.max(0, edge === 'top' ? index : index + 1);

                            const idsBefore = state.queue.default
                                .slice(0, insertIndex)
                                .filter((id) => !itemUniqueIds.includes(id));

                            const idsAfter = state.queue.default
                                .slice(insertIndex)
                                .filter((id) => !itemUniqueIds.includes(id));

                            const newQueue = [...idsBefore, ...itemUniqueIds, ...idsAfter];

                            recalculatePlayerIndex(state, newQueue);
                            state.queue.default = newQueue;
                        } else {
                            const priorityIndex = state.queue.priority.findIndex(
                                (id) => id === uniqueId,
                            );

                            // If the item is in the priority queue
                            if (priorityIndex !== -1) {
                                const newIndex = Math.max(
                                    0,
                                    edge === 'top' ? priorityIndex : priorityIndex + 1,
                                );

                                const idsBefore = state.queue.priority
                                    .slice(0, newIndex)
                                    .filter((id) => !itemUniqueIds.includes(id));

                                const idsAfter = state.queue.priority
                                    .slice(newIndex)
                                    .filter((id) => !itemUniqueIds.includes(id));

                                const newPriorityQueue = [
                                    ...idsBefore,
                                    ...itemUniqueIds,
                                    ...idsAfter,
                                ];

                                const newDefaultQueue = state.queue.default.filter(
                                    (id) => !itemUniqueIds.includes(id),
                                );

                                recalculatePlayerIndex(state, newPriorityQueue);

                                state.queue.priority = newPriorityQueue;
                                state.queue.default = newDefaultQueue;
                            } else {
                                const defaultIndex = state.queue.default.findIndex(
                                    (id) => id === uniqueId,
                                );

                                if (defaultIndex !== -1) {
                                    const newIndex = Math.max(
                                        0,
                                        edge === 'top' ? defaultIndex : defaultIndex + 1,
                                    );

                                    const idsBefore = state.queue.default
                                        .slice(0, newIndex)
                                        .filter((id) => !itemUniqueIds.includes(id));

                                    const idsAfter = state.queue.default
                                        .slice(newIndex)
                                        .filter((id) => !itemUniqueIds.includes(id));

                                    const newDefaultQueue = [
                                        ...idsBefore,
                                        ...itemUniqueIds,
                                        ...idsAfter,
                                    ];

                                    const newPriorityQueue = state.queue.priority.filter(
                                        (id) => !itemUniqueIds.includes(id),
                                    );

                                    recalculatePlayerIndex(state, newDefaultQueue);

                                    state.queue.default = newDefaultQueue;
                                    state.queue.priority = newPriorityQueue;
                                }
                            }
                        }
                    });
                },
                moveSelectedToBottom: (items: QueueSong[]) => {
                    set((state) => {
                        const uniqueIds = items.map((item) => item._uniqueId);

                        // Add new songs to songs object
                        items.forEach((item) => {
                            state.queue.songs[item._uniqueId] = item;
                        });

                        if (state.player.queueType === PlayerQueueType.PRIORITY) {
                            const priorityFiltered = state.queue.priority.filter(
                                (id) => !uniqueIds.includes(id),
                            );

                            const newPriorityQueue = [...priorityFiltered, ...uniqueIds];

                            const filtered = state.queue.default.filter(
                                (id) => !uniqueIds.includes(id),
                            );

                            const newDefaultQueue = [...filtered];

                            recalculatePlayerIndex(state, newPriorityQueue);

                            state.queue.default = newDefaultQueue;
                            state.queue.priority = newPriorityQueue;
                        } else {
                            const filtered = state.queue.default.filter(
                                (id) => !uniqueIds.includes(id),
                            );

                            const newQueue = [...filtered, ...uniqueIds];

                            recalculatePlayerIndex(state, newQueue);

                            state.queue.default = newQueue;
                        }
                    });
                },
                moveSelectedToNext: (items: QueueSong[]) => {
                    const queueType = getQueueType();

                    set((state) => {
                        const queue = state.getQueue();
                        const index = state.player.index;
                        const currentTrack = queue.items[index];
                        const uniqueId = currentTrack?._uniqueId;

                        const uniqueIds = items.map((item) => item._uniqueId);

                        // Add new songs to songs object
                        items.forEach((item) => {
                            state.queue.songs[item._uniqueId] = item;
                        });

                        if (queueType === PlayerQueueType.DEFAULT) {
                            const currentIndex = state.player.index;
                            const filtered = state.queue.default.filter(
                                (id) => !uniqueIds.includes(id),
                            );

                            const newQueue = [
                                ...filtered.slice(0, currentIndex + 1),
                                ...uniqueIds,
                                ...filtered.slice(currentIndex + 1),
                            ];

                            recalculatePlayerIndex(state, newQueue);
                            state.queue.default = newQueue;
                        } else {
                            const priorityIndex = state.queue.priority.findIndex(
                                (id) => id === uniqueId,
                            );

                            // If the item is in the priority queue
                            if (priorityIndex !== -1) {
                                const newIndex = Math.max(0, priorityIndex + 1);

                                const idsBefore = state.queue.priority
                                    .slice(0, newIndex)
                                    .filter((id) => !uniqueIds.includes(id));

                                const idsAfter = state.queue.priority
                                    .slice(newIndex)
                                    .filter((id) => !uniqueIds.includes(id));

                                const newPriorityQueue = [...idsBefore, ...uniqueIds, ...idsAfter];

                                const newDefaultQueue = state.queue.default.filter(
                                    (id) => !uniqueIds.includes(id),
                                );

                                recalculatePlayerIndex(state, newPriorityQueue);

                                state.queue.priority = newPriorityQueue;
                                state.queue.default = newDefaultQueue;
                            } else {
                                const defaultIndex = state.queue.default.findIndex(
                                    (id) => id === uniqueId,
                                );

                                if (defaultIndex !== -1) {
                                    const newIndex = Math.max(0, defaultIndex + 1);

                                    const idsBefore = state.queue.default
                                        .slice(0, newIndex)
                                        .filter((id) => !uniqueIds.includes(id));

                                    const idsAfter = state.queue.default
                                        .slice(newIndex)
                                        .filter((id) => !uniqueIds.includes(id));

                                    const newDefaultQueue = [
                                        ...idsBefore,
                                        ...uniqueIds,
                                        ...idsAfter,
                                    ];

                                    const newPriorityQueue = state.queue.priority.filter(
                                        (id) => !uniqueIds.includes(id),
                                    );

                                    recalculatePlayerIndex(state, newDefaultQueue);

                                    state.queue.default = newDefaultQueue;
                                    state.queue.priority = newPriorityQueue;
                                }
                            }
                        }
                    });
                },
                moveSelectedToTop: (items: QueueSong[]) => {
                    set((state) => {
                        const uniqueIds = items.map((item) => item._uniqueId);

                        // Add new songs to songs object
                        items.forEach((item) => {
                            state.queue.songs[item._uniqueId] = item;
                        });

                        if (state.player.queueType === PlayerQueueType.PRIORITY) {
                            const priorityFiltered = state.queue.priority.filter(
                                (id) => !uniqueIds.includes(id),
                            );

                            const newPriorityQueue = [...uniqueIds, ...priorityFiltered];

                            const filtered = state.queue.default.filter(
                                (id) => !uniqueIds.includes(id),
                            );

                            const newDefaultQueue = [...filtered];

                            recalculatePlayerIndex(state, newPriorityQueue);

                            state.queue.default = newDefaultQueue;
                            state.queue.priority = newPriorityQueue;
                        } else {
                            const filtered = state.queue.default.filter(
                                (id) => !uniqueIds.includes(id),
                            );

                            const newQueue = [...uniqueIds, ...filtered];

                            recalculatePlayerIndex(state, newQueue);

                            state.queue.default = newQueue;
                        }
                    });
                },
                player: {
                    crossfadeDuration: 5,
                    index: -1,
                    muted: false,
                    playerNum: 1,
                    queueType: PlayerQueueType.DEFAULT,
                    repeat: PlayerRepeat.NONE,
                    seekBackward: 10,
                    seekForward: 10,
                    seekToTimestamp: uniqueSeekToTimestamp(0),
                    shuffle: PlayerShuffle.NONE,
                    speed: 1,
                    status: PlayerStatus.PAUSED,
                    timestamp: 0,
                    transitionType: PlayerStyle.GAPLESS,
                    volume: 30,
                },
                queue: {
                    default: [],
                    priority: [],
                    shuffled: [],
                    songs: {},
                },
                setCrossfadeDuration: (duration: number) => {
                    set((state) => {
                        const normalizedDuration = Math.max(0, Math.min(10, duration));
                        state.player.crossfadeDuration = normalizedDuration;
                    });
                },
                setQueueType: (queueType: PlayerQueueType) => {
                    set((state) => {
                        // From default -> priority, move all items from default to priority
                        if (queueType === PlayerQueueType.PRIORITY) {
                            state.queue.priority = [
                                ...state.queue.default,
                                ...state.queue.priority,
                            ];
                            state.queue.default = [];
                        } else {
                            // From priority -> default, move all items from priority to the start of default
                            state.queue.default = [...state.queue.priority, ...state.queue.default];
                            state.queue.priority = [];
                        }

                        state.player.queueType = queueType;
                    });
                },
                setRepeat: (repeat: PlayerRepeat) => {
                    set((state) => {
                        state.player.repeat = repeat;
                    });
                },
                setShuffle: (shuffle: PlayerShuffle) => {
                    set((state) => {
                        state.player.shuffle = shuffle;
                        const queue = state.queue.default;
                        state.queue.shuffled = shuffleInPlace([...queue]);
                    });
                },
                setSpeed: (speed: number) => {
                    set((state) => {
                        const normalizedSpeed = Math.max(0.5, Math.min(2, speed));
                        state.player.speed = normalizedSpeed;
                    });
                },
                setTimestamp: (timestamp: number) => {
                    set((state) => {
                        state.player.timestamp = timestamp;
                    });
                },
                setTransitionType: (transitionType: PlayerStyle) => {
                    set((state) => {
                        state.player.transitionType = transitionType;
                    });
                },
                setVolume: (volume: number) => {
                    set((state) => {
                        state.player.volume = volume;
                    });
                },
                shuffle: () => {
                    set((state) => {
                        const queue = state.queue.default;
                        state.queue.shuffled = shuffleInPlace([...queue]);
                    });
                },
                shuffleAll: () => {
                    set((state) => {
                        const queue = state.queue.default;
                        state.queue.default = shuffleInPlace([...queue]);
                    });
                },
                shuffleSelected: (items: QueueSong[]) => {
                    set((state) => {
                        const itemUniqueIds = items.map((item) => item._uniqueId);
                        const indices = itemUniqueIds.map((id) =>
                            state.queue.default.findIndex((i) => i === id),
                        );

                        const shuffledIds = shuffleInPlace([...itemUniqueIds]);

                        indices.forEach((i, index) => {
                            if (i !== -1) {
                                state.queue.default[i] = shuffledIds[index];
                            }
                        });
                    });
                },
                toggleRepeat: () => {
                    set((state) => {
                        if (state.player.repeat === PlayerRepeat.NONE) {
                            state.player.repeat = PlayerRepeat.ONE;
                        } else if (state.player.repeat === PlayerRepeat.ONE) {
                            state.player.repeat = PlayerRepeat.ALL;
                        } else {
                            state.player.repeat = PlayerRepeat.NONE;
                        }
                    });
                },
                toggleShuffle: () => {
                    set((state) => {
                        state.player.shuffle =
                            state.player.shuffle === PlayerShuffle.NONE
                                ? PlayerShuffle.TRACK
                                : PlayerShuffle.NONE;
                    });
                },
            })),
        ),
        {
            merge: (persistedState: any, currentState: any) => {
                return merge(currentState, persistedState);
            },
            name: 'player-store',
            partialize: (state) => {
                // Exclude playerNum, seekToTimestamp, status, and timestamp from stored player object
                // These are not needed to be stored since they are ephemeral properties
                const excludedKeys = ['playerNum', 'seekToTimestamp', 'status', 'timestamp'];

                if (state.player) {
                    return {
                        ...state,
                        player: Object.fromEntries(
                            Object.entries(state.player).filter(
                                ([key]) => !excludedKeys.includes(key),
                            ),
                        ) as typeof state.player,
                    };
                }

                return state;
            },
            storage: createJSONStorage(() => idbStateStorage),
            version: 1,
        },
    ),
);

export const usePlayerStore = createSelectors(usePlayerStoreBase);

export const usePlayerActions = () => {
    return usePlayerStoreBase(
        useShallow((state) => ({
            addToQueueByType: state.addToQueueByType,
            addToQueueByUniqueId: state.addToQueueByUniqueId,
            clearQueue: state.clearQueue,
            clearSelected: state.clearSelected,
            decreaseVolume: state.decreaseVolume,
            getQueue: state.getQueue,
            increaseVolume: state.increaseVolume,
            mediaAutoNext: state.mediaAutoNext,
            mediaNext: state.mediaNext,
            mediaPause: state.mediaPause,
            mediaPlay: state.mediaPlay,
            mediaPrevious: state.mediaPrevious,
            mediaSeekToTimestamp: state.mediaSeekToTimestamp,
            mediaSkipBackward: state.mediaSkipBackward,
            mediaSkipForward: state.mediaSkipForward,
            mediaStop: state.mediaStop,
            mediaToggleMute: state.mediaToggleMute,
            mediaTogglePlayPause: state.mediaTogglePlayPause,
            moveSelectedTo: state.moveSelectedTo,
            moveSelectedToBottom: state.moveSelectedToBottom,
            moveSelectedToNext: state.moveSelectedToNext,
            moveSelectedToTop: state.moveSelectedToTop,
            setCrossfadeDuration: state.setCrossfadeDuration,
            setRepeat: state.setRepeat,
            setShuffle: state.setShuffle,
            setSpeed: state.setSpeed,
            setTimestamp: state.setTimestamp,
            setTransitionType: state.setTransitionType,
            setVolume: state.setVolume,
            shuffle: state.shuffle,
            shuffleAll: state.shuffleAll,
            shuffleSelected: state.shuffleSelected,
            toggleRepeat: state.toggleRepeat,
            toggleShuffle: state.toggleShuffle,
        })),
    );
};

export type AddToQueueByPlayType = Play;

export type AddToQueueByUniqueId = {
    edge: 'bottom' | 'left' | 'right' | 'top' | null;
    uniqueId: string;
};

export type AddToQueueType = AddToQueueByPlayType | AddToQueueByUniqueId;

export async function addToQueueByData(type: AddToQueueType, data: Song[]) {
    const items = data.map(toQueueSong);

    if (typeof type === 'string') {
        usePlayerStoreBase.getState().addToQueueByType(items, type);
    } else {
        const normalizedEdge = type.edge === 'top' ? 'top' : 'bottom';
        usePlayerStoreBase.getState().addToQueueByUniqueId(items, type.uniqueId, normalizedEdge);
    }
}

export const subscribePlayerQueue = (
    onChange: (queue: QueueData, prevQueue: QueueData) => void,
) => {
    return usePlayerStoreBase.subscribe(
        (state) => state.queue,
        (queue, prevQueue) => {
            onChange(queue, prevQueue);
        },
    );
};

export const subscribeCurrentTrack = (
    onChange: (
        properties: { index: number; song: QueueSong | undefined },
        prev: { index: number; song: QueueSong | undefined },
    ) => void,
) => {
    return usePlayerStoreBase.subscribe(
        (state) => {
            const queue = state.getQueue();
            const index = state.player.index;
            return { index, song: queue.items[index] };
        },
        (song, prevSong) => {
            onChange(song, prevSong);
        },
        {
            equalityFn: (a, b) => {
                return a.song?._uniqueId === b.song?._uniqueId;
            },
        },
    );
};

export const subscribePlayerProgress = (
    onChange: (properties: { timestamp: number }, prev: { timestamp: number }) => void,
) => {
    return usePlayerStoreBase.subscribe(
        (state) => state.player.timestamp,
        (timestamp, prevTimestamp) => {
            onChange({ timestamp }, { timestamp: prevTimestamp });
        },
    );
};

export const subscribePlayerVolume = (
    onChange: (properties: { volume: number }, prev: { volume: number }) => void,
) => {
    return usePlayerStoreBase.subscribe(
        (state) => state.player.volume,
        (volume, prevVolume) => {
            onChange({ volume }, { volume: prevVolume });
        },
    );
};

export const subscribePlayerStatus = (
    onChange: (properties: { status: PlayerStatus }, prev: { status: PlayerStatus }) => void,
) => {
    return usePlayerStoreBase.subscribe(
        (state) => state.player.status,
        (status, prevStatus) => {
            onChange({ status }, { status: prevStatus });
        },
    );
};

export const subscribePlayerSeekToTimestamp = (
    onChange: (properties: { timestamp: number }, prev: { timestamp: number }) => void,
) => {
    return usePlayerStoreBase.subscribe(
        (state) => state.player.seekToTimestamp,
        (timestamp, prevTimestamp) => {
            onChange(
                { timestamp: parseUniqueSeekToTimestamp(timestamp) },
                { timestamp: parseUniqueSeekToTimestamp(prevTimestamp) },
            );
        },
    );
};

export const subscribePlayerMute = (
    onChange: (properties: { muted: boolean }, prev: { muted: boolean }) => void,
) => {
    return usePlayerStoreBase.subscribe(
        (state) => state.player.muted,
        (muted, prevMuted) => {
            onChange({ muted }, { muted: prevMuted });
        },
    );
};

export const subscribePlayerSpeed = (
    onChange: (properties: { speed: number }, prev: { speed: number }) => void,
) => {
    return usePlayerStoreBase.subscribe(
        (state) => state.player.speed,
        (speed, prevSpeed) => {
            onChange({ speed }, { speed: prevSpeed });
        },
    );
};

export const subscribePlayerRepeat = (
    onChange: (properties: { repeat: PlayerRepeat }, prev: { repeat: PlayerRepeat }) => void,
) => {
    return usePlayerStoreBase.subscribe(
        (state) => state.player.repeat,
        (repeat, prevRepeat) => {
            onChange({ repeat }, { repeat: prevRepeat });
        },
    );
};

export const subscribePlayerShuffle = (
    onChange: (properties: { shuffle: PlayerShuffle }, prev: { shuffle: PlayerShuffle }) => void,
) => {
    return usePlayerStoreBase.subscribe(
        (state) => state.player.shuffle,
        (shuffle, prevShuffle) => {
            onChange({ shuffle }, { shuffle: prevShuffle });
        },
    );
};

export const usePlayerProperties = () => {
    return usePlayerStoreBase(
        useShallow((state) => ({
            crossfadeDuration: state.player.crossfadeDuration,
            isMuted: state.player.muted,
            playerNum: state.player.playerNum,
            queueType: state.player.queueType,
            repeat: state.player.repeat,
            shuffle: state.player.shuffle,
            speed: state.player.speed,
            status: state.player.status,
            transitionType: state.player.transitionType,
            volume: state.player.volume,
        })),
    );
};

export const usePlayerProgress = () => {
    return usePlayerStoreBase((state) => state.player.timestamp);
};

export const usePlayerDuration = () => {
    return usePlayerStoreBase((state) => {
        const queue = state.getQueue();
        const index = state.player.index;
        const currentTrack = queue.items[index];
        return currentTrack?.duration;
    });
};

export const usePlayerData = (): PlayerData => {
    return usePlayerStoreBase(
        useShallow((state) => {
            const queue = state.getQueue();
            const index = state.player.index;
            const currentSong = queue.items[index];
            const nextSong = queue.items[index + 1];
            const previousSong = queue.items[index - 1];

            return {
                currentSong,
                index,
                muted: state.player.muted,
                nextSong,
                num: state.player.playerNum,
                player1: state.player.playerNum === 1 ? currentSong : nextSong,
                player2: state.player.playerNum === 2 ? currentSong : nextSong,
                previousSong,
                queue: state.queue,
                queueLength: state.queue.default.length + state.queue.priority.length,
                repeat: state.player.repeat,
                shuffle: state.player.shuffle,
                speed: state.player.speed,
                status: state.player.status,
                transitionType: state.player.transitionType,
                volume: state.player.volume,
            };
        }),
    );
};

export const updateQueueFavorites = (ids: string[], favorite: boolean) => {
    usePlayerStoreBase.setState((state) => {
        // Update songs in the songs object
        Object.values(state.queue.songs).forEach((song) => {
            if (ids.includes(song.id)) {
                song.userFavorite = favorite;
            }
        });
    });
};

export const usePlayerMuted = () => {
    return usePlayerStoreBase((state) => state.player.muted);
};

export const usePlayerQueueType = () => {
    return usePlayerStoreBase((state) => state.player.queueType);
};

export const usePlayerRepeat = () => {
    return usePlayerStoreBase((state) => state.player.repeat);
};

export const usePlayerShuffle = () => {
    return usePlayerStoreBase((state) => state.player.shuffle);
};

export const usePlayerStatus = () => {
    return usePlayerStoreBase((state) => state.player.status);
};

export const usePlayerVolume = () => {
    return usePlayerStoreBase((state) => state.player.volume);
};

export const usePlayerSpeed = () => {
    return usePlayerStoreBase((state) => state.player.speed);
};

export const usePlayerTimestamp = () => {
    return usePlayerStoreBase((state) => state.player.timestamp);
};

export const usePlayerSong = () => {
    return usePlayerStoreBase((state) => {
        const queue = state.getQueue();
        const index = state.player.index;
        return queue.items[index];
    });
};

export const usePlayerNum = () => {
    return usePlayerStoreBase((state) => state.player.playerNum);
};

export const usePlayerQueue = () => {
    return usePlayerStoreBase(
        useShallow((state) => {
            const queueType = state.player.queueType;

            switch (queueType) {
                case PlayerQueueType.DEFAULT: {
                    const queue = state.queue.default;
                    return queue.map((id) => state.queue.songs[id]);
                }
                case PlayerQueueType.PRIORITY: {
                    const priorityQueue = state.queue.priority;
                    return priorityQueue.map((id) => state.queue.songs[id]);
                }
                default: {
                    const defaultQueue = state.queue.default;
                    return defaultQueue.map((id) => state.queue.songs[id]);
                }
            }
        }),
    );
};

function getQueueType() {
    const queueType: PlayerQueueType = usePlayerStore.getState().player.queueType;
    return queueType;
}

function parseUniqueSeekToTimestamp(timestamp: string) {
    return Number(timestamp.split('-')[0]);
}

function recalculatePlayerIndex(state: any, queue: string[]) {
    const currentTrack = state.getCurrentSong() as QueueSong | undefined;

    if (!currentTrack) {
        return;
    }

    const index = queue.findIndex((id) => id === currentTrack._uniqueId);
    state.player.index = Math.max(0, index);
}

function toQueueSong(item: Song): QueueSong {
    return {
        ...item,
        _uniqueId: nanoid(),
    };
}

// We need to use a unique id so that the equalityFn can work if attempting to set the same timestamp
function uniqueSeekToTimestamp(timestamp: number) {
    return `${timestamp}-${nanoid()}`;
}
