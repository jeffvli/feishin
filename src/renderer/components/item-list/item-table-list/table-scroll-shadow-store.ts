export interface TableScrollShadowSnapshot {
    showLeftShadow: boolean;
    showRightShadow: boolean;
    showTopShadow: boolean;
}

export type TableScrollShadowStore = ReturnType<typeof createTableScrollShadowStore>;

export function createTableScrollShadowStore() {
    let snapshot: TableScrollShadowSnapshot = {
        showLeftShadow: false,
        showRightShadow: false,
        showTopShadow: false,
    };
    const listeners = new Set<() => void>();

    return {
        getSnapshot: (): TableScrollShadowSnapshot => snapshot,
        setSnapshot: (patch: Partial<TableScrollShadowSnapshot>) => {
            const next: TableScrollShadowSnapshot = { ...snapshot, ...patch };
            if (
                next.showLeftShadow === snapshot.showLeftShadow &&
                next.showRightShadow === snapshot.showRightShadow &&
                next.showTopShadow === snapshot.showTopShadow
            ) {
                return;
            }
            snapshot = next;
            listeners.forEach((l) => l());
        },
        subscribe: (listener: () => void) => {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
    };
}
