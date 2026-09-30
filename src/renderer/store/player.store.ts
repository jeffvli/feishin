import merge from 'lodash/merge';
import { nanoid } from 'nanoid';
import { useMemo } from 'react';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import { eventEmitter } from '/@/renderer/events/event-emitter';
import { useRadioStore as useRadioPlayerStore } from '/@/renderer/features/radio/hooks/use-radio-player';
import { createSelectors } from '/@/renderer/lib/zustand';
import { insertQueueIdsAtTarget } from '/@/renderer/store/player-queue-insertion';
import { removeQueueIds, shouldRefillQueue } from '/@/renderer/store/player-queue-repeat';
import { useSettingsStore } from '/@/renderer/store/settings.store';
import {
    setTimestamp as setTimestampStore,
    useTimestampStoreBase,
} from '/@/renderer/store/timestamp.store';
import { migratePlayerStorePersist, playerStoreStorage } from '/@/renderer/store/utils';
import { shuffleInPlace } from '/@/renderer/utils/shuffle';
import {
    LibraryItem,
    PlayerData,
    QueueData,
    QueueSong,
    QueueSource,
    Song,
} from '/@/shared/types/domain-types';
import {
    CrossfadeStyle,
    Play,
    PlayerRepeat,
    PlayerShuffle,
    PlayerStatus,
    PlayerStyle,
} from '/@/shared/types/types';

export interface PlayerState extends Actions, State {}

export type QueueGroupingProperty = keyof QueueSong;

