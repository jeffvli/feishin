// sync.store.ts — session state for "Listen Together".
//
// Only { enabled, sidecarUrl } is persisted; everything else is runtime. The
// live SyncSocket is kept in a module variable (not in the store) so it never
// gets serialized by `persist`. The hook in features/sync/use-sync-session.ts
// applies inbound transport to the player and emits the host's transport.

import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';

import { SyncSocket } from '/@/renderer/api/sync/sync-client';
import { useAuthStore } from '/@/renderer/store/auth.store';
import { toast } from '/@/shared/components/toast/toast';
import {
    SyncMember,
    SyncRoomState,
    SyncTransport,
    SyncTransportInput,
} from '/@/shared/types/sync-types';

let socket: SyncSocket | undefined;

export interface SyncSlice extends SyncState {
    actions: {
        connect: () => void;
        createRoom: () => void;
        disconnect: () => void;
        joinRoom: (roomId: string) => void;
        leaveRoom: () => void;
        passControl: (toMemberId: string) => void;
        requestControl: () => void;
        sendTransport: (input: SyncTransportInput) => void;
        setEnabled: (enabled: boolean) => void;
        setSidecarUrl: (url: string) => void;
    };
}

interface SyncState {
    clockOffsetMs: number;
    connected: boolean;
    enabled: boolean;
    hostMemberId: string;
    lastTransport: null | SyncTransport;
    memberId: string;
    members: SyncMember[];
    roomId: string;
    seq: number;
    sidecarUrl: string;
}

const initialState: SyncState = {
    clockOffsetMs: 0,
    connected: false,
    enabled: false,
    hostMemberId: '',
    lastTransport: null,
    memberId: '',
    members: [],
    roomId: '',
    seq: -1,
    sidecarUrl: '',
};

export const useSyncStore = createWithEqualityFn<SyncSlice>()(
    persist(
        devtools(
            immer((set, get) => ({
                actions: {
                    connect: () => {
                        if (socket) return;
                        const server = useAuthStore.getState().currentServer;
                        const url = get().sidecarUrl.trim();
                        if (!server || !url) {
                            toast.error({ message: 'Set a sidecar URL and select a server first' });
                            return;
                        }
                        const wsUrl = url.replace(/^http/, 'ws').replace(/\/$/, '') + '/ws';
                        socket = new SyncSocket(
                            wsUrl,
                            { credential: server.credential, serverUrl: server.url },
                            {
                                onAuthenticated: (memberId) => set({ memberId }),
                                onClockOffset: (clockOffsetMs) => set({ clockOffsetMs }),
                                onConnectedChange: (connected) => set({ connected }),
                                onControlRequested: (_id, username) =>
                                    toast.info({
                                        message: `${username} requested control`,
                                        title: 'Listen Together',
                                    }),
                                onError: (message) =>
                                    toast.error({ message, title: 'Listen Together' }),
                                onRoomState: (rs: SyncRoomState) => {
                                    set({
                                        hostMemberId: rs.hostMemberId,
                                        lastTransport: rs.transport,
                                        members: rs.members,
                                        roomId: rs.roomId,
                                        seq: rs.seq,
                                    });
                                },
                            },
                        );
                        socket.connect();
                    },
                    createRoom: () => {
                        get().actions.connect();
                        socket?.createRoom();
                    },
                    disconnect: () => {
                        socket?.close();
                        socket = undefined;
                        set({
                            ...initialState,
                            enabled: get().enabled,
                            sidecarUrl: get().sidecarUrl,
                        });
                    },
                    joinRoom: (roomId: string) => {
                        get().actions.connect();
                        socket?.joinRoom(roomId.trim().toUpperCase());
                    },
                    leaveRoom: () => {
                        socket?.leaveRoom();
                        set({
                            hostMemberId: '',
                            lastTransport: null,
                            members: [],
                            roomId: '',
                            seq: -1,
                        });
                    },
                    passControl: (toMemberId: string) => socket?.passControl(toMemberId),
                    requestControl: () => socket?.requestControl(),
                    sendTransport: (input: SyncTransportInput) => socket?.sendTransport(input),
                    setEnabled: (enabled: boolean) => {
                        set({ enabled });
                        if (!enabled) get().actions.disconnect();
                    },
                    setSidecarUrl: (sidecarUrl: string) => set({ sidecarUrl }),
                },
                ...initialState,
            })),
            { name: 'store_sync' },
        ),
        {
            name: 'store_sync',
            partialize: (state) => ({ enabled: state.enabled, sidecarUrl: state.sidecarUrl }),
            version: 1,
        },
    ),
);

export const useSyncActions = () => useSyncStore((state) => state.actions);

export const useSyncConnected = () => useSyncStore((state) => state.connected);

export const useSyncRoom = () =>
    useSyncStore(
        (state) => ({
            connected: state.connected,
            hostMemberId: state.hostMemberId,
            isHost: !!state.memberId && state.memberId === state.hostMemberId,
            memberId: state.memberId,
            members: state.members,
            roomId: state.roomId,
        }),
        shallow,
    );

export const useSyncSettings = () =>
    useSyncStore((state) => ({ enabled: state.enabled, sidecarUrl: state.sidecarUrl }), shallow);

export const useIsSyncHost = () =>
    useSyncStore((state) => !!state.memberId && state.memberId === state.hostMemberId);
