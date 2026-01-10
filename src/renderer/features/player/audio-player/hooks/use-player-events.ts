import { useEffect } from 'react';

import { eventEmitter } from '/@/renderer/events/event-emitter';
import {
    subscribeCurrentTrack,
    subscribeNextSongInsertion,
    subscribePlayerMute,
    subscribePlayerProgress,
    subscribePlayerQueue,
    subscribePlayerRepeat,
    subscribePlayerSeekToTimestamp,
    subscribePlayerShuffle,
    subscribePlayerSpeed,
    subscribePlayerStatus,
    subscribePlayerVolume,
    subscribeQueueCleared,
} from '/@/renderer/store';
import { LibraryItem, QueueData, QueueSong, Song } from '/@/shared/types/domain-types';
import { PlayerRepeat, PlayerShuffle, PlayerStatus } from '/@/shared/types/types';

interface PlayerEvents {
    cleanup: () => void;
}

interface PlayerEventsCallbacks {
    onCurrentSongChange?: (
        properties: { index: number; song: QueueSong | undefined },
        prev: { index: number; song: QueueSong | undefined },
    ) => void;
    onMediaNext?: (properties: { currentIndex: number; nextIndex: number }) => void;
    onMediaPrev?: (properties: { currentIndex: number; prevIndex: number }) => void;
    onNextSongInsertion?: (song: QueueSong | undefined) => void;
    onPlayerMute?: (properties: { muted: boolean }, prev: { muted: boolean }) => void;
    onPlayerPlay?: (properties: { id: string; index: number }) => void;
    onPlayerProgress?: (properties: { timestamp: number }, prev: { timestamp: number }) => void;
    onPlayerQueueChange?: (queue: QueueData, prev: QueueData) => void;
    onPlayerRepeat?: (properties: { repeat: PlayerRepeat }, prev: { repeat: PlayerRepeat }) => void;
    onPlayerRepeated?: (properties: { index: number }) => void;
    onPlayerSeek?: (properties: { seconds: number }, prev: { seconds: number }) => void;
    onPlayerSeekToTimestamp?: (
        properties: { timestamp: number },
        prev: { timestamp: number },
    ) => void;
    onPlayerShuffle?: (
        properties: { shuffle: PlayerShuffle },
        prev: { shuffle: PlayerShuffle },
    ) => void;
    onPlayerSpeed?: (properties: { speed: number }, prev: { speed: number }) => void;
    onPlayerStatus?: (properties: { status: PlayerStatus }, prev: { status: PlayerStatus }) => void;
    onPlayerVolume?: (properties: { volume: number }, prev: { volume: number }) => void;
    onQueueCleared?: () => void;
    onQueueRestored?: (properties: { data: Song[]; index: number; position: number }) => void;
    onUserFavorite?: (properties: {
        favorite: boolean;
        id: string[];
        itemType: LibraryItem;
        serverId: string;
    }) => void;
    onUserRating?: (properties: {
        id: string[];
        itemType: LibraryItem;
        rating: null | number;
        serverId: string;
    }) => void;
}

