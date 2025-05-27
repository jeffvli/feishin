import merge from 'lodash/merge';
import { nanoid } from 'nanoid/non-secure';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createWithEqualityFn } from 'zustand/traditional';

import { useAlbumArtistListDataStore } from '/@/renderer/store/album-artist-list-data.store';
import { useAlbumListDataStore } from '/@/renderer/store/album-list-data.store';
import { useListStore } from '/@/renderer/store/list.store';
import { ServerListItem } from '/@/shared/types/domain-types';

export interface AuthSlice extends AuthState {
    actions: {
        addServer: (args: ServerListItem) => void;
        deleteServer: (id: string) => void;
        getServer: (id: string) => null | ServerListItem;
        setCurrentServer: (server: null | ServerListItem) => void;
        updateServer: (id: string, args: Partial<ServerListItem>) => void;
    };
}

export interface AuthState {
    currentServer: null | ServerListItem;
    deviceId: string;
    serverList: Record<string, ServerListItem>;
}

export const useAuthStore = createWithEqualityFn<AuthSlice>()(
    persist(
        devtools(
            immer((set, get) => ({
                actions: {
                    addServer: (args) => {
                        set((state) => {
                            state.serverList[args.id] = args;
                        });
                    },
                    deleteServer: (id) => {
                        set((state) => {
                            delete state.serverList[id];

                            if (state.currentServer?.id === id) {
                                state.currentServer = null;
                            }
                        });
                    },
                    getServer: (id) => {
                        const server = get().serverList[id];
                        if (server) return server;
                        return null;
                    },
                    setCurrentServer: (server) => {
                        set((state) => {
                            state.currentServer = server;

                            if (server) {
                                // Reset list filters
                                useListStore.getState()._actions.resetFilter();

                                // Reset persisted grid list stores
                                useAlbumListDataStore.getState().actions.setItemData([]);
                                useAlbumArtistListDataStore.getState().actions.setItemData([]);
                            }
                        });
                    },
                    updateServer: (id: string, args: Partial<ServerListItem>) => {
                        set((state) => {
                            const updatedServer = {
                                ...state.serverList[id],
                                ...args,
                            };

                            state.serverList[id] = updatedServer;
                            state.currentServer = updatedServer;
                        });
                    },
                },
                currentServer: null,
                deviceId: nanoid(),
                serverList: {},
            })),
            { name: 'store_authentication' },
        ),
        {
            merge: (persistedState, currentState) => merge(currentState, persistedState),
            name: 'store_authentication',
            version: 2,
        },
    ),
);

export const useCurrentServerId = () => useAuthStore((state) => state.currentServer)?.id || '';

export const useCurrentServer = () => useAuthStore((state) => state.currentServer);

export const useServerList = () => useAuthStore((state) => state.serverList);

export const useAuthStoreActions = () => useAuthStore((state) => state.actions);

export const getServerById = (id?: string) => {
    if (!id) {
        return null;
    }

    return useAuthStore.getState().actions.getServer(id);
};
