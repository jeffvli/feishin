export type RestoredQueueHistory = {
    consumedIds: string[];
    defaultIds: string[];
    restoredId?: string;
    shuffledIndexes: number[];
};

export function restorePreviousConsumedId(
    defaultIds: string[],
    shuffledIndexes: number[],
    consumedIds: string[],
    availableIds: ReadonlySet<string>,
    shuffleEnabled: boolean,
): RestoredQueueHistory {
    const defaultIdSet = new Set(defaultIds);
    let historyIndex = consumedIds.length - 1;

    while (
        historyIndex >= 0 &&
        (!availableIds.has(consumedIds[historyIndex]) ||
            defaultIdSet.has(consumedIds[historyIndex]))
    ) {
        historyIndex--;
    }

    if (historyIndex < 0) {
        return {
            consumedIds: [],
            defaultIds: [...defaultIds],
            shuffledIndexes: [...shuffledIndexes],
        };
    }

    const restoredId = consumedIds[historyIndex];
    const nextDefaultIds = [restoredId, ...defaultIds];
    const nextShuffledIndexes = shuffleEnabled
        ? [0, ...shuffledIndexes.map((index) => index + 1)]
        : [];

    return {
        consumedIds: consumedIds.slice(0, historyIndex),
        defaultIds: nextDefaultIds,
        restoredId,
        shuffledIndexes: nextShuffledIndexes,
    };
}