export function usePlayerEvents(callbacks: PlayerEventsCallbacks, deps: React.DependencyList) {
    useEffect(() => {
        const engine = createPlayerEvents(callbacks);

        return () => {
            engine.cleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps]);
}

function createPlayerEvents(callbacks: PlayerEventsCallbacks): PlayerEvents {
    const unsubscribers: (() => void)[] = [];

    // Subscribe to current track changes
    if (callbacks.onCurrentSongChange) {
        const unsubscribe = subscribeCurrentTrack(callbacks.onCurrentSongChange);
        unsubscribers.push(unsubscribe);
    }

    // Subscribe to next song insertions (when a song is added at next position)
    if (callbacks.onNextSongInsertion) {
        const unsubscribe = subscribeNextSongInsertion(callbacks.onNextSongInsertion);
        unsubscribers.push(unsubscribe);
    }

    // Subscribe to player progress
    if (callbacks.onPlayerProgress) {
        const unsubscribe = subscribePlayerProgress(callbacks.onPlayerProgress);
        unsubscribers.push(unsubscribe);
    }

    // Subscribe to queue changes
    if (callbacks.onPlayerQueueChange) {
        const unsubscribe = subscribePlayerQueue(callbacks.onPlayerQueueChange);
        unsubscribers.push(unsubscribe);
    }

    // Subscribe to queue cleared events
    if (callbacks.onQueueCleared) {
        const unsubscribe = subscribeQueueCleared(callbacks.onQueueCleared);
        unsubscribers.push(unsubscribe);
    }

    // Subscribe to seek events
    if (callbacks.onPlayerSeekToTimestamp) {
        const unsubscribe = subscribePlayerSeekToTimestamp(callbacks.onPlayerSeekToTimestamp);
        unsubscribers.push(unsubscribe);
    }

    // Subscribe to player status changes
    if (callbacks.onPlayerStatus) {
        const unsubscribe = subscribePlayerStatus(callbacks.onPlayerStatus);
        unsubscribers.push(unsubscribe);
    }

    // Subscribe to volume changes
    if (callbacks.onPlayerVolume) {
        const unsubscribe = subscribePlayerVolume(callbacks.onPlayerVolume);
        unsubscribers.push(unsubscribe);
    }

    // Subscribe to mute changes
    if (callbacks.onPlayerMute) {
        const unsubscribe = subscribePlayerMute(callbacks.onPlayerMute);
        unsubscribers.push(unsubscribe);
    }

    // Subscribe to speed changes
    if (callbacks.onPlayerSpeed) {
        const unsubscribe = subscribePlayerSpeed(callbacks.onPlayerSpeed);
        unsubscribers.push(unsubscribe);
    }

    // Subscribe to repeat changes
    if (callbacks.onPlayerRepeat) {
        const unsubscribe = subscribePlayerRepeat(callbacks.onPlayerRepeat);
        unsubscribers.push(unsubscribe);
    }

    // Subscribe to shuffle changes
    if (callbacks.onPlayerShuffle) {
        const unsubscribe = subscribePlayerShuffle(callbacks.onPlayerShuffle);
        unsubscribers.push(unsubscribe);
    }

    if (callbacks.onMediaNext) {
        eventEmitter.on('MEDIA_NEXT', callbacks.onMediaNext);
    }

    if (callbacks.onMediaPrev) {
        eventEmitter.on('MEDIA_PREV', callbacks.onMediaPrev);
    }

    if (callbacks.onPlayerPlay) {
        eventEmitter.on('PLAYER_PLAY', callbacks.onPlayerPlay);
    }

    if (callbacks.onPlayerRepeated) {
        eventEmitter.on('PLAYER_REPEATED', callbacks.onPlayerRepeated);
    }

    if (callbacks.onQueueRestored) {
        eventEmitter.on('QUEUE_RESTORED', callbacks.onQueueRestored);
    }

    if (callbacks.onUserFavorite) {
        eventEmitter.on('USER_FAVORITE', callbacks.onUserFavorite);
    }

    if (callbacks.onUserRating) {
        eventEmitter.on('USER_RATING', callbacks.onUserRating);
    }

    return {
        cleanup: () => {
            unsubscribers.forEach((unsubscribe) => unsubscribe());
            if (callbacks.onMediaNext) {
                eventEmitter.off('MEDIA_NEXT', callbacks.onMediaNext);
            }
            if (callbacks.onMediaPrev) {
                eventEmitter.off('MEDIA_PREV', callbacks.onMediaPrev);
            }
            if (callbacks.onPlayerPlay) {
                eventEmitter.off('PLAYER_PLAY', callbacks.onPlayerPlay);
            }
            if (callbacks.onPlayerRepeated) {
                eventEmitter.off('PLAYER_REPEATED', callbacks.onPlayerRepeated);
            }
            if (callbacks.onQueueRestored) {
                eventEmitter.off('QUEUE_RESTORED', callbacks.onQueueRestored);
            }
            if (callbacks.onUserFavorite) {
                eventEmitter.off('USER_FAVORITE', callbacks.onUserFavorite);
            }
            if (callbacks.onUserRating) {
                eventEmitter.off('USER_RATING', callbacks.onUserRating);
            }
        },
    };
}
