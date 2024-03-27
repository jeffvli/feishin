export type LibraryAPI = {
    add: (param: { uris: string[]; silent?: boolean }) => Promise<void>;
    remove: (param: { uris: string[]; silent?: boolean }) => Promise<void>;

    /**
     * Check if an URI is in the library using the cache.
     * If the item is not in the cache, return undefined.
     * @param uri
     * @returns
     */
    containsSync: (uri: string) => boolean | undefined;
    contains: (...uris: string[]) => Promise<boolean[]>;

    getEvents: () => LibraryAPIEventManager;
};

export type LibraryAPIEventType = 'operation_complete';

export type LibraryAPIEventManager = {
    addListener: (
        type: LibraryAPIEventType,
        listener: (event: LibraryAPIEvent<any>) => void,
    ) => LibraryAPIEventManager;

    removeListener: (
        type: LibraryAPIEventType,
        listener: (event: LibraryAPIEvent<any>) => void,
    ) => LibraryAPIEventManager;
};

export type LibraryAPIEvent<T> = {
    defaultPrevented: boolean;
    immediateStopped: boolean;
    stopped: boolean;
    type: LibraryAPIEventType;
    data: T;
};

export type LibraryAPIOperationCompleteEvent = LibraryAPIEvent<{
    operation: 'add' | 'remove';
    uris: string[];
    error: null | unknown;
    silent: boolean;
}>;
