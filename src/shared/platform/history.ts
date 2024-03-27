export type HistoryEntry = {
    hash: string;
    key: string;
    pathname: string;
    search: string;
    state: unknown;
};

export type History = {
    action: string;

    block: () => unknown;
    canGo: (x: unknown) => unknown;

    createHref: (entry: HistoryEntry) => string;

    entries: HistoryEntry[];
    length: number;

    /**
     * Add a listener to the History.
     * @param callback The callback to call when the history changes.
     * @returns The unsubscribe callback.
     */
    listen: (
        callback: (event: HistoryEntry) => void | Promise<void>,
    ) => () => void;

    location: HistoryEntry;

    push: (href: string | HistoryEntry) => void;

    replace: (href: string | HistoryEntry) => void;

    goForward: () => void;

    goBack: () => void;
};
