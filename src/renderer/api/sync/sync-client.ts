// SyncSocket: the low-level WebSocket client for the listen-together server.
// It owns the connection lifecycle, authentication, NTP-style clock sync, and
// reconnect. It is framework-agnostic (no React, no store) — sync.store.ts wraps
// it and exposes the session to the UI.
//
// Modeled on Feishin's existing remote-control client (src/remote/store/index.ts).

import {
    SyncClientEvent,
    SyncRoomState,
    SyncServerEvent,
    SyncTransportInput,
} from '/@/shared/types/sync-types';

export interface SyncCredentials {
    // The Subsonic credential string Feishin stores: "u=<user>&s=<salt>&t=<token>".
    credential: string;
    serverUrl: string;
}

export interface SyncSocketCallbacks {
    onAuthenticated?: (memberId: string) => void;
    onClockOffset?: (offsetMs: number) => void;
    onConnectedChange?: (connected: boolean) => void;
    onControlRequested?: (fromMemberId: string, fromUsername: string) => void;
    onError?: (message: string) => void;
    // Fired when a pending create/join fails (e.g. the room was reaped while we
    // were briefly disconnected). The consumer should clear its room state.
    onRoomClosed?: () => void;
    onRoomState?: (state: SyncRoomState) => void;
}

interface StatefulWebSocket extends WebSocket {
    natural: boolean;
}

const PING_INTERVAL_MS = 10_000;
const MAX_BACKOFF_MS = 15_000;
// How long a min-RTT clock sample stays "best". Within the window the lowest-RTT
// sample wins (most accurate offset); past it we take the next sample regardless
// so the offset keeps re-converging as machine clocks drift over a long session.
const CLOCK_SAMPLE_TTL_MS = 60_000;

export class SyncSocket {
    get clockOffsetMs(): number {
        return this.best.offset;
    }
    get currentMemberId(): string {
        return this.memberId;
    }
    private backoff = 1000;
    private best = { offset: 0, rtt: Number.POSITIVE_INFINITY };
    private bestAt = 0;
    private readonly callbacks: SyncSocketCallbacks;
    private closedByUser = false;
    private creds: SyncCredentials;
    private desired: { roomId?: string; type: 'create' | 'join' | 'none' } = { type: 'none' };
    private memberId = '';
    // True between sending a create/join and getting the resulting roomState, so a
    // failure in that window can be surfaced as a room-closed event.
    private pendingRoomOp = false;
    private pingTimer?: ReturnType<typeof setInterval>;
    private reconnectTimer?: ReturnType<typeof setTimeout>;

    private socket?: StatefulWebSocket;

    private readonly url: string;

    constructor(url: string, creds: SyncCredentials, callbacks: SyncSocketCallbacks) {
        this.url = url;
        this.creds = creds;
        this.callbacks = callbacks;
    }

    close(): void {
        this.closedByUser = true;
        this.clearTimers();
        if (this.socket) {
            this.socket.natural = true;
            this.socket.close();
            this.socket = undefined;
        }
        this.callbacks.onConnectedChange?.(false);
    }

    connect(): void {
        this.closedByUser = false;
        this.open();
    }

    createRoom(): void {
        this.desired = { type: 'create' };
        this.pendingRoomOp = true;
        this.send({ event: 'createRoom' });
    }

    joinRoom(roomId: string): void {
        this.desired = { roomId, type: 'join' };
        this.pendingRoomOp = true;
        this.send({ data: { roomId }, event: 'joinRoom' });
    }

    leaveRoom(): void {
        this.desired = { type: 'none' };
        this.pendingRoomOp = false;
        this.send({ event: 'leaveRoom' });
    }

    passControl(toMemberId: string): void {
        this.send({ data: { toMemberId }, event: 'passControl' });
    }

    requestControl(): void {
        this.send({ event: 'requestControl' });
    }

    sendTransport(input: SyncTransportInput): void {
        // Stamp a fresh monotonic clock at actual send time so the server can
        // drop transports that arrive out of order.
        this.send({ data: { ...input, clientTimeMs: Date.now() }, event: 'transport' });
    }

