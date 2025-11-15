import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createWithEqualityFn } from 'zustand/traditional';

export interface FolderStoreSlice extends FolderStoreState {
    actions: {
        popPath: () => void;
        pushPath: (path: { id: string; name: string }) => void;
        resetPath: () => void;
        setCurrentFolderId: (id: null | string) => void;
        setPath: (path: Array<{ id: string; name: string }>) => void;
    };
}

export interface FolderStoreState {
    currentFolderId: null | string;
    path: Array<{ id: string; name: string }>;
}

export const useFolderStore = createWithEqualityFn<FolderStoreSlice>()(
    devtools(
        immer((set) => ({
            actions: {
                popPath: () => {
                    set((state) => {
                        if (state.path.length > 0) {
                            state.path.pop();
                            state.currentFolderId =
                                state.path.length > 0 ? state.path[state.path.length - 1].id : null;
                        }
                    });
                },
                pushPath: (pathItem) => {
                    set((state) => {
                        state.path.push(pathItem);
                        state.currentFolderId = pathItem.id;
                    });
                },
                resetPath: () => {
                    set((state) => {
                        state.path = [];
                        state.currentFolderId = null;
                    });
                },
                setCurrentFolderId: (id) => {
                    set((state) => {
                        state.currentFolderId = id;
                    });
                },
                setPath: (path) => {
                    set((state) => {
                        state.path = path;
                        state.currentFolderId = path.length > 0 ? path[path.length - 1].id : null;
                    });
                },
            },
            currentFolderId: null,
            path: [],
        })),
        { name: 'store_folder' },
    ),
);

export const useFolderStoreActions = () => useFolderStore((state) => state.actions);

export const useFolderPath = () =>
    useFolderStore((state) => ({
        currentFolderId: state.currentFolderId,
        path: state.path,
    }));
