import merge from 'lodash/merge';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createWithEqualityFn } from 'zustand/traditional';

import { LogCategory, logFn } from '/@/renderer/utils/logger';
import { logMsg } from '/@/renderer/utils/logger-message';
import { toast } from '/@/shared/components/toast/toast';
import { ClientEvent, ServerEvent, SongUpdateSocket } from '/@/shared/types/remote-types';

export interface SettingsSlice extends SettingsState {
    actions: {
        reconnect: () => void;
        send: (data: ClientEvent) => void;
        toggleIsDark: () => void;
        toggleShowImage: () => void;
    };
}

interface SettingsState {
    connected: boolean;
    info: Omit<SongUpdateSocket, 'currentTime'>;
    isDark: boolean;
    showImage: boolean;
    socket?: StatefulWebSocket;
}

interface StatefulWebSocket extends WebSocket {
    natural: boolean;
}

const initialState: SettingsState = {
    connected: false,
    info: {},
    isDark: window.matchMedia('(prefers-color-scheme: dark)').matches,
    showImage: true,
};

export const useRemoteStore = createWithEqualityFn<SettingsSlice>()(
    persist(
        devtools(
            immer((set, get) => ({
                actions: {
                    reconnect: async () => {
                        logFn.debug(logMsg[LogCategory.REMOTE].reconnectInitiated, {
                            category: LogCategory.REMOTE,
                        });
                        const existing = get().socket;

                        if (existing) {
                            if (
                                existing.readyState === WebSocket.OPEN ||
                                existing.readyState === WebSocket.CONNECTING
                            ) {
                                logFn.debug(logMsg[LogCategory.REMOTE].closingExistingSocket, {
                                    category: LogCategory.REMOTE,
                                    meta: { readyState: existing.readyState },
                                });
                                existing.natural = true;
                                existing.close(4001);
                            }
                        }

                        let authHeader: string | undefined;

                        try {
                            logFn.debug(logMsg[LogCategory.REMOTE].fetchingCredentials, {
                                category: LogCategory.REMOTE,
                            });
                            const credentials = await fetch('/credentials');
                            authHeader = await credentials.text();
                            logFn.debug(logMsg[LogCategory.REMOTE].credentialsFetched, {
                                category: LogCategory.REMOTE,
                                meta: { hasAuthHeader: !!authHeader },
                            });
                        } catch (error) {
                            logFn.error(logMsg[LogCategory.REMOTE].failedToGetCredentials, {
                                category: LogCategory.REMOTE,
                                meta: { error },
                            });
                        }

                        set((state) => {
                            const wsUrl = location.href.replace('http', 'ws');
                            logFn.debug(logMsg[LogCategory.REMOTE].creatingWebSocket, {
                                category: LogCategory.REMOTE,
                                meta: { url: wsUrl },
                            });
                            const socket = new WebSocket(wsUrl) as StatefulWebSocket;

                            socket.natural = false;

                            socket.addEventListener('message', (message) => {
                                const { data, event } = JSON.parse(message.data) as ServerEvent;

                                logFn.debug(logMsg[LogCategory.REMOTE].webSocketMessageReceived, {
                                    category: LogCategory.REMOTE,
                                    meta: { data, event },
                                });

                                switch (event) {
                                    case 'error': {
                                        logFn.error(
                                            logMsg[LogCategory.REMOTE].webSocketErrorEvent,
                                            {
                                                category: LogCategory.REMOTE,
                                                meta: { data },
                                            },
                                        );
                                        toast.error({ message: data, title: 'Socket error' });
                                        break;
                                    }
                                    case 'favorite': {
                                        logFn.debug(
                                            logMsg[LogCategory.REMOTE].favoriteEventReceived,
                                            {
                                                category: LogCategory.REMOTE,
                                                meta: {
                                                    favorite: data.favorite,
                                                    id: data.id,
                                                },
                                            },
                                        );
                                        set((state) => {
                                            if (state.info.song?.id === data.id) {
                                                state.info.song.userFavorite = data.favorite;
                                            }
                                        });
                                        break;
                                    }
                                    case 'playback': {
                                        logFn.debug(
                                            logMsg[LogCategory.REMOTE].playbackEventReceived,
                                            {
                                                category: LogCategory.REMOTE,
                                                meta: { status: data },
                                            },
                                        );
                                        set((state) => {
                                            state.info.status = data;
                                        });
                                        break;
                                    }
                                    case 'position': {
                                        logFn.debug(
                                            logMsg[LogCategory.REMOTE].positionEventReceived,
                                            {
                                                category: LogCategory.REMOTE,
                                                meta: { position: data },
                                            },
                                        );
                                        set((state) => {
                                            state.info.position = data;
                                        });
                                        break;
                                    }
                                    case 'proxy': {
                                        logFn.debug(logMsg[LogCategory.REMOTE].proxyEventReceived, {
                                            category: LogCategory.REMOTE,
                                            meta: {
                                                dataLength: data?.length,
                                                hasData: !!data,
                                            },
                                        });
                                        set((state) => {
                                            if (state.info.song) {
                                                state.info.song.imageUrl = `data:image/jpeg;base64,${data}`;
                                            }
                                        });
                                        break;
                                    }
                                    case 'rating': {
                                        logFn.debug(
                                            logMsg[LogCategory.REMOTE].ratingEventReceived,
                                            {
                                                category: LogCategory.REMOTE,
                                                meta: {
                                                    id: data.id,
                                                    rating: data.rating,
                                                },
                                            },
                                        );
                                        set((state) => {
                                            if (state.info.song?.id === data.id) {
                                                state.info.song.userRating = data.rating;
                                            }
                                        });
                                        break;
                                    }
                                    case 'repeat': {
                                        logFn.debug(
                                            logMsg[LogCategory.REMOTE].repeatEventReceived,
                                            {
                                                category: LogCategory.REMOTE,
                                                meta: { repeat: data },
                                            },
                                        );
                                        set((state) => {
                                            state.info.repeat = data;
                                        });
                                        break;
                                    }
                                    case 'shuffle': {
                                        logFn.debug(
                                            logMsg[LogCategory.REMOTE].shuffleEventReceived,
                                            {
                                                category: LogCategory.REMOTE,
                                                meta: { shuffle: data },
                                            },
                                        );
                                        set((state) => {
                                            state.info.shuffle = data;
                                        });
                                        break;
                                    }
                                    case 'song': {
                                        logFn.debug(logMsg[LogCategory.REMOTE].songEventReceived, {
                                            category: LogCategory.REMOTE,
                                            meta: {
                                                artistName: data?.artistName,
                                                id: data?.id,
                                                name: data?.name,
                                            },
                                        });
                                        set((state) => {
                                            state.info.song = data;
                                        });
                                        break;
                                    }
                                    case 'state': {
                                        logFn.debug(logMsg[LogCategory.REMOTE].stateEventReceived, {
                                            category: LogCategory.REMOTE,
                                            meta: {
                                                hasSong: !!data.song,
                                                position: data.position,
                                                status: data.status,
                                                volume: data.volume,
                                            },
                                        });
                                        set((state) => {
                                            state.info = data;
                                        });
                                        break;
                                    }
                                    case 'volume': {
                                        logFn.debug(
                                            logMsg[LogCategory.REMOTE].volumeEventReceived,
                                            {
                                                category: LogCategory.REMOTE,
                                                meta: { volume: data },
                                            },
                                        );
                                        set((state) => {
                                            state.info.volume = data;
                                        });
                                    }
                                }
                            });

                            socket.addEventListener('open', () => {
                                logFn.debug(logMsg[LogCategory.REMOTE].webSocketOpened, {
                                    category: LogCategory.REMOTE,
                                    meta: {
                                        hasAuthHeader: !!authHeader,
                                        readyState: socket.readyState,
                                    },
                                });
                                if (authHeader) {
                                    logFn.debug(logMsg[LogCategory.REMOTE].sendingAuthentication, {
                                        category: LogCategory.REMOTE,
                                    });
                                    socket.send(
                                        JSON.stringify({
                                            event: 'authenticate',
                                            header: authHeader,
                                        }),
                                    );
                                }
                                set({ connected: true });
                            });

                            socket.addEventListener('close', (reason) => {
                                logFn.debug(logMsg[LogCategory.REMOTE].webSocketClosed, {
                                    category: LogCategory.REMOTE,
                                    meta: {
                                        code: reason.code,
                                        natural: socket.natural,
                                        reason: reason.reason,
                                        wasClean: reason.wasClean,
                                    },
                                });
                                if (reason.code === 4002 || reason.code === 4003) {
                                    logFn.debug(logMsg[LogCategory.REMOTE].reloadingPage, {
                                        category: LogCategory.REMOTE,
                                        meta: { code: reason.code },
                                    });
                                    location.reload();
                                } else if (reason.code === 4000) {
                                    logFn.warn(logMsg[LogCategory.REMOTE].serverIsDown, {
                                        category: LogCategory.REMOTE,
                                    });
                                    toast.warn({
                                        message: 'Feishin remote server is down',
                                        title: 'Connection closed',
                                    });
                                } else if (reason.code !== 4001 && !socket.natural) {
                                    logFn.error(
                                        logMsg[LogCategory.REMOTE].socketClosedUnexpectedly,
                                        {
                                            category: LogCategory.REMOTE,
                                            meta: {
                                                code: reason.code,
                                                reason: reason.reason,
                                            },
                                        },
                                    );
                                    toast.error({
                                        message: 'Socket closed for unexpected reason',
                                        title: 'Connection closed',
                                    });
                                }

                                if (!socket.natural) {
                                    set({ connected: false, info: {} });
                                }
                            });

                            state.socket = socket;
                        });
                    },
                    send: (data: ClientEvent) => {
                        const socket = get().socket;
                        if (socket) {
                            logFn.debug(logMsg[LogCategory.REMOTE].sendingEventToServer, {
                                category: LogCategory.REMOTE,
                                meta: {
                                    data: data,
                                    event: data.event,
                                    readyState: socket.readyState,
                                },
                            });
                            socket.send(JSON.stringify(data));
                        } else {
                            logFn.warn(logMsg[LogCategory.REMOTE].cannotSendEvent, {
                                category: LogCategory.REMOTE,
                                meta: { event: data.event },
                            });
                        }
                    },
                    toggleIsDark: () => {
                        set((state) => {
                            state.isDark = !state.isDark;
                        });
                    },
                    toggleShowImage: () => {
                        set((state) => {
                            state.showImage = !state.showImage;
                        });
                    },
                },
                ...initialState,
            })),
            { name: 'store_settings' },
        ),
        {
            merge: (persistedState, currentState) => merge(currentState, persistedState),
            name: 'store_settings',
            version: 7,
        },
    ),
);

export const useConnected = () => useRemoteStore((state) => state.connected);

export const useInfo = () => useRemoteStore((state) => state.info);

export const useIsDark = () => useRemoteStore((state) => state.isDark);

export const useReconnect = () => useRemoteStore((state) => state.actions.reconnect);

export const useShowImage = () => useRemoteStore((state) => state.showImage);

export const useSend = () => useRemoteStore((state) => state.actions.send);

export const useToggleDark = () => useRemoteStore((state) => state.actions.toggleIsDark);

export const useToggleShowImage = () => useRemoteStore((state) => state.actions.toggleShowImage);
