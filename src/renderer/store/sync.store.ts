// sync.store.ts — session state for "Listen Together".
//
// Only { enabled, sidecarUrl } is persisted; everything else is runtime. The
// live SyncSocket is kept in a module variable (not in the store) so it never
// gets serialized by `persist`. The hook in features/sync/use-sync-session.ts
// applies inbound transport to the player and emits the host's transport.

import { t } from 'i18next';
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

// Hysteresis for the in-sync/correcting badge: enter "correcting" only past a
// clear divergence, and return to "in sync" only once well back under it. Without
// this the badge flips constantly, because the player's reported position updates
// coarsely (rounded / ~500ms polled) so the measured drift jitters around any
// single threshold.
const SYNC_DIVERGE_MS = 1500;
const SYNC_RECOVER_MS = 600;

export interface SyncSlice extends SyncState {
    actions: {
        approveControlRequest: () => void;
        connect: () => void;
        createRoom: () => void;
        disconnect: () => void;
        dismissControlRequest: () => void;
        joinRoom: (roomId: string) => void;
        leaveRoom: () => void;
        passControl: (toMemberId: string) => void;
        reportDrift: (driftMs: number) => void;
        requestControl: () => void;
        sendTransport: (input: SyncTransportInput) => void;
        setEnabled: (enabled: boolean) => void;
        setFollowing: (following: boolean) => void;
        setSidecarUrl: (url: string) => void;
    };
}

interface SyncState {
    clockOffsetMs: number;
    connected: boolean;
    enabled: boolean;
    // Whether this client applies the host's transport. Followers can toggle this
    // off to detach temporarily (e.g. take a call) without leaving the room.
    following: boolean;
    hostMemberId: string;
    // Signed drift (ms) measured at the last applied sync; positive = we were
    // ahead of the host. Drives the hysteretic `syncing` flag below.
    lastDriftMs: number;
    lastTransport: null | SyncTransport;
    memberId: string;
    members: SyncMember[];
    // A follower's pending request to take control, awaiting the host's decision.
    pendingControlRequest: null | { memberId: string; username: string };
    roomId: string;
    seq: number;
    sidecarUrl: string;
    // Hysteretic "actively catching up" flag for the badge (see thresholds above).
    syncing: boolean;
}

const initialState: SyncState = {
    clockOffsetMs: 0,
    connected: false,
    enabled: false,
    following: true,
    hostMemberId: '',
    lastDriftMs: 0,
    lastTransport: null,
    memberId: '',
    members: [],
    pendingControlRequest: null,
    roomId: '',
    seq: -1,
    sidecarUrl: '',
    syncing: false,
};

export const useSyncStore = createWithEqualityFn<SyncSlice>()(
    persist(
        devtools(
            immer((set, get) => ({
                actions: {
                    approveControlRequest: () => {
                        const req = get().pendingControlRequest;
                        if (req) socket?.passControl(req.memberId);
                        set({ pendingControlRequest: null });
                    },
                    connect: () => {
                        if (socket) return;
                        const server = useAuthStore.getState().currentServer;
                        const url = get().sidecarUrl.trim();
                        if (!server || !url) {
                            toast.error({ message: t('listenTogether.setUrlFirst') });
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
                                onControlRequested: (memberId, username) =>
                                    set({ pendingControlRequest: { memberId, username } }),
                                onError: (message) =>
                                    toast.error({ message, title: t('listenTogether.title') }),
                                onRoomClosed: () =>
                                    set({
                                        following: true,
                                        hostMemberId: '',
                                        lastDriftMs: 0,
                                        lastTransport: null,
                                        members: [],
                                        pendingControlRequest: null,
                                        roomId: '',
                                        seq: -1,
                                        syncing: false,
                                    }),
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
                        set({ following: true });
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
                    dismissControlRequest: () => set({ pendingControlRequest: null }),
                    joinRoom: (roomId: string) => {
                        get().actions.connect();
                        set({ following: true });
                        socket?.joinRoom(roomId.trim().toUpperCase());
                    },
                    leaveRoom: () => {
                        socket?.leaveRoom();
                        set({
                            following: true,
                            hostMemberId: '',
                            lastDriftMs: 0,
                            lastTransport: null,
                            members: [],
                            pendingControlRequest: null,
                            roomId: '',
                            seq: -1,
                            syncing: false,
                        });
                    },
                    passControl: (toMemberId: string) => socket?.passControl(toMemberId),
                    reportDrift: (driftMs: number) => {
                        const mag = Math.abs(driftMs);
                        // Hysteresis so the badge doesn't flip on coarse-position jitter.
                        const syncing = get().syncing
                            ? mag >= SYNC_RECOVER_MS
                            : mag > SYNC_DIVERGE_MS;
                        set({ lastDriftMs: driftMs, syncing });
                    },
                    requestControl: () => socket?.requestControl(),
                    sendTransport: (input: SyncTransportInput) => socket?.sendTransport(input),
                    setEnabled: (enabled: boolean) => {
                        set({ enabled });
                        if (!enabled) get().actions.disconnect();
                    },
                    setFollowing: (following: boolean) => set({ following }),
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

export const useSyncFollowing = () => useSyncStore((state) => state.following);

export const useSyncHealth = () =>
    useSyncStore(
        (state) => ({ clockOffsetMs: state.clockOffsetMs, syncing: state.syncing }),
        shallow,
    );

export const usePendingControlRequest = () => useSyncStore((state) => state.pendingControlRequest);
