import { shuffleInPlace } from '/@/renderer/utils/shuffle';
import { QueueData, QueueSong } from '/@/shared/types/domain-types';
import { PlayerRepeat, PlayerShuffle } from '/@/shared/types/types';

type UpNextState = {
    player: { index: number; shuffle: PlayerShuffle };
    queue: Pick<QueueData, 'default' | 'priority' | 'shuffled'>;
};

// Helper function to add new indexes to shuffled array after current position
export function addIndexesToShuffled(
    shuffled: number[],
    currentShuffledIndex: number,
    newIndexes: number[],
): number[] {
    // Keep everything before and including current position
    const beforeCurrent = shuffled.slice(0, currentShuffledIndex + 1);
    // Shuffle everything after current position plus new indexes
    const afterCurrent = shuffled.slice(currentShuffledIndex + 1);
    const toShuffle = [...afterCurrent, ...newIndexes];
    return [...beforeCurrent, ...shuffleInPlace(toShuffle)];
}

// Helper function to adjust shuffled indexes when items are inserted
export function adjustShuffledIndexesForInsertion(
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
export function calculateNextIndex(
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

const sameIds = <T>(a: T[], b: T[]) => a.length === b.length && a.every((v, i) => v === b[i]);

// After songs are dragged or moved in the queue: Up Next songs moved out of the section become
// normal queue items, and moved songs dropped inside it (directly after the current song, after
// a Queue item pinned above the section, or after another Up Next song) join it.
export function regroupUpNextQueue(
    state: UpNextState,
    currentId: string | undefined,
    movedIds: string[],
    upNextEnabled: boolean,
): void {
    if (state.queue.priority.length === 0) return;

    const moved = new Set(movedIds);
    const kept = new Set(state.queue.priority.filter((id) => !moved.has(id)));

    // Queue items can be pinned between the current song and the Up Next block (dropped on the
    // bottom of the first Queue section). While sitting there they keep the Up Next run going,
    // so a song dropped just above the section still joins it.
    const lastKeptIndex = [...kept].reduce((last, id) => {
        const index = state.queue.default.indexOf(id);
        return index > last ? index : last;
    }, -1);

    const upNext: string[] = [];
    let previousIsUpNext = false;

    state.queue.default.forEach((id, index) => {
        if (id === currentId) {
            previousIsUpNext = true;
            return;
        }

        if (kept.has(id)) {
            previousIsUpNext = true;
            upNext.push(id);
            return;
        }

        if (moved.has(id)) {
            if (previousIsUpNext) upNext.push(id);
            return;
        }

        previousIsUpNext = previousIsUpNext && index < lastKeptIndex;
    });

    state.queue.priority = upNext;
    syncUpNextQueue(state, upNextEnabled);
}

// Keeps the Up Next songs (queue.priority) as a contiguous block after the current song, in
// both the displayed order and the shuffled play order. Queue items pinned between the current
// song and the block are left in place. Songs that are playing or were removed from the queue
// leave Up Next.
export function syncUpNextQueue(state: UpNextState, upNextEnabled: boolean): void {
    const { player, queue } = state;
    if (queue.priority.length === 0) return;

    if (!upNextEnabled) {
        queue.priority = [];
        return;
    }

    const shuffle = isShuffleEnabled(state);
    const playOrder = shuffle ? queue.shuffled.map((i) => queue.default[i]) : queue.default;
    const currentId: string | undefined = playOrder[player.index];
    const inQueue = new Set(queue.default);
    const upNext = queue.priority.filter((id) => id !== currentId && inQueue.has(id));
    const upNextSet = new Set(upNext);

    const placeAfterCurrent = (ids: string[]) => {
        const rest = ids.filter((id) => !upNextSet.has(id));
        const at = currentId === undefined ? 0 : rest.indexOf(currentId) + 1;
        return [...rest.slice(0, at), ...upNext, ...rest.slice(at)];
    };

    // The block stays put only while it sits in front of the current song (queue items pinned
    // between them are allowed). Playing a song at or below the block settles it: the played song
    // and every queue song above it move in front of Up Next, so Up Next keeps playing next.
    const blockIsInFrontOfCurrent = (ids: string[]) => {
        if (upNext.length === 0) return false;

        const start = ids.indexOf(upNext[0]);
        if (start === -1 || !upNext.every((id, offset) => ids[start + offset] === id)) return false;

        const currentIndex = currentId === undefined ? -1 : ids.indexOf(currentId);
        return start > currentIndex;
    };
    const settle = (ids: string[]) => (blockIsInFrontOfCurrent(ids) ? ids : placeAfterCurrent(ids));

    if (!sameIds(upNext, queue.priority)) queue.priority = upNext;

    const newDefault = settle(queue.default);
    if (!sameIds(newDefault, queue.default)) queue.default = newDefault;

    if (shuffle) {
        const newPlayOrder = settle(playOrder);
        const position = new Map(queue.default.map((id, i) => [id, i]));
        const newShuffled = newPlayOrder.map((id) => position.get(id)!);
        if (!sameIds(newShuffled, queue.shuffled)) queue.shuffled = newShuffled;
        if (currentId !== undefined) player.index = newPlayOrder.indexOf(currentId);
    } else if (currentId !== undefined) {
        player.index = newDefault.indexOf(currentId);
    }
}
