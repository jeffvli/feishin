// Wire types for the listen-together sync server. These mirror the Go structs in
// the listen-together `internal/protocol` package exactly. Every frame on the
// wire is an envelope { event, data }.
//
// See: listen-together/docs/PROTOCOL.md

// Client -> Server
export type SyncClientEvent =
    | { data: SyncTransportInput; event: 'transport' }
    | {
          data: {
              password?: string;
              salt?: string;
              serverUrl: string;
              token?: string;
              username: string;
          };
          event: 'authenticate';
      }
    | { data: { roomId: string }; event: 'joinRoom' }
    | { data: { t0: number }; event: 'ping' }
    | { data: { toMemberId: string }; event: 'passControl' }
    | { event: 'createRoom' }
    | { event: 'leaveRoom' }
    | { event: 'requestControl' };

export interface SyncMember {
    id: string;
    username: string;
}

export interface SyncRoomState {
    hostMemberId: string;
    members: SyncMember[];
    roomId: string;
    seq: number;
    transport: SyncTransport;
}

// Server -> Client
export type SyncServerEvent =
    | { data: SyncRoomState; event: 'roomState' }
    | { data: { fromMemberId: string; fromUsername: string }; event: 'controlRequested' }
    | { data: { memberId: string; username: string }; event: 'authenticated' }
    | { data: { message: string }; event: 'error' }
    | { data: { serverTimeMs: number; t0: number }; event: 'pong' };

export interface SyncTransport {
    playing: boolean;
    positionMs: number;
    queue: string[];
    queueIndex: number;
    serverTimeMs: number;
    trackId: string;
}

export interface SyncTransportInput {
    // Monotonic logical clock stamped at send time; lets the server drop
    // out-of-order transports. Filled in by SyncSocket.sendTransport.
    clientTimeMs?: number;
    playing: boolean;
    positionMs: number;
    // Omitted when unchanged since the last send so play/pause/seek don't resend
    // the full track-id list; the server then keeps the room's current queue.
    queue?: string[];
    queueIndex: number;
    trackId: string;
}
