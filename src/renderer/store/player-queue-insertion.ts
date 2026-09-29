export type QueueInsertionEdge = 'bottom' | 'top';

export function insertQueueIdsAtTarget(
    playbackIds: string[],
    insertedIds: string[],
    targetId: string,
    edge: QueueInsertionEdge,
): string[] {
    const targetIndex = playbackIds.indexOf(targetId);

    if (targetIndex === -1 || insertedIds.length === 0) {
        return playbackIds;
    }

    const insertIndex = edge === 'top' ? targetIndex : targetIndex + 1;

    return [
        ...playbackIds.slice(0, insertIndex),
        ...insertedIds,
        ...playbackIds.slice(insertIndex),
    ];
}
