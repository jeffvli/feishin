type MusicFolderAccessResolution = {
    clearQueue: boolean;
    deferred: boolean;
    replacementIds: string[] | undefined;
};

export function resolveMusicFolderAccessChange({
    availableIds,
    isPlaying,
    selectedIds,
}: {
    availableIds: string[];
    isPlaying: boolean;
    selectedIds: string[];
}): MusicFolderAccessResolution | null {
    const availableIdSet = new Set(availableIds);
    const accessibleSelectedIds = selectedIds.filter((id) => availableIdSet.has(id));
    const lostFolderAccess = accessibleSelectedIds.length < selectedIds.length;
    const needsInitialSelection = selectedIds.length === 0 && availableIds.length === 1;

    if (!lostFolderAccess && !needsInitialSelection) {
        return null;
    }

    const replacementIds =
        accessibleSelectedIds.length > 0
            ? accessibleSelectedIds
            : availableIds[0]
              ? [availableIds[0]]
              : undefined;

    return {
        clearQueue: lostFolderAccess && !isPlaying,
        deferred: lostFolderAccess && isPlaying,
        replacementIds,
    };
}
