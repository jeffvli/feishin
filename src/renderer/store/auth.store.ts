import merge from 'lodash/merge';
import { nanoid } from 'nanoid/non-secure';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import { useAlbumArtistListDataStore } from '/@/renderer/store/album-artist-list-data.store';
import { useAlbumListDataStore } from '/@/renderer/store/album-list-data.store';
import { useListStore } from '/@/renderer/store/list.store';
import { ServerListItem, ServerListItemWithCredential } from '/@/shared/types/domain-types';

export interface AuthSlice extends AuthState {
    actions: {
        addServer: (args: ServerListItemWithCredential) => void;
        deleteServer: (id: string) => void;
        getServer: (id: string) => null | ServerListItemWithCredential;
        setCurrentServer: (server: null | ServerListItemWithCredential) => void;
        setMusicFolderId: (musicFolderId: string[] | undefined) => void;
        updateServer: (id: string, args: Partial<ServerListItemWithCredential>) => void;
    };
}

export interface AuthState {
    currentServer: null | ServerListItemWithCredential;
    deviceId: string;
    serverList: Record<string, ServerListItemWithCredential>;
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
                    setMusicFolderId: (musicFolderId: string[] | undefined) => {
                        set((state) => {
                            if (state.currentServer) {
                                state.currentServer.musicFolderId = musicFolderId;
                                const serverId = state.currentServer.id;
                                if (state.serverList[serverId]) {
                                    state.serverList[serverId].musicFolderId = musicFolderId;
                                }
                            }
                        });
                    },
                    updateServer: (id: string, args: Partial<ServerListItemWithCredential>) => {
                        set((state) => {
                            const updatedServer = {
                                ...state.serverList[id],
                                ...args,
                            };

                            if (
                                state.currentServer?.id === id &&
                                !('musicFolderId' in args) &&
                                state.currentServer.musicFolderId !== undefined
                            ) {
                                updatedServer.musicFolderId = state.currentServer.musicFolderId;
                            }

                            state.serverList[id] = updatedServer;
                            if (state.currentServer?.id === id) {
                                state.currentServer = updatedServer;
                            }
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

export const useCurrentServer = () =>
    useAuthStore((state) => {
        return {
            features: state.currentServer?.features,
            id: state.currentServer?.id,
            musicFolderId: state.currentServer?.musicFolderId,
            name: state.currentServer?.name,
            preferInstantMix: state.currentServer?.preferInstantMix,
            savePassword: state.currentServer?.savePassword,
            type: state.currentServer?.type,
            url: state.currentServer?.url,
            userId: state.currentServer?.userId,
            username: state.currentServer?.username,
            version: state.currentServer?.version,
        };
    }, shallow) as ServerListItem;

export const useCurrentServerWithCredential = () =>
    useAuthStore((state) => state.currentServer) as ServerListItemWithCredential;

export const useServerList = () => useAuthStore((state) => state.serverList);

export const useAuthStoreActions = () => useAuthStore((state) => state.actions);

export const getServerById = (id?: string) => {
    if (!id) {
        return null;
    }

    return useAuthStore.getState().actions.getServer(id);
};