    private clearTimers(): void {
        if (this.pingTimer) clearInterval(this.pingTimer);
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
        this.pingTimer = undefined;
        this.reconnectTimer = undefined;
    }

    private handleMessage(raw: string): void {
        let msg: SyncServerEvent;
        try {
            msg = JSON.parse(raw) as SyncServerEvent;
        } catch {
            return;
        }
        switch (msg.event) {
            case 'authenticated': {
                this.memberId = msg.data.memberId;
                this.callbacks.onAuthenticated?.(msg.data.memberId);
                this.startClockSync();
                // Re-establish room membership after a reconnect.
                if (this.desired.type === 'create') {
                    this.pendingRoomOp = true;
                    this.send({ event: 'createRoom' });
                } else if (this.desired.type === 'join' && this.desired.roomId) {
                    this.pendingRoomOp = true;
                    this.send({ data: { roomId: this.desired.roomId }, event: 'joinRoom' });
                }
                break;
            }
            case 'controlRequested':
                this.callbacks.onControlRequested?.(msg.data.fromMemberId, msg.data.fromUsername);
                break;
            case 'error':
                this.callbacks.onError?.(msg.data.message);
                // A failure while a create/join is in flight (e.g. the room was
                // reaped during a brief disconnect) means we have no valid room:
                // stop trying to rejoin it and tell the consumer to clear state.
                if (this.pendingRoomOp) {
                    this.pendingRoomOp = false;
                    this.desired = { type: 'none' };
                    this.callbacks.onRoomClosed?.();
                }
                break;
            case 'pong': {
                const t2 = Date.now();
                const rtt = t2 - msg.data.t0;
                const offset = msg.data.serverTimeMs - (msg.data.t0 + t2) / 2;
                // Take the sample if it has a lower RTT (more accurate) or if the
                // current best has aged out, so the offset re-converges over time.
                const stale = t2 - this.bestAt > CLOCK_SAMPLE_TTL_MS;
                if (rtt < this.best.rtt || stale) {
                    this.best = { offset, rtt };
                    this.bestAt = t2;
                    this.callbacks.onClockOffset?.(offset);
                }
                break;
            }
            case 'roomState':
                this.pendingRoomOp = false;
                this.callbacks.onRoomState?.(msg.data);
                break;
        }
    }

    private open(): void {
        const socket = new WebSocket(this.url) as StatefulWebSocket;
        socket.natural = false;
        this.socket = socket;

        socket.addEventListener('open', () => {
            this.backoff = 1000;
            const params = new URLSearchParams(this.creds.credential);
            this.send({
                data: {
                    salt: params.get('s') ?? undefined,
                    serverUrl: this.creds.serverUrl,
                    token: params.get('t') ?? undefined,
                    username: params.get('u') ?? '',
                },
                event: 'authenticate',
            });
            this.callbacks.onConnectedChange?.(true);
        });

        socket.addEventListener('message', (e) => this.handleMessage(e.data as string));

        socket.addEventListener('close', () => {
            this.clearTimers();
            this.best = { offset: 0, rtt: Number.POSITIVE_INFINITY };
            this.bestAt = 0;
            this.callbacks.onConnectedChange?.(false);
            if (!socket.natural && !this.closedByUser) this.scheduleReconnect();
        });

        socket.addEventListener('error', () => socket.close());
    }

    private scheduleReconnect(): void {
        // Full jitter: wait a random time in (0, backoff]. A server restart drops
        // every client at once; jitter spreads the reconnects out instead of
        // hammering it in lockstep. The backoff ceiling still doubles up to the cap.
        const delay = Math.random() * this.backoff;
        this.reconnectTimer = setTimeout(() => this.open(), delay);
        this.backoff = Math.min(this.backoff * 2, MAX_BACKOFF_MS);
    }

    private send(event: SyncClientEvent): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(event));
        }
    }

    private startClockSync(): void {
        if (this.pingTimer) clearInterval(this.pingTimer);
        const ping = () => this.send({ data: { t0: Date.now() }, event: 'ping' });
        ping();
        // A quick burst right after connect helps the offset converge fast.
        setTimeout(ping, 300);
        setTimeout(ping, 800);
        this.pingTimer = setInterval(ping, PING_INTERVAL_MS);
    }
}
