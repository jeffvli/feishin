export type QueueOrder = {
    defaultIds: string[];
    shuffledIndexes: number[];
};

export function removeQueueIds(
    defaultIds: string[],
    shuffledIndexes: number[],
    idsToRemove: string[],
): QueueOrder {
    if (idsToRemove.length === 0) {
        return {
            defaultIds: [...defaultIds],
            shuffledIndexes: [...shuffledIndexes],
        };
    }

    const removedIds = new Set(idsToRemove);
    const oldToNewIndexes = new Map<number, number>();
    const nextDefaultIds: string[] = [];

    defaultIds.forEach((id, oldIndex) => {
        if (!removedIds.has(id)) {
            oldToNewIndexes.set(oldIndex, nextDefaultIds.length);
            nextDefaultIds.push(id);
        }
    });

    const nextShuffledIndexes = shuffledIndexes
        .map((oldIndex) => oldToNewIndexes.get(oldIndex))
        .filter((index): index is number => index !== undefined);

    return {
        defaultIds: nextDefaultIds,
        shuffledIndexes: nextShuffledIndexes,
    };
}

export function shouldRefillQueue(repeat: string): boolean {
    return repeat === 'all';
}
