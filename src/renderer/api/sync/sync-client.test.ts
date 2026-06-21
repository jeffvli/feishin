import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SyncSocket } from './sync-client';

type Listener = (e: { data?: string }) => void;

// A minimal fake WebSocket: records what the client sends and lets a test drive
// the open/message/close events the SyncSocket listens for.
class FakeWebSocket {
    static CLOSED = 3;
    static last: FakeWebSocket | undefined;
    static OPEN = 1;

    natural = false;
    readyState = 0;
    sent: string[] = [];
    url: string;

    private listeners: Record<string, Listener[]> = {};

    constructor(url: string) {
        this.url = url;
        FakeWebSocket.last = this;
    }

    addEventListener(type: string, cb: Listener) {
        (this.listeners[type] ||= []).push(cb);
    }

    close() {
        this.readyState = FakeWebSocket.CLOSED;
        this.emit('close', {});
    }

    emit(type: string, e: { data?: string }) {
        (this.listeners[type] || []).forEach((cb) => cb(e));
    }

    fireMessage(obj: unknown) {
        this.emit('message', { data: JSON.stringify(obj) });
    }

    fireOpen() {
        this.readyState = FakeWebSocket.OPEN;
        this.emit('open', {});
    }

    send(data: string) {
        this.sent.push(data);
    }
}

const CREDS = { credential: 'u=alice&s=salt&t=tok', serverUrl: 'https://music.example.com' };
const WS_URL = 'wss://party.example.com/ws';

let originalWebSocket: unknown;

beforeEach(() => {
    originalWebSocket = (globalThis as { WebSocket: unknown }).WebSocket;
    (globalThis as { WebSocket: unknown }).WebSocket = FakeWebSocket;
    FakeWebSocket.last = undefined;
});

afterEach(() => {
    (globalThis as { WebSocket: unknown }).WebSocket = originalWebSocket;
    vi.restoreAllMocks();
    vi.useRealTimers();
});

const lastSocket = () => {
    const ws = FakeWebSocket.last;
    if (!ws) throw new Error('no socket created');
    return ws;
};

const parseSent = (ws: FakeWebSocket): Array<{ data?: any; event: string }> =>
    ws.sent.map((s) => JSON.parse(s));

describe('SyncSocket', () => {
    it('authenticates with parsed credentials on open', () => {
        const onConnectedChange = vi.fn();
        const s = new SyncSocket(WS_URL, CREDS, { onConnectedChange });
        s.connect();
        const ws = lastSocket();
        ws.fireOpen();

        const auth = parseSent(ws).find((m) => m.event === 'authenticate');
        expect(auth?.data).toMatchObject({ salt: 'salt', token: 'tok', username: 'alice' });
        expect(onConnectedChange).toHaveBeenCalledWith(true);
        s.close();
    });

    it('computes the clock offset from a pong', () => {
        const onClockOffset = vi.fn();
        const s = new SyncSocket(WS_URL, CREDS, { onClockOffset });
        s.connect();
        const ws = lastSocket();
        ws.fireOpen();
        ws.fireMessage({ data: { memberId: 'm1', username: 'alice' }, event: 'authenticated' });

        vi.spyOn(Date, 'now').mockReturnValue(1100); // t2 at pong receipt
        ws.fireMessage({ data: { serverTimeMs: 2000, t0: 1000 }, event: 'pong' });

        // offset = serverTimeMs - (t0 + t2) / 2 = 2000 - (1000 + 1100) / 2 = 950
        expect(onClockOffset).toHaveBeenCalledWith(950);
        expect(s.clockOffsetMs).toBe(950);
        s.close();
    });

    it('stamps clientTimeMs on an outbound transport', () => {
        const s = new SyncSocket(WS_URL, CREDS, {});
        s.connect();
        const ws = lastSocket();
        ws.fireOpen();
        s.sendTransport({ playing: true, positionMs: 0, queueIndex: 0, trackId: 'a' });

        const tr = parseSent(ws).find((m) => m.event === 'transport');
        expect(typeof tr?.data.clientTimeMs).toBe('number');
        s.close();
    });

    it('clears the room when a pending join fails, but not on later errors', () => {
        const onError = vi.fn();
        const onRoomClosed = vi.fn();
        const s = new SyncSocket(WS_URL, CREDS, { onError, onRoomClosed });
        s.connect();
        const ws = lastSocket();
        ws.fireOpen();
        ws.fireMessage({ data: { memberId: 'm1', username: 'alice' }, event: 'authenticated' });

        s.joinRoom('ABC123');
        ws.fireMessage({ data: { message: 'room not found: ABC123' }, event: 'error' });
        expect(onError).toHaveBeenCalledWith('room not found: ABC123');
        expect(onRoomClosed).toHaveBeenCalledTimes(1);

        // Once a room is established, an unrelated error must not tear it down.
        s.joinRoom('XYZ789');
        ws.fireMessage({
            data: {
                hostMemberId: 'm1',
                members: [{ id: 'm1', username: 'alice' }],
                roomId: 'XYZ789',
                seq: 1,
                transport: {
                    playing: false,
                    positionMs: 0,
                    queue: [],
                    queueIndex: -1,
                    serverTimeMs: 1,
                    trackId: '',
                },
            },
            event: 'roomState',
        });
        ws.fireMessage({ data: { message: 'cannot pass control' }, event: 'error' });
        expect(onRoomClosed).toHaveBeenCalledTimes(1);
        s.close();
    });

    it('reconnects (with jittered backoff) after an unexpected close', () => {
        vi.useFakeTimers();
        // Pin the jitter so the scheduled delay is deterministic: 0.5 * 1000ms backoff.
        vi.spyOn(Math, 'random').mockReturnValue(0.5);
        const s = new SyncSocket(WS_URL, CREDS, {});
        s.connect();
        const ws1 = lastSocket();
        ws1.fireOpen();

        ws1.close(); // unnatural close schedules a reconnect
        expect(FakeWebSocket.last).toBe(ws1);
        vi.advanceTimersByTime(499); // before the jittered 500ms delay: no reconnect yet
        expect(FakeWebSocket.last).toBe(ws1);
        vi.advanceTimersByTime(1); // now past it
        expect(FakeWebSocket.last).not.toBe(ws1);
        s.close();
    });
});