interface Actions {
    addToQueueByType: (items: Song[], playType: Play, playSongId?: string) => void;
    addToQueueByUniqueId: (
        items: Song[],
        uniqueId: string,
        edge: 'bottom' | 'top',
        playSongId?: string,
    ) => void;
    clearQueue: () => void;
    clearSelected: (items: QueueSong[]) => void;
    decreaseVolume: (value: number) => void;
    getCurrentSong: () => QueueSong | undefined;
    getPlaybackQueue: () => GroupedQueue;
    getPlayerData: () => PlayerData;
    getQueue: (groupBy?: QueueGroupingProperty) => GroupedQueue;
    getQueueOrder: () => GroupedQueue;
    increaseVolume: (value: number) => void;
    isFirstTrackInQueue: () => boolean;
    isLastTrackInQueue: () => boolean;
    mediaAutoNext: () => PlayerData;
    mediaNext: (toNextAlbum: boolean) => void;
    mediaPause: () => void;
    mediaPlay: (id?: string, options?: { consumePrevious?: boolean }) => void;
    mediaPlayByIndex: (index: number) => void;
    mediaPrevious: (toPreviousAlbum: boolean) => void;
    mediaSeekToTimestamp: (timestamp: number) => void;
    mediaSkipBackward: (offset?: number) => void;
    mediaSkipForward: (offset?: number) => void;
    mediaStop: (options?: { reset?: boolean }) => void;
    mediaToggleMute: () => void;
    mediaTogglePlayPause: () => void;
    moveSelectedTo: (items: QueueSong[], uniqueId: string, edge: 'bottom' | 'top') => void;
    moveSelectedToBottom: (items: QueueSong[]) => void;
    moveSelectedToNext: (items: QueueSong[]) => void;
    moveSelectedToTop: (items: QueueSong[]) => void;
    prepareQueueRefill: () => void;
    refreshQueueSource: (items: Song[]) => void;
    setCrossfadeDuration: (duration: number) => void;
    setCrossfadeStyle: (style: CrossfadeStyle) => void;
    setPauseOnNextSongEnd: (value: boolean) => void;
    setQueue: (data: Song[], index?: number, position?: number) => void;
    setRepeat: (repeat: PlayerRepeat) => void;
    setShuffle: (shuffle: PlayerShuffle) => void;
    setSpeed: (speed: number) => void;
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

interface PlaybackQueueState {
    player: {
        index: number;
        shuffle: PlayerShuffle;
    };
    queue: {
        default: string[];
        shuffled: number[];
    };
}

interface QueueConsumptionResult {
    currentIndex: number;
    nextIndex: number;
    shouldStop: boolean;
}

interface State {
    hydrated: boolean;
    // Runtime-only: true once the mpv engine has finished initializing.
    // Top-level keys are not persisted (see partialize), same as `hydrated`.
    mpvInitialized: boolean;
    player: {
        crossfadeDuration: number;
        crossfadeStyle: CrossfadeStyle;
        index: number;
        muted: boolean;
        pauseOnNextSongEnd: boolean;
        playerNum: 1 | 2;
        repeat: PlayerRepeat;
        seekToTimestamp: string;
        shuffle: PlayerShuffle;
        speed: number;
        status: PlayerStatus;
        transitionType: PlayerStyle;
        volume: number;
    };
    queue: QueueData;
}

// Calculates the next song based on repeat mode and current position
export function calculateNextSong(
    currentIndex: number,
    queueItems: QueueSong[],
    repeat: PlayerRepeat,
): QueueSong | undefined {
    if (queueItems.length === 0) {
        return undefined;
    }

    if (repeat === PlayerRepeat.ONE) {
        // When repeating one, next song is the same as current
        return queueItems[currentIndex];
    } else if (repeat === PlayerRepeat.ALL) {
        // When repeating all, next song wraps to first if at the end
        const isLastTrack = currentIndex === queueItems.length - 1;
        if (isLastTrack) {
            return queueItems[0];
        } else {
            return queueItems[currentIndex + 1];
        }
    } else {
        // When repeat is none, next song is undefined if at the end
        return queueItems[currentIndex + 1];
    }
}

export function getDualPlayerSongs(
    playerNum: 1 | 2,
    currentSong: QueueSong | undefined,
    nextSong: QueueSong | undefined,
    repeat: PlayerRepeat,
): { player1: QueueSong | undefined; player2: QueueSong | undefined } {
    if (repeat === PlayerRepeat.ONE) {
        return {
            player1: playerNum === 1 ? currentSong : undefined,
            player2: playerNum === 2 ? currentSong : undefined,
        };
    }

    return {
        player1: playerNum === 1 ? currentSong : nextSong,
        player2: playerNum === 2 ? currentSong : nextSong,
    };
}

// Helper function to check if shuffle is enabled
export function isShuffleEnabled(state: {
    player: { shuffle: PlayerShuffle };
    queue: { shuffled: number[] };
}): boolean {
    return state.player.shuffle === PlayerShuffle.TRACK && state.queue.shuffled.length > 0;
}

// Helper function to map shuffled position to actual queue position
export function mapShuffledToQueueIndex(shuffledIndex: number, shuffled: number[]): number {
    if (shuffledIndex >= 0 && shuffledIndex < shuffled.length) {
        return shuffled[shuffledIndex];
    }
    return shuffledIndex;
}

// We need to use a unique id so that the equalityFn can work if attempting to set the same timestamp
export function uniqueSeekToTimestamp(timestamp: number) {
    return `${timestamp}-${nanoid()}`;
}

// Helper function to adjust shuffled indexes when items are inserted
function adjustShuffledIndexesForInsertion(
    shuffled: number[],
    insertPosition: number,
    insertCount: number,
): number[] {
    return shuffled.map((idx) => {
        if (idx >= insertPosition) {
            return idx + insertCount;
        }
        return idx;
    });
}

// Calculates the next index based on repeat mode and current position
function calculateNextIndex(
    currentIndex: number,
    queueLength: number,
    repeat: PlayerRepeat,
): { nextIndex: number; shouldStop: boolean } {
    const isLastTrack = currentIndex === queueLength - 1;

    if (repeat === PlayerRepeat.ONE) {
        // Repeat one: stay on the same track
        return { nextIndex: currentIndex, shouldStop: false };
    } else if (repeat === PlayerRepeat.ALL) {
        // Repeat all: loop to first track if at the end
        if (isLastTrack) {
            return { nextIndex: 0, shouldStop: false };
        } else {
            return { nextIndex: currentIndex + 1, shouldStop: false };
        }
    } else {
        // Repeat none: move to next track, or loop back and stop if at the end
        if (isLastTrack) {
            return { nextIndex: 0, shouldStop: true };
        } else {
            return { nextIndex: currentIndex + 1, shouldStop: false };
        }
    }
}

function clearActiveRadio(): void {
    const radioState = useRadioPlayerStore.getState();
    if (radioState.currentStreamUrl) {
        radioState.actions.clear();
    }
}

function emitPlayerPlayEvent(
    targetSongUniqueId: string | undefined,
    set: (fn: (state: PlayerState) => void) => void,
    get: () => PlayerState,
): void {
    // Clear radio before status changes so onPlayerStatus does not restart the stream.
    clearActiveRadio();

    // If playSongId is provided, find the song and start playback on it
    if (targetSongUniqueId) {
        let playIndex: number | undefined;
        set((state) => {
            const queue = state.getQueue();
            const queueIndex = queue.items.findIndex(
                (item) => item._uniqueId === targetSongUniqueId,
            );

            if (queueIndex !== -1) {
                if (
                    state.player.shuffle === PlayerShuffle.TRACK &&
                    state.queue.shuffled.length > 0
                ) {
                    // Find the shuffled position for this queue index
                    const shuffledPosition = state.queue.shuffled.findIndex(
                        (idx) => idx === queueIndex,
                    );
                    if (shuffledPosition !== -1) {
                        state.player.index = shuffledPosition;
                        playIndex = shuffledPosition;
                    } else {
                        state.player.index = queueIndex;
                        playIndex = queueIndex;
                    }
                } else {
                    state.player.index = queueIndex;
                    playIndex = queueIndex;
                }
                state.player.status = PlayerStatus.PLAYING;
                setTimestampStore(0);
            }
        });

        // Emit PLAYER_PLAY event if playback was started
        if (playIndex !== undefined) {
            eventEmitter.emit('PLAYER_PLAY', {
                id: targetSongUniqueId,
                index: playIndex,
            });
        }
    } else {
        // Otherwise, emit PLAYER_PLAY event for current song if available
        const currentState = get();
        const queue = currentState.getQueue();
        const currentIndex = currentState.player.index;
        const currentSong = queue.items[currentIndex];

        if (currentSong && currentIndex !== undefined && currentIndex >= 0) {
            eventEmitter.emit('PLAYER_PLAY', {
                id: currentSong._uniqueId,
                index: currentIndex,
            });
        }
    }
}

function emitPlayerStop(get: () => PlayerState, reset: boolean): void {
    const currentState = get();
    const queue = currentState.getQueue();
    const currentIndex = currentState.player.index;
    const currentSong = queue.items[currentIndex];

    eventEmitter.emit('PLAYER_STOP', {
        id: currentSong?._uniqueId,
        index: currentIndex !== undefined && currentIndex >= 0 ? currentIndex : undefined,
        reset,
    });
}

// Helper function to find shuffled position for a given queue index
function findShuffledPositionForQueueIndex(
    queueIndex: number,
    shuffled: number[],
): number | undefined {
    const shuffledPosition = shuffled.findIndex((idx) => idx === queueIndex);
    return shuffledPosition !== -1 ? shuffledPosition : undefined;
}

// Helper function to generate shuffled indexes for a queue of given length
function generateShuffledIndexes(length: number): number[] {
    const indexes = Array.from({ length }, (_, i) => i);
    return shuffleInPlace(indexes);
}

const initialState: State = {
    hydrated: false,
    mpvInitialized: false,
    player: {
        crossfadeDuration: 5,
        crossfadeStyle: CrossfadeStyle.EQUAL_POWER,
        index: -1,
        muted: false,
        pauseOnNextSongEnd: false,
        playerNum: 1,
        repeat: PlayerRepeat.NONE,
        seekToTimestamp: uniqueSeekToTimestamp(0),
        shuffle: PlayerShuffle.NONE,
        speed: 1,
        status: PlayerStatus.PAUSED,
        transitionType: PlayerStyle.CROSSFADE,
        volume: 30,
    },
    queue: {
        consumed: [],
        default: [],
        preparedRefillBoundary: null,
        preparedRefillIds: [],
        recentlyPlayed: [],
        shuffled: [],
        songs: {},
        source: null,
    },
};

export const usePlayerStoreBase = createWithEqualityFn<PlayerState>()(
    persist(
        subscribeWithSelector(
            immer((set, get) => ({
                addToQueueByType: (items, playType, playSongId) => {
                    const newItems = items.map(toQueueSong);
                    const newUniqueIds = newItems.map((item) => item._uniqueId);

                    // Find the target song's uniqueId if playSongId is provided
                    const targetSongUniqueId = playSongId
                        ? newItems.find((item) => item.id === playSongId)?._uniqueId
                        : undefined;

                    switch (playType) {
                        case Play.LAST: {
                            set((state) => {
                                newItems.forEach((item) => {
                                    state.queue.songs[item._uniqueId] = item;
                                });

                                const oldQueueLength = state.queue.default.length;
                                state.queue.default = [...state.queue.default, ...newUniqueIds];

                                if (isShuffleEnabled(state)) {
                                    // New items will be at indexes starting from oldQueueLength
                                    const newIndexes = Array.from(
                                        { length: newUniqueIds.length },
                                        (_, i) => oldQueueLength + i,
                                    );
                                    // Shuffle the new indexes and add to the end of shuffled array
                                    const shuffledNewIndexes = shuffleInPlace([...newIndexes]);
                                    state.queue.shuffled = [
                                        ...state.queue.shuffled,
                                        ...shuffledNewIndexes,
                                    ];
                                }
                            });
                            break;
                        }
                        case Play.LAST_SHUFFLE: {
                            set((state) => {
                                newItems.forEach((item) => {
                                    state.queue.songs[item._uniqueId] = item;
                                });

                                // Shuffle the new items before appending
                                const shuffledIds = shuffleInPlace([...newUniqueIds]);

                                const oldQueueLength = state.queue.default.length;
                                state.queue.default = [...state.queue.default, ...shuffledIds];

                                if (state.player.shuffle === PlayerShuffle.TRACK) {
                                    // New items will be at indexes starting from oldQueueLength
                                    const newIndexes = Array.from(
                                        { length: shuffledIds.length },
                                        (_, i) => oldQueueLength + i,
                                    );
                                    // Shuffle the new indexes and add to the end of shuffled array
                                    const shuffledNewIndexes = shuffleInPlace([...newIndexes]);
                                    state.queue.shuffled = [
                                        ...state.queue.shuffled,
                                        ...shuffledNewIndexes,
                                    ];
                                }
                            });
                            break;
                        }
                        case Play.NEXT: {
                            set((state) => {
                                const currentShuffledIndex = state.player.index;
                                newItems.forEach((item) => {
                                    state.queue.songs[item._uniqueId] = item;
                                });

                                const insertPosition =
                                    state.player.shuffle === PlayerShuffle.TRACK
                                        ? state.queue.shuffled[currentShuffledIndex] + 1
                                        : currentShuffledIndex + 1;

                                state.queue.default = [
                                    ...state.queue.default.slice(0, insertPosition),
                                    ...newUniqueIds,
                                    ...state.queue.default.slice(insertPosition),
                                ];

                                if (isShuffleEnabled(state)) {
                                    // Adjust existing indexes that are >= insertPosition
                                    const adjustedShuffled = adjustShuffledIndexesForInsertion(
                                        state.queue.shuffled,
                                        insertPosition,
                                        newUniqueIds.length,
                                    );

                                    // New items will be at indexes starting from insertPosition
                                    const newIndexes = Array.from(
                                        { length: newUniqueIds.length },
                                        (_, i) => insertPosition + i,
                                    );

                                    // Shuffle the new indexes and add directly after current shuffled index
                                    const shuffledNewIndexes = shuffleInPlace([...newIndexes]);
                                    state.queue.shuffled = [
                                        ...adjustedShuffled.slice(0, currentShuffledIndex + 1),
                                        ...shuffledNewIndexes,
                                        ...adjustedShuffled.slice(currentShuffledIndex + 1),
                                    ];
                                }
                            });
                            break;
                        }
                        case Play.NEXT_SHUFFLE: {
                            set((state) => {
                                const currentShuffledIndex = state.player.index;
                                newItems.forEach((item) => {
                                    state.queue.songs[item._uniqueId] = item;
                                });

                                // Shuffle the new items before inserting
                                const shuffledIds = shuffleInPlace([...newUniqueIds]);

                                const insertPosition = isShuffleEnabled(state)
                                    ? state.queue.shuffled[currentShuffledIndex] + 1
                                    : currentShuffledIndex + 1;

                                state.queue.default = [
                                    ...state.queue.default.slice(0, insertPosition),
                                    ...shuffledIds,
                                    ...state.queue.default.slice(insertPosition),
                                ];

                                if (isShuffleEnabled(state)) {
                                    // Adjust existing indexes that are >= insertPosition
                                    const adjustedShuffled = adjustShuffledIndexesForInsertion(
                                        state.queue.shuffled,
                                        insertPosition,
                                        shuffledIds.length,
                                    );

                                    // New items will be at indexes starting from insertPosition
                                    const newIndexes = Array.from(
                                        { length: shuffledIds.length },
                                        (_, i) => insertPosition + i,
                                    );

                                    // Shuffle the new indexes and add directly after current shuffled index
                                    const shuffledNewIndexes = shuffleInPlace([...newIndexes]);
                                    state.queue.shuffled = [
                                        ...adjustedShuffled.slice(0, currentShuffledIndex + 1),
                                        ...shuffledNewIndexes,
                                        ...adjustedShuffled.slice(currentShuffledIndex + 1),
                                    ];
                                }
                            });
                            break;
                        }
                        case Play.NOW: {
                            clearActiveRadio();

                            set((state) => {
                                newItems.forEach((item) => {
                                    state.queue.songs[item._uniqueId] = item;
                                });

                                state.queue.default = [];
                                state.player.index = 0;
                                state.player.status = PlayerStatus.PLAYING;
                                state.player.playerNum = 1;
                                setTimestampStore(0);
                                state.queue.default = newUniqueIds;
                                resetQueueCycle(state, newItems, newUniqueIds);
                                cleanupOrphanedSongs(state);

                                if (state.player.shuffle === PlayerShuffle.TRACK) {
                                    // If targetSongUniqueId is provided, ensure it's at position 0 in shuffled array
                                    if (targetSongUniqueId) {
                                        const initialIndex = newUniqueIds.findIndex(
                                            (id) => id === targetSongUniqueId,
                                        );
                                        if (initialIndex !== -1) {
                                            const allIndexes = Array.from(
                                                { length: newUniqueIds.length },
                                                (_, i) => i,
                                            );

                                            const remainingIndexes = allIndexes.filter(
                                                (idx) => idx !== initialIndex,
                                            );

                                            const shuffledRemaining = shuffleInPlace([
                                                ...remainingIndexes,
                                            ]);

                                            state.queue.shuffled = [
                                                initialIndex,
                                                ...shuffledRemaining,
                                            ];
                                        } else {
                                            // Fallback: if initial song not found, generate normally
                                            state.queue.shuffled = generateShuffledIndexes(
                                                newUniqueIds.length,
                                            );
                                        }
                                    } else {
                                        state.queue.shuffled = generateShuffledIndexes(
                                            newUniqueIds.length,
                                        );
                                    }
                                }
                            });

                            emitPlayerPlayEvent(targetSongUniqueId, set, get);
                            break;
                        }
                        case Play.SHUFFLE: {
                            clearActiveRadio();

                            set((state) => {
                                newItems.forEach((item) => {
                                    state.queue.songs[item._uniqueId] = item;
                                });

                                // Shuffle the new items before adding to queue
                                const shuffledIds = shuffleInPlace([...newUniqueIds]);

                                state.queue.default = [];
                                state.player.index = 0;
                                state.player.status = PlayerStatus.PLAYING;
                                state.player.playerNum = 1;
                                setTimestampStore(0);
                                state.queue.default = shuffledIds;
                                resetQueueCycle(state, newItems, newUniqueIds);
                                cleanupOrphanedSongs(state);

                                // Always maintain shuffled array when using Play.SHUFFLE
                                state.queue.shuffled = generateShuffledIndexes(shuffledIds.length);
                            });

                            emitPlayerPlayEvent(targetSongUniqueId, set, get);
                            break;
                        }
                    }
                },
                addToQueueByUniqueId: (items, uniqueId, edge, playSongId) => {
                    const newItems = items.map(toQueueSong);
                    const newUniqueIds = newItems.map((item) => item._uniqueId);

                    // Find the target song's uniqueId if playSongId is provided
                    const targetSongUniqueId = playSongId
                        ? newItems.find((item) => item.id === playSongId)?._uniqueId
                        : undefined;

                    set((state) => {
                        const currentTrackUniqueId = state.getCurrentSong()?._uniqueId;
                        const playbackIds = getPlaybackQueueIds(state);
                        const newPlaybackIds = insertQueueIdsAtTarget(
                            playbackIds,
                            newUniqueIds,
                            uniqueId,
                            edge,
                        );

                        if (newPlaybackIds === playbackIds) {
                            return;
                        }

                        // Add new songs to songs object
                        newItems.forEach((item) => {
                            state.queue.songs[item._uniqueId] = item;
                        });

                        appendMissingQueueIds(state, newUniqueIds);
                        applyPlaybackQueueOrder(state, newPlaybackIds, currentTrackUniqueId);
                    });

                    // If playSongId is provided, find the song and start playback on it
                    if (targetSongUniqueId) {
                        clearActiveRadio();

                        let playIndex: number | undefined;
                        set((state) => {
                            const queue = state.getQueue();
                            const queueIndex = queue.items.findIndex(
                                (item) => item._uniqueId === targetSongUniqueId,
                            );

                            if (queueIndex !== -1) {
                                if (
                                    state.player.shuffle === PlayerShuffle.TRACK &&
                                    state.queue.shuffled.length > 0
                                ) {
                                    // Find the shuffled position for this queue index
                                    const shuffledPosition = state.queue.shuffled.findIndex(
                                        (idx) => idx === queueIndex,
                                    );
                                    if (shuffledPosition !== -1) {
                                        state.player.index = shuffledPosition;
                                        playIndex = shuffledPosition;
                                    } else {
                                        state.player.index = queueIndex;
                                        playIndex = queueIndex;
                                    }
                                } else {
                                    state.player.index = queueIndex;
                                    playIndex = queueIndex;
                                }
                                state.player.status = PlayerStatus.PLAYING;
                                setTimestampStore(0);
                            }
                        });

                        // Emit PLAYER_PLAY event if playback was started
                        if (playIndex !== undefined) {
                            eventEmitter.emit('PLAYER_PLAY', {
                                id: targetSongUniqueId,
                                index: playIndex,
                            });
                        }
                    }
                },
                clearQueue: () => {
                    set((state) => {
                        state.player.index = -1;
                        state.queue.consumed = [];
                        state.queue.default = [];
                        state.queue.preparedRefillBoundary = null;
                        state.queue.preparedRefillIds = [];
                        state.queue.recentlyPlayed = [];
                        state.queue.shuffled = [];
                        state.queue.songs = {};
                        state.queue.source = null;
                    });
                },
                clearSelected: (items: QueueSong[]) => {
                    set((state) => {
                        const currentTrackUniqueId = state.getCurrentSong()?._uniqueId;
                        const uniqueIds = new Set(items.map((item) => item._uniqueId));

                        const indexesToRemove = new Set<number>();

                        state.queue.default.forEach((id, index) => {
                            if (uniqueIds.has(id)) {
                                indexesToRemove.add(index);
                            }
                        });

                        state.queue.default = state.queue.default.filter(
                            (id) => !uniqueIds.has(id),
                        );

                        if (state.queue.source) {
                            state.queue.source.trackIds = state.queue.source.trackIds.filter(
                                (id) => !uniqueIds.has(id),
                            );
                            if (state.queue.source.trackIds.length === 0) {
                                state.queue.source = null;
                            }
                        }

                        if (isShuffleEnabled(state)) {
                            // Remove indexes from shuffled array and adjust remaining indexes
                            const newShuffled = state.queue.shuffled
                                .filter((idx) => !indexesToRemove.has(idx))
                                .map((idx) => {
                                    // Count how many removed indexes are before this index
                                    let adjustment = 0;
                                    for (const removedIdx of indexesToRemove) {
                                        if (removedIdx < idx) {
                                            adjustment++;
                                        }
                                    }
                                    return idx - adjustment;
                                });
                            state.queue.shuffled = newShuffled;
                        } else {
                            state.queue.shuffled = [];
                        }

                        cleanupOrphanedSongs(state);

                        const playbackIds = getPlaybackQueueIds(state);
                        if (currentTrackUniqueId && playbackIds.includes(currentTrackUniqueId)) {
                            applyPlaybackQueueOrder(state, playbackIds, currentTrackUniqueId);
                        } else {
                            state.player.index =
                                playbackIds.length === 0
                                    ? -1
                                    : Math.min(state.player.index, playbackIds.length - 1);
                        }
                    });
                },
                decreaseVolume: (value: number) => {
                    set((state) => {
                        state.player.volume = Math.max(0, state.player.volume - value);
                    });
                },
                getCurrentSong: () => {
                    const state = get();
                    const queue = state.getQueue();
                    let index = state.player.index;

                    // If shuffle is enabled, map shuffled position to actual queue position
                    if (isShuffleEnabled(state)) {
                        index = mapShuffledToQueueIndex(index, state.queue.shuffled);
                    }

                    return queue.items[index];
                },
                getPlaybackQueue: () => {
                    const state = get();
                    const queue = state.getQueueOrder();

                    if (!isShuffleEnabled(state)) {
                        return queue;
                    }

                    const items = state.queue.shuffled
                        .map((queueIndex) => queue.items[queueIndex])
                        .filter((item): item is QueueSong => item !== undefined);

                    return {
                        groups: [{ count: items.length, name: 'All' }],
                        items,
                    };
                },
                getPlayerData: () => {
                    const state = get();
                    const queue = state.getQueue();
                    const index = state.player.index;

                    // If shuffle is enabled, map shuffled position to actual queue position for display
                    let queueIndex = index;
                    if (isShuffleEnabled(state)) {
                        queueIndex = mapShuffledToQueueIndex(index, state.queue.shuffled);
                    }

                    const currentSong = queue.items[queueIndex];
                    const repeat = state.player.repeat;

                    // For previousSong calculation, we need to consider the shuffled order
                    let previousSong: QueueSong | undefined;
                    if (isShuffleEnabled(state)) {
                        // Calculate previous in shuffled order
                        const previousShuffledIndex = index - 1;
                        if (previousShuffledIndex >= 0) {
                            const previousQueueIndex = state.queue.shuffled[previousShuffledIndex];
                            previousSong = queue.items[previousQueueIndex];
                        } else if (repeat === PlayerRepeat.ALL) {
                            // Wrap to last in shuffled order
                            const lastShuffledIndex = state.queue.shuffled.length - 1;
                            const lastQueueIndex = state.queue.shuffled[lastShuffledIndex];
                            previousSong = queue.items[lastQueueIndex];
                        }
                    } else {
                        previousSong = queueIndex > 0 ? queue.items[queueIndex - 1] : undefined;
                    }

                    // For nextSong calculation, we need to consider the shuffled order
                    let nextSong: QueueSong | undefined;
                    if (isShuffleEnabled(state) && repeat !== PlayerRepeat.ONE) {
                        // Calculate next in shuffled order
                        const nextShuffledIndex = index + 1;
                        if (nextShuffledIndex < state.queue.shuffled.length) {
                            const nextQueueIndex = state.queue.shuffled[nextShuffledIndex];
                            nextSong = queue.items[nextQueueIndex];
                        } else if (repeat === PlayerRepeat.ALL) {
                            // Wrap to first in shuffled order
                            const firstQueueIndex = state.queue.shuffled[0];
                            nextSong = queue.items[firstQueueIndex];
                        }
                    } else {
                        nextSong = calculateNextSong(queueIndex, queue.items, repeat);
                    }

                    const { player1, player2 } = getDualPlayerSongs(
                        state.player.playerNum,
                        currentSong,
                        nextSong,
                        repeat,
                    );

                    return {
                        currentSong,
                        index: queueIndex, // Return the actual queue position for display
                        nextSong,
                        num: state.player.playerNum,
                        player1,
                        player2,
                        previousSong,
                        queueLength: state.queue.default.length,
                        status: state.player.status,
                    };
                },
                getQueue: (groupBy?: QueueGroupingProperty) => {
                    const queue = get().getQueueOrder();

                    if (!groupBy) {
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
                    const state = get();
                    const songs = state.queue.songs;
                    const defaultIds = state.queue.default;
                    const defaultQueue: QueueSong[] = [];

                    for (const id of defaultIds) {
                        const song = songs[id];
                        if (song) defaultQueue.push(song);
                    }

                    // Always return original order (shuffle only affects playback, not display)
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
                isFirstTrackInQueue: () => {
                    const state = get();
                    const currentIndex = state.player.index;
                    return currentIndex === 0;
                },
                isLastTrackInQueue: () => {
                    const state = get();
                    const queue = state.getQueueOrder();
                    const currentIndex = state.player.index;
                    return currentIndex === queue.items.length - 1;
                },
                mediaAutoNext: () => {
                    const stateSnapshot = get();
                    const currentIndex = stateSnapshot.player.index;
                    const player = stateSnapshot.player;
                    const repeat = player.repeat;
                    const queue = stateSnapshot.getQueueOrder();
                    const isShuffle = isShuffleEnabled(stateSnapshot);

                    if (
                        useSettingsStore.getState().playback.consumeQueue &&
                        repeat !== PlayerRepeat.ONE
                    ) {
                        let consumptionResult: QueueConsumptionResult = {
                            currentIndex,
                            nextIndex: -1,
                            shouldStop: true,
                        };
                        const pauseOnNext = player.pauseOnNextSongEnd;

                        set((state) => {
                            consumptionResult = consumeCurrentQueueSong(state);
                            const newStatus = consumptionResult.shouldStop
                                ? PlayerStatus.STOPPED
                                : pauseOnNext
                                  ? PlayerStatus.PAUSED
                                  : PlayerStatus.PLAYING;

                            state.player.playerNum =
                                newStatus === PlayerStatus.PLAYING
                                    ? player.playerNum === 1
                                        ? 2
                                        : 1
                                    : player.playerNum;
                            state.player.status = newStatus;
                            setTimestampStore(0);

                            if (consumptionResult.shouldStop) {
                                state.player.seekToTimestamp = uniqueSeekToTimestamp(0);
                            }

                            if (pauseOnNext) {
                                state.player.pauseOnNextSongEnd = false;
                            }
                        });

                        if (consumptionResult.shouldStop) {
                            emitPlayerStop(get, true);
                        }

                        return get().getPlayerData();
                    }

                    const playbackLength = isShuffle
                        ? stateSnapshot.queue.shuffled.length
                        : queue.items.length;

                    const { nextIndex: nextPlaybackIndex, shouldStop } = calculateNextIndex(
                        currentIndex,
                        playbackLength,
                        repeat,
                    );

                    const isRepeatOneSameTrack =
                        repeat === PlayerRepeat.ONE && nextPlaybackIndex === currentIndex;
                    // Dual web players alternate for gapless/crossfade between tracks. Repeat-one
                    // replays the same track — keep playerNum so Chromium stays bound to the same
                    // <audio> element and hardware media keys keep working.
                    const newPlayerNum = isRepeatOneSameTrack
                        ? player.playerNum
                        : player.playerNum === 1
                          ? 2
                          : 1;
                    const pauseOnNext = player.pauseOnNextSongEnd;
                    const newStatus = shouldStop
                        ? PlayerStatus.STOPPED
                        : pauseOnNext
                          ? PlayerStatus.PAUSED
                          : PlayerStatus.PLAYING;
                    const shouldKeepCurrentPlayer = newStatus !== PlayerStatus.PLAYING;
                    const shouldSwapPlayer = !isRepeatOneSameTrack && !shouldKeepCurrentPlayer;

                    set((state) => {
                        state.player.index = nextPlaybackIndex;
                        state.player.playerNum = shouldSwapPlayer ? newPlayerNum : player.playerNum;
                        setTimestampStore(0);
                        state.player.status = newStatus;

                        if (shouldStop) {
                            state.player.seekToTimestamp = uniqueSeekToTimestamp(0);
                        }

                        if (pauseOnNext) {
                            state.player.pauseOnNextSongEnd = false;
                        }
                    });

                    if (shouldStop) {
                        emitPlayerStop(get, true);
                    }

                    if (repeat === PlayerRepeat.ONE && nextPlaybackIndex === currentIndex) {
                        eventEmitter.emit('PLAYER_REPEATED', {
                            index: nextPlaybackIndex,
                        });
                    }

                    // Compute current/next/previous using the same shuffle-aware mapping as getPlayerData().
                    let currentQueueIndex = nextPlaybackIndex;
                    if (isShuffle) {
                        currentQueueIndex = mapShuffledToQueueIndex(
                            nextPlaybackIndex,
                            stateSnapshot.queue.shuffled,
                        );
                    }

                    const currentSong = queue.items[currentQueueIndex];

                    let nextSong: QueueSong | undefined;
                    if (isShuffle && repeat !== PlayerRepeat.ONE) {
                        const nextShuffledIndex = nextPlaybackIndex + 1;
                        if (nextShuffledIndex < stateSnapshot.queue.shuffled.length) {
                            const nextQueueIndex = stateSnapshot.queue.shuffled[nextShuffledIndex];
                            nextSong = queue.items[nextQueueIndex];
                        } else if (repeat === PlayerRepeat.ALL) {
                            const firstQueueIndex = stateSnapshot.queue.shuffled[0];
                            nextSong = queue.items[firstQueueIndex];
                        }
                    } else {
                        nextSong = calculateNextSong(currentQueueIndex, queue.items, repeat);
                    }

                    let previousSong: QueueSong | undefined;
                    if (isShuffle) {
                        const prevShuffledIndex = nextPlaybackIndex - 1;
                        if (prevShuffledIndex >= 0) {
                            const prevQueueIndex = stateSnapshot.queue.shuffled[prevShuffledIndex];
                            previousSong = queue.items[prevQueueIndex];
                        } else if (repeat === PlayerRepeat.ALL) {
                            const lastShuffledIndex = stateSnapshot.queue.shuffled.length - 1;
                            const lastQueueIndex = stateSnapshot.queue.shuffled[lastShuffledIndex];
                            previousSong = queue.items[lastQueueIndex];
                        }
                    } else {
                        previousSong =
                            currentQueueIndex > 0 ? queue.items[currentQueueIndex - 1] : undefined;
                    }

                    const { player1, player2 } = getDualPlayerSongs(
                        shouldSwapPlayer ? newPlayerNum : player.playerNum,
                        currentSong,
                        nextSong,
                        repeat,
                    );

                    return {
                        currentSong,
                        index: currentQueueIndex,
                        nextSong,
                        num: shouldSwapPlayer ? newPlayerNum : player.playerNum,
                        player1,
                        player2,
                        previousSong,
                        queueLength: queue.items.length,
                        status: newStatus,
                    };
                },
                mediaNext: (toNextAlbum) => {
                    const state = get();
                    const currentIndex = state.player.index;
                    const player = state.player;
                    const repeat = player.repeat;
                    const isShuffle = isShuffleEnabled(state);
                    const queue = state.getQueueOrder();
                    const playbackLength = isShuffle
                        ? state.queue.shuffled.length
                        : queue.items.length;

                    const isStopped = state.player.status === PlayerStatus.STOPPED;

                    if (useSettingsStore.getState().playback.consumeQueue) {
                        const targetUniqueId = toNextAlbum
                            ? findNextAlbumUniqueId(state)
                            : undefined;
                        let consumptionResult: QueueConsumptionResult = {
                            currentIndex,
                            nextIndex: -1,
                            shouldStop: true,
                        };

                        set((draft) => {
                            consumptionResult = consumeCurrentQueueSong(draft, targetUniqueId);
                            draft.player.playerNum = 1;
                            draft.player.status = consumptionResult.shouldStop
                                ? PlayerStatus.STOPPED
                                : PlayerStatus.PLAYING;
                            setTimestampStore(0);

                            if (consumptionResult.shouldStop) {
                                draft.player.seekToTimestamp = uniqueSeekToTimestamp(0);
                            }
                        });

                        if (consumptionResult.shouldStop) {
                            emitPlayerStop(get, true);
                        } else {
                            eventEmitter.emit('MEDIA_NEXT', {
                                currentIndex: consumptionResult.currentIndex,
                                nextIndex: consumptionResult.nextIndex,
                            });
                        }
                        return;
                    }

                    if (repeat === PlayerRepeat.ONE) {
                        // Manual next while repeat-one is active should still advance in the queue.
                        const nextIndex = Math.min(playbackLength - 1, currentIndex + 1);

                        set((state) => {
                            state.player.index = nextIndex;
                            state.player.playerNum = 1;
                            setTimestampStore(0);

                            if (isStopped) {
                                state.player.status = PlayerStatus.PLAYING;
                            }
                        });

                        eventEmitter.emit('MEDIA_NEXT', {
                            currentIndex,
                            nextIndex,
                        });
                        return;
                    }

                    const nextIndexProps = calculateNextIndex(currentIndex, playbackLength, repeat);
                    let { nextIndex } = nextIndexProps;
                    const { shouldStop } = nextIndexProps;

                    if (toNextAlbum && !shouldStop) {
                        const currentItem = queue.items[currentIndex];
                        const [start, end] = findLastAlbumRange(queue.items);
                        const isOnLastAlbum = start <= currentIndex && currentIndex <= end;
                        if (isOnLastAlbum) {
                            const nextIndexWithNextAlbum = queue.items.findIndex(
                                (i) => i.albumId !== currentItem.albumId,
                            );

                            nextIndex = nextIndexWithNextAlbum;
                        } else {
                            const queueStartingFromCurrent = queue.items.slice(currentIndex);
                            const nextIndexWithNextAlbum = queueStartingFromCurrent.findIndex(
                                (i) => i.albumId !== currentItem.albumId,
                            );
                            nextIndex =
                                nextIndexWithNextAlbum +
                                (queue.items.length - queueStartingFromCurrent.length);
                        }
                    }

                    if (shouldStop) {
                        set((state) => {
                            state.player.index = nextIndex;
                            state.player.status = PlayerStatus.STOPPED;
                            state.player.playerNum = 1;
                            setTimestampStore(0);
                            state.player.seekToTimestamp = uniqueSeekToTimestamp(0);
                        });
                        emitPlayerStop(get, true);
                        return;
                    }

                    set((state) => {
                        state.player.index = nextIndex;
                        state.player.playerNum = 1;
                        setTimestampStore(0);

                        if (isStopped) {
                            state.player.status = PlayerStatus.PLAYING;
                        }
                    });

                    eventEmitter.emit('MEDIA_NEXT', {
                        currentIndex,
                        nextIndex,
                    });
                },
                mediaPause: () => {
                    set((state) => {
                        state.player.status = PlayerStatus.PAUSED;
                    });
                },
                mediaPlay: (id?: string, options?: { consumePrevious?: boolean }) => {
                    let playIndex: number | undefined;

                    // Playing a specific queue song should dismiss radio first.
                    if (id) {
                        clearActiveRadio();
                    }

                    set((state) => {
                        if (id) {
                            if (
                                options?.consumePrevious &&
                                useSettingsStore.getState().playback.consumeQueue
                            ) {
                                consumeQueueSongsBeforeTarget(state, id);
                            }

                            // Find the song in the remaining displayed queue. In consume mode,
                            // manually selecting a later song removes every song above it first.
                            const queueIndex = state.queue.default.indexOf(id);

                            if (queueIndex !== -1) {
                                if (
                                    state.player.shuffle === PlayerShuffle.TRACK &&
                                    state.queue.shuffled.length > 0
                                ) {
                                    // Find the shuffled position for this queue index
                                    const shuffledPosition = state.queue.shuffled.findIndex(
                                        (idx) => idx === queueIndex,
                                    );
                                    if (shuffledPosition !== -1) {
                                        state.player.index = shuffledPosition;
                                        playIndex = shuffledPosition;
                                    } else {
                                        state.player.index = queueIndex;
                                        playIndex = queueIndex;
                                    }
                                } else {
                                    state.player.index = queueIndex;
                                    playIndex = queueIndex;
                                }
                                setTimestampStore(0);
                            }
                        }

                        state.player.status = PlayerStatus.PLAYING;
                    });

                    if (id && playIndex !== undefined) {
                        eventEmitter.emit('PLAYER_PLAY', {
                            id,
                            index: playIndex,
                        });
                    }
                },
                mediaPlayByIndex: (index: number) => {
                    let playIndex: number | undefined;
                    let songId: string | undefined;

                    clearActiveRadio();

                    set((state) => {
                        if (index === -1 || index >= state.queue.default.length) {
                            state.player.status = PlayerStatus.PAUSED;
                            return;
                        }

                        const targetUniqueId = state.queue.default[index];
                        if (!targetUniqueId) {
                            state.player.status = PlayerStatus.PAUSED;
                            return;
                        }

                        songId = targetUniqueId;

                        const queueIndex = state.queue.default.indexOf(targetUniqueId);

                        if (isShuffleEnabled(state)) {
                            // Find the shuffled position for this queue index
                            const shuffledPosition = findShuffledPositionForQueueIndex(
                                queueIndex,
                                state.queue.shuffled,
                            );
                            playIndex =
                                shuffledPosition !== undefined ? shuffledPosition : queueIndex;
                            state.player.index = playIndex;
                        } else {
                            playIndex = queueIndex;
                            state.player.index = queueIndex;
                        }
                        setTimestampStore(0);

                        state.player.status = PlayerStatus.PLAYING;
                    });

                    if (songId && playIndex !== undefined) {
                        eventEmitter.emit('PLAYER_PLAY', {
                            id: songId,
                            index: playIndex,
                        });
                    }
                },
                mediaPrevious: (toPreviousAlbum) => {
                    const currentIndex = get().player.index;
                    const player = get().player;
                    const queue = get().getQueueOrder();
                    const currentTimestamp = useTimestampStoreBase.getState().timestamp;
                    const isFirstTrack = currentIndex === 0;

                    // If timestamp is greater than 10 seconds, restart current song
                    if (currentTimestamp > 10) {
                        set((state) => {
                            state.player.seekToTimestamp = uniqueSeekToTimestamp(0);
                        });
                        return;
                    }

                    let previousIndex: number;

                    if (player.repeat === PlayerRepeat.ALL && isFirstTrack) {
                        // Repeat all: wrap to last track when on first track
                        previousIndex = queue.items.length - 1;
                    } else if (player.repeat === PlayerRepeat.NONE && isFirstTrack) {
                        // Repeat none: stay on first track if already there
                        previousIndex = currentIndex;
                    } else if (toPreviousAlbum) {
                        previousIndex = Math.max(
                            0,
                            findIndexWithPreviousAlbum(queue.items, currentIndex),
                        );
                    } else {
                        // Otherwise, go to previous track
                        previousIndex = Math.max(0, currentIndex - 1);
                    }

                    // Same Chromium Media Session pitfall as mediaNext: a STOPPED→new-src
                    // transition without PLAYING drops OS media-key routing.
                    const resumeFromStopped = get().player.status === PlayerStatus.STOPPED;

                    set((state) => {
                        state.player.index = previousIndex;
                        state.player.playerNum = 1;
                        setTimestampStore(0);
                        if (resumeFromStopped) {
                            state.player.status = PlayerStatus.PLAYING;
                        }
                    });

                    eventEmitter.emit('MEDIA_PREV', {
                        currentIndex,
                        prevIndex: previousIndex,
                    });
                },
                mediaSeekToTimestamp: (timestamp: number) => {
                    // See mediaSkipBackward: update the timestamp store right away to
                    // avoid the stale-read left by the ~500ms engine poll.
                    setTimestampStore(timestamp);
                    set((state) => {
                        state.player.seekToTimestamp = uniqueSeekToTimestamp(timestamp);
                    });
                },
                mediaSkipBackward: (offset?: number) => {
                    const offsetFromSettings =
                        useSettingsStore.getState().general.skipButtons.skipBackwardSeconds;
                    const timeToSkip = offset ?? offsetFromSettings ?? 5;
                    const currentTimestamp = useTimestampStoreBase.getState().timestamp;
                    const newTimestamp = Math.max(0, currentTimestamp - timeToSkip);

                    // Update the timestamp store right away so the UI and any
                    // subsequent seek compute from the new position instead of the
                    // stale value left by the ~500ms engine poll (otherwise mashing
                    // the seek keys repeatedly lands on the same time).
                    setTimestampStore(newTimestamp);
                    set((state) => {
                        state.player.seekToTimestamp = uniqueSeekToTimestamp(newTimestamp);
                    });
                },
                mediaSkipForward: (offset?: number) => {
                    const state = get();
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

                    const currentTimestamp = useTimestampStoreBase.getState().timestamp;
                    const newTimestamp = Math.min(duration - 1, currentTimestamp + timeToSkip);

                    // See mediaSkipBackward: update the timestamp store right away to
                    // avoid the stale-read left by the ~500ms engine poll.
                    setTimestampStore(newTimestamp);
                    set((state) => {
                        state.player.seekToTimestamp = uniqueSeekToTimestamp(newTimestamp);
                    });
                },
                mediaStop: (options?: { reset?: boolean }) => {
                    const reset = options?.reset !== false;
                    set((state) => {
                        state.player.status = PlayerStatus.STOPPED;
                        if (reset) {
                            setTimestampStore(0);
                            state.player.seekToTimestamp = uniqueSeekToTimestamp(0);
                        }
                    });

                    emitPlayerStop(get, reset);
                },
                mediaToggleMute: () => {
                    set((state) => {
                        state.player.muted = !state.player.muted;
                    });
                },
                mediaTogglePlayPause: () => {
                    // Restarting from STOPPED (e.g. end of queue) needs a full play
                    // event so engines like mpv can reload the current track — play()
                    // alone is a no-op when mpv's playlist-pos is -1.
                    const wasStopped = get().player.status === PlayerStatus.STOPPED;

                    set((state) => {
                        if (state.player.status === PlayerStatus.PLAYING) {
                            state.player.status = PlayerStatus.PAUSED;
                        } else {
                            state.player.status = PlayerStatus.PLAYING;
                        }
                    });

                    if (wasStopped) {
                        emitPlayerPlayEvent(undefined, set, get);
                    }
                },
                moveSelectedTo: (items: QueueSong[], uniqueId: string, edge: 'bottom' | 'top') => {
                    set((state) => {
                        const currentTrackUniqueId = state.getCurrentSong()?._uniqueId;
                        const itemUniqueIds = items.map((item) => item._uniqueId);
                        const existingIds = new Set(Object.keys(state.queue.songs));

                        // Add new songs to songs object (avoiding duplicates)
                        items.forEach((item) => {
                            if (!existingIds.has(item._uniqueId)) {
                                state.queue.songs[item._uniqueId] = item;
                            }
                        });

                        appendMissingQueueIds(state, itemUniqueIds);

                        const playbackIds = getPlaybackQueueIds(state);
                        const movedIds = getMovedIdsInPlaybackOrder(playbackIds, itemUniqueIds);
                        const movedIdSet = new Set(movedIds);

                        if (movedIdSet.has(uniqueId)) {
                            return;
                        }

                        const remainingIds = playbackIds.filter((id) => !movedIdSet.has(id));
                        const targetIndex = remainingIds.findIndex((id) => id === uniqueId);

                        if (targetIndex === -1) {
                            return;
                        }

                        const insertIndex = edge === 'top' ? targetIndex : targetIndex + 1;
                        const newQueue = [
                            ...remainingIds.slice(0, insertIndex),
                            ...movedIds,
                            ...remainingIds.slice(insertIndex),
                        ];

                        applyPlaybackQueueOrder(state, newQueue, currentTrackUniqueId);
                    });
                },
                moveSelectedToBottom: (items: QueueSong[]) => {
                    set((state) => {
                        const currentTrackUniqueId = state.getCurrentSong()?._uniqueId;
                        const uniqueIds = items.map((item) => item._uniqueId);

                        // Add new songs to songs object
                        items.forEach((item) => {
                            state.queue.songs[item._uniqueId] = item;
                        });

                        appendMissingQueueIds(state, uniqueIds);

                        const playbackIds = getPlaybackQueueIds(state);
                        const movedIds = getMovedIdsInPlaybackOrder(playbackIds, uniqueIds);
                        const movedIdSet = new Set(movedIds);
                        const filtered = playbackIds.filter((id) => !movedIdSet.has(id));

                        const newQueue = [...filtered, ...movedIds];

                        applyPlaybackQueueOrder(state, newQueue, currentTrackUniqueId);
                    });
                },
                moveSelectedToNext: (items: QueueSong[]) => {
                    set((state) => {
                        const currentTrackUniqueId = state.getCurrentSong()?._uniqueId;
                        const uniqueIds = items.map((item) => item._uniqueId);

                        // Add new songs to songs object
                        items.forEach((item) => {
                            state.queue.songs[item._uniqueId] = item;
                        });

                        appendMissingQueueIds(state, uniqueIds);

                        const playbackIds = getPlaybackQueueIds(state);
                        const movedIds = getMovedIdsInPlaybackOrder(playbackIds, uniqueIds);
                        const movedIdSet = new Set(movedIds);
                        const filtered = playbackIds.filter((id) => !movedIdSet.has(id));
                        const currentIndex = currentTrackUniqueId
                            ? filtered.indexOf(currentTrackUniqueId)
                            : -1;
                        const insertIndex = currentIndex === -1 ? 0 : currentIndex + 1;

                        const newQueue = [
                            ...filtered.slice(0, insertIndex),
                            ...movedIds,
                            ...filtered.slice(insertIndex),
                        ];

                        applyPlaybackQueueOrder(state, newQueue, currentTrackUniqueId);
                    });
                },
                moveSelectedToTop: (items: QueueSong[]) => {
                    set((state) => {
                        const currentTrackUniqueId = state.getCurrentSong()?._uniqueId;
                        const uniqueIds = items.map((item) => item._uniqueId);

                        // Add new songs to songs object
                        items.forEach((item) => {
                            state.queue.songs[item._uniqueId] = item;
                        });

                        appendMissingQueueIds(state, uniqueIds);

                        const playbackIds = getPlaybackQueueIds(state);
                        const movedIds = getMovedIdsInPlaybackOrder(playbackIds, uniqueIds);
                        const movedIdSet = new Set(movedIds);
                        const filtered = playbackIds.filter((id) => !movedIdSet.has(id));

                        const newQueue = [...movedIds, ...filtered];

                        applyPlaybackQueueOrder(state, newQueue, currentTrackUniqueId);
                    });
                },
                prepareQueueRefill: () => {
                    if (!useSettingsStore.getState().playback.consumeQueue) {
                        return;
                    }

                    set((state) => {
                        if (
                            state.player.repeat !== PlayerRepeat.ALL ||
                            state.player.pauseOnNextSongEnd ||
                            state.queue.preparedRefillBoundary
                        ) {
                            return;
                        }

                        const playbackIds = getPlaybackQueueIds(state);
                        if (playbackIds.length !== 1) {
                            return;
                        }

                        const currentUniqueId = playbackIds[0];
                        const currentSong = state.queue.songs[currentUniqueId];
                        if (!currentSong) {
                            return;
                        }

                        const refillSourceIds =
                            state.player.shuffle === PlayerShuffle.TRACK
                                ? selectShuffledRefillIds(state, currentSong.id)
                                : [...state.queue.consumed, currentUniqueId].filter(
                                      (id) => state.queue.songs[id] !== undefined,
                                  );

                        if (refillSourceIds.length === 0) {
                            return;
                        }

                        const preparedIds = refillSourceIds.map((sourceId) => {
                            const preparedId = nanoid();
                            state.queue.songs[preparedId] = {
                                ...state.queue.songs[sourceId],
                                _uniqueId: preparedId,
                            };
                            return preparedId;
                        });

                        state.queue.default.push(...preparedIds);

                        if (state.player.shuffle === PlayerShuffle.TRACK) {
                            state.queue.shuffled = [currentUniqueId, ...preparedIds]
                                .map((id) => state.queue.default.indexOf(id))
                                .filter((index) => index !== -1);
                        }

                        state.queue.preparedRefillBoundary = currentUniqueId;
                        state.queue.preparedRefillIds = preparedIds;
                    });
                },
                refreshQueueSource: (items: Song[]) => {
                    const source = get().queue.source;
                    if (!source) {
                        return;
                    }

                    const sourceItems = items.map((item) => ({
                        ...item,
                        _contextPlaylistId:
                            source.type === LibraryItem.PLAYLIST ? source.id : undefined,
                    }));
                    const newItems = sourceItems.map(toQueueSong);
                    const newUniqueIds = newItems.map((item) => item._uniqueId);

                    set((state) => {
                        if (
                            state.queue.source?.id !== source.id ||
                            state.queue.source.type !== source.type
                        ) {
                            return;
                        }

                        newItems.forEach((item) => {
                            state.queue.songs[item._uniqueId] = item;
                        });
                        state.queue.source.trackIds = newUniqueIds;
                        cleanupOrphanedSongs(state);
                    });
                },
                setQueue: (items, index, position) => {
                    const newItems = items.map(toQueueSong);
                    const newUniqueIds = newItems.map((item) => item._uniqueId);

                    set((state) => {
                        newItems.forEach((item) => {
                            state.queue.songs[item._uniqueId] = item;
                        });

                        state.player.index = index ?? 0;
                        state.player.status = PlayerStatus.PLAYING;
                        state.player.playerNum = 1;
                        state.queue.default = newUniqueIds;
                        state.queue.shuffled = [];
                        resetQueueCycle(state, newItems, newUniqueIds);
                        cleanupOrphanedSongs(state);
                    });

                    eventEmitter.emit('QUEUE_RESTORED', {
                        data: items,
                        index: index ?? 0,
                        position: position ?? 0,
                    });
                },
                ...initialState,
                setCrossfadeDuration: (duration: number) => {
                    set((state) => {
                        const normalizedDuration = Math.max(3, Math.min(21, duration));
                        state.player.crossfadeDuration = normalizedDuration;
                    });
                },
                setCrossfadeStyle: (style: CrossfadeStyle) => {
                    set((state) => {
                        state.player.crossfadeStyle = style;
                    });
                },
                setPauseOnNextSongEnd: (value: boolean) => {
                    set((state) => {
                        state.player.pauseOnNextSongEnd = value;
                    });
                },
                setRepeat: (repeat: PlayerRepeat) => {
                    set((state) => {
                        state.player.repeat = repeat;
                        if (repeat !== PlayerRepeat.ALL) {
                            discardPreparedQueueRefill(state);
                        }
                    });
                },
                setShuffle: (shuffle: PlayerShuffle) => {
                    set((state) => {
                        const wasShuffled = state.player.shuffle === PlayerShuffle.TRACK;
                        const willBeShuffled = shuffle === PlayerShuffle.TRACK;
                        const currentIndex = state.player.index;
                        const currentTrackUniqueId = getPlaybackQueueIds(state)[currentIndex];

                        state.player.shuffle = shuffle;

                        if (willBeShuffled) {
                            const shuffledPlaybackIds = createAnchoredShuffledPlaybackIds(
                                state.queue.default,
                                currentTrackUniqueId,
                            );
                            applyPlaybackQueueOrder(
                                state,
                                shuffledPlaybackIds,
                                currentTrackUniqueId,
                            );
                        } else {
                            // When disabling shuffle, convert shuffled position back to queue position
                            if (
                                wasShuffled &&
                                currentIndex >= 0 &&
                                currentIndex < state.queue.shuffled.length
                            ) {
                                const queuePosition = state.queue.shuffled[currentIndex];
                                if (queuePosition !== undefined) {
                                    state.player.index = queuePosition;
                                }
                            }
                            state.queue.shuffled = [];
                        }
                        cleanupOrphanedSongs(state);
                    });
                },
                setSpeed: (speed: number) => {
                    set((state) => {
                        const normalizedSpeed = Math.max(0.5, Math.min(2, speed));
                        state.player.speed = normalizedSpeed;
                    });
                },
                setTransitionType: (transitionType: PlayerStyle) => {
                    set((state) => {
                        state.player.transitionType = transitionType;
                    });
                },
                setVolume: (volume: number) => {
                    set((state) => {
                        state.player.volume = Math.min(100, Math.max(0, volume));
                    });
                },
                shuffle: () => {
                    set((state) => {
                        if (state.player.shuffle === PlayerShuffle.TRACK) {
                            const playbackIds = getPlaybackQueueIds(state);
                            const currentTrackUniqueId = playbackIds[state.player.index];
                            const shuffledPlaybackIds = createAnchoredShuffledPlaybackIds(
                                playbackIds,
                                currentTrackUniqueId,
                            );
                            applyPlaybackQueueOrder(
                                state,
                                shuffledPlaybackIds,
                                currentTrackUniqueId,
                            );
                        }
                    });
                },
                shuffleAll: () => {
                    set((state) => {
                        const playbackIds = getPlaybackQueueIds(state);
                        const currentTrackUniqueId = playbackIds[state.player.index];
                        const shuffledPlaybackIds = createAnchoredShuffledPlaybackIds(
                            playbackIds,
                            currentTrackUniqueId,
                        );
                        applyPlaybackQueueOrder(state, shuffledPlaybackIds, currentTrackUniqueId);
                    });
                },
                shuffleSelected: (items: QueueSong[]) => {
                    set((state) => {
                        const currentTrackUniqueId = state.getCurrentSong()?._uniqueId;
                        const playbackIds = getPlaybackQueueIds(state);
                        const itemUniqueIds = items.map((item) => item._uniqueId);

                        // Find positions of selected items in the visible playback queue
                        const selectedPositions = itemUniqueIds
                            .map((id) => playbackIds.findIndex((i) => i === id))
                            .filter((idx) => idx !== -1)
                            .sort((a, b) => a - b); // Sort to maintain order

                        if (selectedPositions.length === 0) {
                            return;
                        }

                        // Get the selected items in their current order
                        const selectedItems = selectedPositions.map((pos) => playbackIds[pos]);

                        // Shuffle the selected items
                        const shuffledItems = shuffleInPlace([...selectedItems]);

                        // Rebuild the playback queue with shuffled selected items
                        const newPlaybackQueue = [...playbackIds];
                        selectedPositions.forEach((pos, i) => {
                            newPlaybackQueue[pos] = shuffledItems[i];
                        });

                        applyPlaybackQueueOrder(state, newPlaybackQueue, currentTrackUniqueId);
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

                        if (state.player.repeat !== PlayerRepeat.ALL) {
                            discardPreparedQueueRefill(state);
                        }
                    });
                },
                toggleShuffle: () => {
                    set((state) => {
                        const wasShuffled = state.player.shuffle === PlayerShuffle.TRACK;
                        const willBeShuffled = state.player.shuffle !== PlayerShuffle.TRACK;
                        const currentIndex = state.player.index;
                        const currentTrackUniqueId = getPlaybackQueueIds(state)[currentIndex];

                        state.player.shuffle =
                            state.player.shuffle === PlayerShuffle.NONE
                                ? PlayerShuffle.TRACK
                                : PlayerShuffle.NONE;

                        if (willBeShuffled) {
                            const shuffledPlaybackIds = createAnchoredShuffledPlaybackIds(
                                state.queue.default,
                                currentTrackUniqueId,
                            );
                            applyPlaybackQueueOrder(
                                state,
                                shuffledPlaybackIds,
                                currentTrackUniqueId,
                            );
                        } else {
                            // Disabling shuffle: clear shuffled indexes and convert index back
                            if (
                                wasShuffled &&
                                currentIndex >= 0 &&
                                currentIndex < state.queue.shuffled.length
                            ) {
                                const queuePosition = state.queue.shuffled[currentIndex];
                                if (queuePosition !== undefined) {
                                    state.player.index = queuePosition;
                                }
                            }
                            state.queue.shuffled = [];
                        }
                    });
                },
            })),
        ),
        {
            merge: (persistedState: any, currentState: any) => {
                const merged = merge(currentState, persistedState);

                if (merged.player) {
                    merged.player.volume = Math.min(100, Math.max(0, merged.player.volume));
                }

                return merged;
            },
            migrate: async (persistedState, oldVersion) => {
                if (oldVersion < 3) {
                    return {} as PlayerState;
                }

                if (oldVersion === 3) {
                    await migratePlayerStorePersist('player-store');
                    return persistedState as Partial<PlayerState>;
                }

                return persistedState as Partial<PlayerState>;
            },
            name: 'player-store',
            onRehydrateStorage: () => (state) => {
                if (!state) return;
                const playback = useSettingsStore.getState().playback;
                if (playback.previousLocalVolume !== undefined) {
                    state.player.volume = Math.min(100, Math.max(0, playback.previousLocalVolume));
                }
                usePlayerStoreBase.setState({ hydrated: true });
            },
            partialize: (state) => {
                const shouldRestorePlayQueue = useSettingsStore.getState().general.resume;

                // Exclude playerNum, seekToTimestamp, and status from stored player object
                // These are not needed to be stored since they are ephemeral properties
                // Note: timestamp is now in a separate store and doesn't need to be excluded here
                const excludedPlayerKeys = ['playerNum', 'seekToTimestamp', 'status'];

                // If we're not restoring the play queue, we don't need the index property
                // (it is meaningless without the queue)
                if (!shouldRestorePlayQueue) {
                    excludedPlayerKeys.push('index');
                }

                const player = Object.fromEntries(
                    Object.entries(state.player).filter(
                        ([key]) => !excludedPlayerKeys.includes(key),
                    ),
                ) as typeof state.player;

                if (!shouldRestorePlayQueue) {
                    return { player };
                }

                // Queue pruning and IDB writes are handled in `playerStoreStorage` so we only
                // serialize the large queue when the queue slice reference actually changes.
                return { player, queue: state.queue };
            },
            storage: playerStoreStorage,
            version: 4,
        },
    ),
);

export const usePlayerStore = createSelectors(usePlayerStoreBase);

export const usePlayerActions = () => {
    const actions = usePlayerStoreBase(
        useShallow((state) => ({
            addToQueueByType: state.addToQueueByType,
            addToQueueByUniqueId: state.addToQueueByUniqueId,
            clearQueue: state.clearQueue,
            clearSelected: state.clearSelected,
            decreaseVolume: state.decreaseVolume,
            getPlaybackQueue: state.getPlaybackQueue,
            getQueue: state.getQueue,
            increaseVolume: state.increaseVolume,
            isFirstTrackInQueue: state.isFirstTrackInQueue,
            isLastTrackInQueue: state.isLastTrackInQueue,
            mediaAutoNext: state.mediaAutoNext,
            mediaNext: state.mediaNext,
            mediaPause: state.mediaPause,
            mediaPlay: state.mediaPlay,
            mediaPlayByIndex: state.mediaPlayByIndex,
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
            prepareQueueRefill: state.prepareQueueRefill,
            refreshQueueSource: state.refreshQueueSource,
            setCrossfadeDuration: state.setCrossfadeDuration,
            setCrossfadeStyle: state.setCrossfadeStyle,
            setPauseOnNextSongEnd: state.setPauseOnNextSongEnd,
            setQueue: state.setQueue,
            setRepeat: state.setRepeat,
            setShuffle: state.setShuffle,
            setSpeed: state.setSpeed,
            setTransitionType: state.setTransitionType,
            setVolume: state.setVolume,
            shuffle: state.shuffle,
            shuffleAll: state.shuffleAll,
            shuffleSelected: state.shuffleSelected,
            toggleRepeat: state.toggleRepeat,
            toggleShuffle: state.toggleShuffle,
        })),
    );

    return useMemo(
        () => ({
            ...actions,
            setTimestamp: setTimestampStore,
        }),
        [actions],
    );
};

export type AddToQueueByPlayType = Play;

export type AddToQueueByUniqueId = {
    edge: 'bottom' | 'left' | 'right' | 'top' | null;
    uniqueId: string;
};

export type AddToQueueOptions = {
    filter?: (song: Song) => boolean;
    skipConfirmation?: boolean;
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
            let index = state.player.index;

            if (isShuffleEnabled(state)) {
                index = mapShuffledToQueueIndex(index, state.queue.shuffled);
            }

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

export const subscribeNextSongInsertion = (onChange: (song: QueueSong | undefined) => void) => {
    return usePlayerStoreBase.subscribe(
        (state) => {
            const queue = state.getQueue();
            let queueIndex = state.player.index;
            const repeat = state.player.repeat;

            // If shuffle is enabled, map shuffled position to actual queue position
            if (isShuffleEnabled(state)) {
                queueIndex = mapShuffledToQueueIndex(queueIndex, state.queue.shuffled);
            }

            const currentSong = queue.items[queueIndex];

            // Calculate next song based on shuffle and repeat settings
            let nextSong: QueueSong | undefined;
            if (isShuffleEnabled(state) && repeat !== PlayerRepeat.ONE) {
                // Calculate next in shuffled order
                const nextShuffledIndex = state.player.index + 1;
                if (nextShuffledIndex < state.queue.shuffled.length) {
                    const nextQueueIndex = state.queue.shuffled[nextShuffledIndex];
                    nextSong = queue.items[nextQueueIndex];
                } else if (repeat === PlayerRepeat.ALL) {
                    // Wrap to first in shuffled order
                    const firstQueueIndex = state.queue.shuffled[0];
                    nextSong = queue.items[firstQueueIndex];
                }
            } else {
                nextSong = calculateNextSong(queueIndex, queue.items, repeat);
            }

            return {
                currentUniqueId: currentSong?._uniqueId,
                nextSong,
            };
        },
        (current, prev) => {
            if (!prev) {
                return;
            }

            // Still on the same track, but the upcoming song changed (queue edit: insert, reorder, etc.).
            // Do not require the current track's queue index to stay fixed — e.g. inserting *before* the
            // current item shifts its index in `queue.default`, and the old check missed that case.
            const sameTrackStillPlaying =
                current.currentUniqueId !== undefined &&
                current.currentUniqueId === prev.currentUniqueId;

            if (sameTrackStillPlaying && current.nextSong?._uniqueId !== prev.nextSong?._uniqueId) {
                onChange(current.nextSong);
            }
        },
        {
            // Always allow the subscription to fire so we can check conditions in the callback
            equalityFn: () => false,
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

export const subscribeQueueCleared = (onChange: () => void) => {
    return usePlayerStoreBase.subscribe(
        (state) => state.queue,
        (queue, prevQueue) => {
            // Detect if queue became empty
            const wasNotEmpty = prevQueue.default.length > 0;
            const isEmpty = queue.default.length === 0;

            if (wasNotEmpty && isEmpty) {
                onChange();
            }
        },
    );
};

export const usePlayerProperties = () => {
    return usePlayerStoreBase(
        useShallow((state) => ({
            crossfadeDuration: state.player.crossfadeDuration,
            crossfadeStyle: state.player.crossfadeStyle,
            isMuted: state.player.muted,
            playerNum: state.player.playerNum,
            repeat: state.player.repeat,
            shuffle: state.player.shuffle,
            speed: state.player.speed,
            status: state.player.status,
            transitionType: state.player.transitionType,
            volume: state.player.volume,
        })),
    );
};

export const usePlayerDuration = () => {
    return usePlayerStoreBase((state) => {
        const queue = state.getQueue();
        let index = state.player.index;

        // If shuffle is enabled, map shuffled position to actual queue position
        if (state.player.shuffle === PlayerShuffle.TRACK && state.queue.shuffled.length > 0) {
            if (index >= 0 && index < state.queue.shuffled.length) {
                index = state.queue.shuffled[index];
            }
        }

        const currentTrack = queue.items[index];
        return currentTrack?.duration;
    });
};

export const usePlayerData = (): PlayerData => {
    return usePlayerStoreBase(
        useShallow((state) => {
            const queue = state.getQueue();
            const index = state.player.index;

            // If shuffle is enabled, map shuffled position to actual queue position for display
            let queueIndex = index;
            if (isShuffleEnabled(state)) {
                queueIndex = mapShuffledToQueueIndex(index, state.queue.shuffled);
            }

            const currentSong = queue.items[queueIndex];
            const repeat = state.player.repeat;

            // For previousSong calculation, we need to consider the shuffled order
            let previousSong: QueueSong | undefined;
            if (isShuffleEnabled(state)) {
                // Calculate previous in shuffled order
                const previousShuffledIndex = index - 1;
                if (previousShuffledIndex >= 0) {
                    const previousQueueIndex = state.queue.shuffled[previousShuffledIndex];
                    previousSong = queue.items[previousQueueIndex];
                } else if (repeat === PlayerRepeat.ALL) {
                    // Wrap to last in shuffled order
                    const lastShuffledIndex = state.queue.shuffled.length - 1;
                    const lastQueueIndex = state.queue.shuffled[lastShuffledIndex];
                    previousSong = queue.items[lastQueueIndex];
                }
            } else {
                previousSong = queueIndex > 0 ? queue.items[queueIndex - 1] : undefined;
            }

            // For nextSong calculation, we need to consider the shuffled order
            let nextSong: QueueSong | undefined;
            if (isShuffleEnabled(state) && repeat !== PlayerRepeat.ONE) {
                // Calculate next in shuffled order
                const nextShuffledIndex = index + 1;
                if (nextShuffledIndex < state.queue.shuffled.length) {
                    const nextQueueIndex = state.queue.shuffled[nextShuffledIndex];
                    nextSong = queue.items[nextQueueIndex];
                } else if (repeat === PlayerRepeat.ALL) {
                    // Wrap to first in shuffled order
                    const firstQueueIndex = state.queue.shuffled[0];
                    nextSong = queue.items[firstQueueIndex];
                }
            } else {
                nextSong = calculateNextSong(queueIndex, queue.items, repeat);
            }

            const { player1, player2 } = getDualPlayerSongs(
                state.player.playerNum,
                currentSong,
                nextSong,
                repeat,
            );

            return {
                currentSong,
                index: queueIndex, // Return the actual queue position for display
                nextSong,
                num: state.player.playerNum,
                player1,
                player2,
                previousSong,
                queueLength: state.queue.default.length,
                status: state.player.status,
            };
        }),
    );
};

export const updateQueueFavorites = (ids: string[], favorite: boolean) => {
    usePlayerStoreBase.setState((state) => {
        Object.values(state.queue.songs).forEach((song) => {
            if (ids.includes(song.id)) {
                song.userFavorite = favorite;
            }
        });
    });
};

export const updateQueueRatings = (ids: string[], rating: null | number) => {
    usePlayerStoreBase.setState((state) => {
        Object.values(state.queue.songs).forEach((song) => {
            if (ids.includes(song.id)) {
                song.userRating = rating;
            }
        });
    });
};

export const incrementQueuePlayCount = (ids: string[]) => {
    usePlayerStoreBase.setState((state) => {
        Object.values(state.queue.songs).forEach((song) => {
            if (ids.includes(song.id)) {
                song.playCount = (song.playCount || 0) + 1;
            }
        });
    });
};

export const updateQueueSong = (songId: string, updatedSong: Song) => {
    usePlayerStoreBase.setState((state) => {
        Object.values(state.queue.songs).forEach((song) => {
            if (song.id === songId) {
                const uniqueId = song._uniqueId;
                state.queue.songs[song._uniqueId] = {
                    ...updatedSong,
                    _contextPlaylistId: song._contextPlaylistId,
                    _uniqueId: uniqueId,
                };
            }
        });
    });
};

export const useCurrentPlaylistContextId = () => {
    return usePlayerStoreBase((state) => state.getCurrentSong()?._contextPlaylistId ?? null);
};

export const usePlayerMuted = () => {
    return usePlayerStoreBase((state) => state.player.muted);
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

export const usePlayerHydrated = () => {
    return usePlayerStoreBase((state) => state.hydrated);
};

export const useMpvInitialized = () => {
    return usePlayerStoreBase((state) => state.mpvInitialized);
};

export const setMpvInitialized = (mpvInitialized: boolean) => {
    usePlayerStoreBase.setState({ mpvInitialized });
};

export const usePlayerVolume = () => {
    return usePlayerStoreBase((state) => state.player.volume);
};

export const usePlayerSpeed = () => {
    return usePlayerStoreBase((state) => state.player.speed);
};

export const usePlayerSong = () => {
    return usePlayerStoreBase(
        (state) => {
            return state.getCurrentSong();
        },
        (prev, next) => {
            return (
                prev?._uniqueId === next?._uniqueId &&
                prev?.userFavorite === next?.userFavorite &&
                prev?.userRating === next?.userRating
            );
        },
    );
};

export const usePlayerSongProperties = <T extends keyof QueueSong>(
    properties: T[],
): Partial<Pick<QueueSong, T>> => {
    return usePlayerStoreBase(
        useShallow((state) => {
            const song = state.getCurrentSong();
            if (!song) {
                return {};
            }

            const result = {} as Pick<QueueSong, T>;

            for (const prop of properties) {
                result[prop] = song[prop];
            }
            return result;
        }),
    );
};

export const usePlayerNum = () => {
    return usePlayerStoreBase((state) => state.player.playerNum);
};

export const usePlayerQueue = () => {
    return usePlayerStoreBase(
        useShallow((state) => {
            const songs = state.queue.songs;
            const queue = state.queue.default;
            const result: QueueSong[] = [];
            for (const id of queue) {
                const song = songs[id];
                if (song) result.push(song);
            }
            return result;
        }),
    );
};

function appendMissingQueueIds(state: PlaybackQueueState, uniqueIds: string[]) {
    const existingIds = new Set(state.queue.default);

    for (const uniqueId of uniqueIds) {
        if (!existingIds.has(uniqueId)) {
            state.queue.default.push(uniqueId);
            existingIds.add(uniqueId);
        }
    }
}

function applyPlaybackQueueOrder(
    state: PlaybackQueueState,
    playbackIds: string[],
    currentTrackUniqueId: string | undefined,
) {
    if (isShuffleEnabled(state)) {
        const queueIndexes = new Map(state.queue.default.map((id, index) => [id, index]));
        state.queue.shuffled = playbackIds
            .map((id) => queueIndexes.get(id))
            .filter((index): index is number => index !== undefined);
    } else {
        state.queue.default = playbackIds;
    }

    if (currentTrackUniqueId) {
        const currentIndex = playbackIds.indexOf(currentTrackUniqueId);
        if (currentIndex !== -1) {
            state.player.index = currentIndex;
        }
    }
}

function cleanupOrphanedSongs(state: any): boolean {
    const allQueueIds = new Set([
        ...(state.queue.consumed || []),
        ...(state.queue.source?.trackIds || []),
        ...state.queue.default,
        // shuffled now contains indexes, not uniqueIds, so we don't include it here
    ]);

    const songs = state.queue.songs;
    const songIds = Object.keys(songs);
    let hasOrphans = false;
    const orphanedIds: string[] = [];

    for (const songId of songIds) {
        if (!allQueueIds.has(songId)) {
            orphanedIds.push(songId);
            hasOrphans = true;
        }
    }

    if (hasOrphans) {
        const cleanedSongs: Record<string, QueueSong> = {};
        for (const songId of songIds) {
            if (!orphanedIds.includes(songId)) {
                cleanedSongs[songId] = songs[songId];
            }
        }
        state.queue.songs = cleanedSongs;
    }

    return hasOrphans;
}

function consumeCurrentQueueSong(
    state: Pick<State, 'player' | 'queue'>,
    targetUniqueId?: string,
): QueueConsumptionResult {
    const playbackIds = getPlaybackQueueIds(state);
    const currentIndex = state.player.index;
    const currentUniqueId = playbackIds[currentIndex];

    if (!currentUniqueId) {
        return { currentIndex, nextIndex: -1, shouldStop: true };
    }

    const defaultIndex = state.queue.default.indexOf(currentUniqueId);
    const nextUniqueId = targetUniqueId ?? playbackIds[currentIndex + 1];
    const currentSong = state.queue.songs[currentUniqueId];
    const isPreparedRefillBoundary = state.queue.preparedRefillBoundary === currentUniqueId;

    if (isPreparedRefillBoundary) {
        // The remaining entries are the next cycle, so discard the completed cycle.
        state.queue.consumed = [];
        state.queue.preparedRefillBoundary = null;
        state.queue.preparedRefillIds = [];
    } else {
        state.queue.consumed.push(currentUniqueId);
    }
    if (currentSong?.id) {
        state.queue.recentlyPlayed = [
            ...state.queue.recentlyPlayed.filter((id) => id !== currentSong.id),
            currentSong.id,
        ].slice(-50);
    }

    if (defaultIndex !== -1) {
        state.queue.default.splice(defaultIndex, 1);
        state.queue.shuffled = state.queue.shuffled
            .filter((index) => index !== defaultIndex)
            .map((index) => (index > defaultIndex ? index - 1 : index));
    }

    let remainingPlaybackIds = getPlaybackQueueIds(state);
    let nextIndex = nextUniqueId ? remainingPlaybackIds.indexOf(nextUniqueId) : -1;

    if (nextIndex === -1 && remainingPlaybackIds.length === 0) {
        refillConsumedQueue(state);
        remainingPlaybackIds = getPlaybackQueueIds(state);
        nextIndex = remainingPlaybackIds.length > 0 ? 0 : -1;
    }

    if (
        nextIndex === -1 &&
        remainingPlaybackIds.length > 0 &&
        state.player.repeat === PlayerRepeat.ALL
    ) {
        nextIndex = 0;
    }

    const shouldStop = nextIndex === -1;
    const playerIndex = shouldStop && remainingPlaybackIds.length > 0 ? 0 : nextIndex;
    state.player.index = playerIndex;

    return {
        currentIndex,
        nextIndex: playerIndex,
        shouldStop,
    };
}

function consumeQueueSongsBeforeTarget(
    state: Pick<State, 'player' | 'queue'>,
    targetUniqueId: string,
) {
    // The queue panel renders playback order, which differs from default order
    // while shuffle is enabled. Consume only the rows visibly above the target.
    const playbackIds = getPlaybackQueueIds(state);
    const targetIndex = playbackIds.indexOf(targetUniqueId);

    if (targetIndex <= 0) {
        return;
    }

    const consumedIds = playbackIds.slice(0, targetIndex);
    const consumedIdSet = new Set(consumedIds);
    const preparedBoundaryIndex = state.queue.preparedRefillBoundary
        ? consumedIds.indexOf(state.queue.preparedRefillBoundary)
        : -1;

    if (preparedBoundaryIndex !== -1) {
        // A manual jump crossed into the prepared cycle. Do not carry the
        // completed cycle's history into the new one.
        state.queue.consumed = consumedIds.slice(preparedBoundaryIndex + 1);
        state.queue.preparedRefillBoundary = null;
        state.queue.preparedRefillIds = [];
    } else {
        state.queue.consumed.push(...consumedIds);
    }

    let recentlyPlayed = [...state.queue.recentlyPlayed];
    for (const uniqueId of consumedIds) {
        const songId = state.queue.songs[uniqueId]?.id;
        if (songId) {
            recentlyPlayed = [...recentlyPlayed.filter((id) => id !== songId), songId];
        }
    }
    state.queue.recentlyPlayed = recentlyPlayed.slice(-50);

    state.queue.default = state.queue.default.filter((id) => !consumedIdSet.has(id));

    if (isShuffleEnabled(state)) {
        state.queue.shuffled = playbackIds
            .slice(targetIndex)
            .map((id) => state.queue.default.indexOf(id))
            .filter((index) => index !== -1);
    } else {
        state.queue.shuffled = [];
    }
}

function createAnchoredShuffledPlaybackIds(
    playbackIds: string[],
    currentTrackUniqueId: string | undefined,
) {
    if (!currentTrackUniqueId || !playbackIds.includes(currentTrackUniqueId)) {
        return shuffleInPlace([...playbackIds]);
    }

    const remainingIds = playbackIds.filter((id) => id !== currentTrackUniqueId);
    return [currentTrackUniqueId, ...shuffleInPlace(remainingIds)];
}

function discardPreparedQueueRefill(state: Pick<State, 'player' | 'queue'>) {
    const preparedRefillIds = state.queue.preparedRefillIds ?? [];
    if (!state.queue.preparedRefillBoundary && preparedRefillIds.length === 0) {
        return;
    }

    const currentUniqueId = getPlaybackQueueIds(state)[state.player.index];
    const queueOrder = removeQueueIds(state.queue.default, state.queue.shuffled, preparedRefillIds);

    state.queue.default = queueOrder.defaultIds;
    state.queue.shuffled = queueOrder.shuffledIndexes;
    state.queue.preparedRefillBoundary = null;
    state.queue.preparedRefillIds = [];

    if (currentUniqueId) {
        const currentIndex = getPlaybackQueueIds(state).indexOf(currentUniqueId);
        if (currentIndex !== -1) {
            state.player.index = currentIndex;
        }
    }

    cleanupOrphanedSongs(state);
}

function findIndexWithPreviousAlbum(queueItems: QueueSong[], currentIndex: number) {
    const queueBeforeCurrent = queueItems.slice(0, currentIndex);
    const currentItem = queueItems[currentIndex];

    const previousAlbumIdInQueue = queueBeforeCurrent.findLast(
        (i) => i.albumId !== currentItem.albumId,
    )?.albumId;

    let prevIndex = -1;

    if (previousAlbumIdInQueue) {
        for (let index = queueBeforeCurrent.length - 1; index > -1; index--) {
            const element = queueBeforeCurrent[index];
            if (element.albumId === previousAlbumIdInQueue) {
                prevIndex = index;
            }
            if (prevIndex > -1 && element.albumId !== previousAlbumIdInQueue) {
                break;
            }
        }
    }

    return prevIndex;
}

function findLastAlbumRange(queueItems: QueueSong[]) {
    const lastAlbumId = queueItems.at(-1)?.albumId;
    const rangeEnd = queueItems.length - 1;
    let rangeStart = rangeEnd;

    for (let index = rangeEnd; index > -1; index--) {
        const element = queueItems[index];
        rangeStart = index;
        if (element.albumId !== lastAlbumId) {
            break;
        }
    }

    return [rangeStart + 1, rangeEnd];
}

function findNextAlbumUniqueId(state: PlayerState) {
    const playbackIds = getPlaybackQueueIds(state);
    const currentUniqueId = playbackIds[state.player.index];
    const currentAlbumId = currentUniqueId
        ? state.queue.songs[currentUniqueId]?.albumId
        : undefined;

    if (!currentAlbumId) {
        return undefined;
    }

    const laterId = playbackIds
        .slice(state.player.index + 1)
        .find((id) => state.queue.songs[id]?.albumId !== currentAlbumId);

    if (laterId || state.player.repeat !== PlayerRepeat.ALL) {
        return laterId;
    }

    return playbackIds
        .slice(0, state.player.index)
        .find((id) => state.queue.songs[id]?.albumId !== currentAlbumId);
}

function getMovedIdsInPlaybackOrder(playbackIds: string[], uniqueIds: string[]) {
    const uniqueIdSet = new Set(uniqueIds);
    const playbackIdSet = new Set(playbackIds);
    const existingIds = playbackIds.filter((id) => uniqueIdSet.has(id));
    const newIds = uniqueIds.filter((id) => !playbackIdSet.has(id));

    return [...existingIds, ...new Set(newIds)];
}

function getPlaybackQueueIds(state: PlaybackQueueState) {
    if (!isShuffleEnabled(state)) {
        return [...state.queue.default];
    }

    return state.queue.shuffled
        .map((queueIndex) => state.queue.default[queueIndex])
        .filter((id): id is string => id !== undefined);
}

function getQueueSource(items: QueueSong[], uniqueIds: string[]): null | QueueSource {
    const playlistIds = new Set(
        items.map((item) => item._contextPlaylistId).filter((id): id is string => Boolean(id)),
    );

    if (playlistIds.size === 1) {
        return {
            id: [...playlistIds][0],
            trackIds: [...uniqueIds],
            type: LibraryItem.PLAYLIST,
        };
    }

    const albumIds = new Set(items.map((item) => item.albumId).filter(Boolean));
    if (albumIds.size === 1) {
        return {
            id: [...albumIds][0],
            trackIds: [...uniqueIds],
            type: LibraryItem.ALBUM,
        };
    }

    return null;
}

function parseUniqueSeekToTimestamp(timestamp: string) {
    return Number(timestamp.split('-')[0]);
}

function refillConsumedQueue(state: Pick<State, 'player' | 'queue'>) {
    if (!shouldRefillQueue(state.player.repeat)) {
        return;
    }

    const selectedIds = selectShuffledRefillIds(state);

    if (state.player.shuffle === PlayerShuffle.TRACK && selectedIds.length > 0) {
        state.queue.consumed = [];
        state.queue.default = selectedIds;
        state.queue.preparedRefillBoundary = null;
        state.queue.preparedRefillIds = [];
        state.queue.shuffled = selectedIds.map((_, index) => index);
        return;
    }

    if (state.player.repeat === PlayerRepeat.ALL && state.queue.consumed.length > 0) {
        state.queue.default = state.queue.consumed.filter(
            (id) => state.queue.songs[id] !== undefined,
        );
        state.queue.consumed = [];
        state.queue.preparedRefillBoundary = null;
        state.queue.preparedRefillIds = [];
        state.queue.shuffled =
            state.player.shuffle === PlayerShuffle.TRACK
                ? generateShuffledIndexes(state.queue.default.length)
                : [];
    }
}

function resetQueueCycle(state: { queue: QueueData }, items: QueueSong[], uniqueIds: string[]) {
    state.queue.consumed = [];
    state.queue.preparedRefillBoundary = null;
    state.queue.preparedRefillIds = [];
    state.queue.recentlyPlayed = [];
    state.queue.source = getQueueSource(items, uniqueIds);
}

function selectShuffledRefillIds(
    state: Pick<State, 'player' | 'queue'>,
    lastPlayedSongId = state.queue.recentlyPlayed.at(-1),
) {
    const validSourceIds = (state.queue.source?.trackIds ?? []).filter(
        (id) => state.queue.songs[id] !== undefined,
    );

    if (state.player.shuffle !== PlayerShuffle.TRACK || validSourceIds.length === 0) {
        return [];
    }

    const source = state.queue.source;
    const recentSongIds = new Set(state.queue.recentlyPlayed);
    let selectedIds: string[];

    if (source?.type === LibraryItem.PLAYLIST && validSourceIds.length > 100) {
        const eligibleIds = validSourceIds.filter((id) => {
            const songId = state.queue.songs[id]?.id;
            return songId !== undefined && !recentSongIds.has(songId);
        });
        selectedIds = shuffleInPlace([...eligibleIds]).slice(0, 50);

        if (selectedIds.length < 50) {
            const selectedIdSet = new Set(selectedIds);
            const fallbackIds = validSourceIds.filter((id) => !selectedIdSet.has(id));
            selectedIds.push(...shuffleInPlace([...fallbackIds]).slice(0, 50 - selectedIds.length));
        }
    } else {
        selectedIds = shuffleInPlace([...validSourceIds]);
    }

    if (selectedIds.length > 1 && state.queue.songs[selectedIds[0]]?.id === lastPlayedSongId) {
        const swapIndex = selectedIds.findIndex(
            (id) => state.queue.songs[id]?.id !== lastPlayedSongId,
        );
        if (swapIndex > 0) {
            [selectedIds[0], selectedIds[swapIndex]] = [selectedIds[swapIndex], selectedIds[0]];
        }
    }

    return selectedIds;
}

function toQueueSong(item: Song): QueueSong {
    return {
        ...item,
        _uniqueId: nanoid(),
    };
}
