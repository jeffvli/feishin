import isElectron from 'is-electron';
import merge from 'lodash/merge';
import { nanoid } from 'nanoid/non-secure';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import { ServerListItem, ServerListItemWithCredential } from '/@/shared/types/domain-types';

export interface AuthSlice extends AuthState {
    actions: {
        addServer: (args: ServerListItemWithCredential) => void;
        deleteServer: (id: string) => void;
        getServer: (id: string) => null | ServerListItemWithCredential;
        logout: () => void;
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
                        const server = get().serverList[id];
                        if (isElectron() && window.api?.serverHeaders && server) {
                            if (server.url) {
                                window.api.serverHeaders.clearCookies(server.url).catch(() => {});
                            }
                            if (server.remoteUrl) {
                                window.api.serverHeaders
                                    .clearCookies(server.remoteUrl)
                                    .catch(() => {});
                            }
                        }

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
                    logout: () => {
                        const currentServer = get().currentServer;
                        if (isElectron() && window.api?.serverHeaders && currentServer) {
                            if (currentServer.url) {
                                window.api.serverHeaders
                                    .clearCookies(currentServer.url)
                                    .catch(() => {});
                            }
                            if (currentServer.remoteUrl) {
                                window.api.serverHeaders
                                    .clearCookies(currentServer.remoteUrl)
                                    .catch(() => {});
                            }
                        }

                        set((state) => {
                            const activeServer = state.currentServer;
                            if (!activeServer) {
                                return;
                            }

                            const server = state.serverList[activeServer.id];
                            if (server) {
                                server.credential = '';
                                server.ndCredential = undefined;
                                server.savePassword = false;
                            }

                            state.currentServer = null;
                        });
                    },
                    setCurrentServer: (server) => {
                        set((state) => {
                            state.currentServer = server;
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
                        const existingServer = get().serverList[id];
                        if (
                            isElectron() &&
                            window.api?.serverHeaders &&
                            existingServer &&
                            args.customHeaders !== undefined
                        ) {
                            if (existingServer.url) {
                                window.api.serverHeaders
                                    .clearCookies(existingServer.url)
                                    .catch(() => {});
                            }
                            if (existingServer.remoteUrl) {
                                window.api.serverHeaders
                                    .clearCookies(existingServer.remoteUrl)
                                    .catch(() => {});
                            }
                        }

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

export const useCurrentServerId = (): string =>
    useAuthStore((state) => {
        const currentServer = state.currentServer;

        if (!currentServer) {
            return '';
        }

        return currentServer.id;
    }, shallow);

export const useCurrentServer = () =>
    useAuthStore((state) => {
        if (!state.currentServer) {
            return null;
        }

        return {
            customHeaders: state.currentServer?.customHeaders,
            features: state.currentServer?.features,
            id: state.currentServer?.id,
            isAdmin: state.currentServer?.isAdmin,
            musicFolderId: state.currentServer?.musicFolderId,
            name: state.currentServer?.name,
            preferInstantMix: state.currentServer?.preferInstantMix,
            preferRemoteUrl: state.currentServer?.preferRemoteUrl,
            remoteUrl: state.currentServer?.remoteUrl,
            savePassword: state.currentServer?.savePassword,
            type: state.currentServer?.type,
            url: state.currentServer?.url,
            userId: state.currentServer?.userId,
            username: state.currentServer?.username,
            version: state.currentServer?.version,
        };
    }, shallow) as ServerListItem;

export const useIsAdmin = () =>
    useAuthStore((state) => {
        return {
            isAdmin: state.currentServer?.isAdmin ?? false,
            userId: state.currentServer?.userId,
        };
    }, shallow);

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

export const usePermissions = () => {
    const { isAdmin, userId } = useIsAdmin();

    return {
        playlists: {
            editOwner: isAdmin,
            editPublic: isAdmin,
        },
        radio: {
            create: true,
            delete: isAdmin,
            edit: isAdmin,
        },
        userId: userId,
    };
};

if (isElectron() && window.api?.serverHeaders) {
    const syncServerHeaders = (serverList: Record<string, ServerListItemWithCredential>) => {
        const rules: { baseUrl: string; headers: Record<string, string> }[] = [];
        for (const server of Object.values(serverList || {})) {
            if (server.customHeaders && Object.keys(server.customHeaders).length > 0) {
                if (server.url) {
                    rules.push({ baseUrl: server.url, headers: server.customHeaders });
                }
                if (server.remoteUrl) {
                    rules.push({ baseUrl: server.remoteUrl, headers: server.customHeaders });
                }
            }
        }
        window.api.serverHeaders.sync(rules).catch(() => {});
    };

    // Initial sync
    syncServerHeaders(useAuthStore.getState().serverList);

    // Subscribe to state changes
    useAuthStore.subscribe((state, prevState) => {
        if (state.serverList !== prevState.serverList) {
            syncServerHeaders(state.serverList);
        }
    });
}
