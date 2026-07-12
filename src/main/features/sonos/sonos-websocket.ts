import { randomUUID } from 'crypto';

import log from 'electron-log/main';
import { WebSocket } from 'ws';

import { SONOS_CONSTANTS } from './sonos-constants';

interface PendingCommand {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
}

type WsMessage = [Record<string, any>, Record<string, any>];

export class SonosWebSocketApi {
    private ws: WebSocket | null = null;
    private pendingCommands = new Map<string, PendingCommand>();
    private websocketUrl: string;
    private pingTimer: ReturnType<typeof setInterval> | null = null;
    private onDisconnectedCb: (() => void) | null = null;

    constructor(websocketUrl: string) {
        this.websocketUrl = websocketUrl;
    }

    setOnDisconnected(cb: () => void): void {
        this.onDisconnectedCb = cb;
    }

    get isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    async connect(): Promise<boolean> {
        if (this.ws?.readyState === WebSocket.OPEN) {
            return true;
        }

        log.info(`[sonos] Connecting to WebSocket: ${this.websocketUrl}`);

        return new Promise((resolve) => {
            const ws = new WebSocket(this.websocketUrl, SONOS_CONSTANTS.WEBSOCKET_PROTOCOL, {
                headers: {
                    'X-Sonos-Api-Key': SONOS_CONSTANTS.API_TOKEN,
                },
                rejectUnauthorized: false,
            });

            const timeout = setTimeout(() => {
                log.warn('[sonos] WebSocket connection timeout');
                ws.close();
                resolve(false);
            }, SONOS_CONSTANTS.WEBSOCKET_TIMEOUT_MS);

            ws.on('open', () => {
                clearTimeout(timeout);
                log.info('[sonos] WebSocket connected');
                this.ws = ws;

                // Send ping every 30s to keep connection alive
                this.pingTimer = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.ping();
                    }
                }, 30000);

                resolve(true);
            });

            ws.on('message', (data: Buffer) => {
                try {
                    const text = data.toString();
                    const message: WsMessage = JSON.parse(text);

                    if (!Array.isArray(message) || message.length !== 2) {
                        return;
                    }

                    const header = message[0];
                    const body = message[1];
                    const cmdId = header.cmdId as string | undefined;

                    // Check for response
                    if (header.response) {
                        const success = header.success === true;
                        if (cmdId) {
                            const pending = this.pendingCommands.get(cmdId);
                            if (pending) {
                                this.pendingCommands.delete(cmdId);
                                if (success) {
                                    pending.resolve(body);
                                } else {
                                    const errorCode = body.errorCode || header.type || 'UNKNOWN';
                                    const reason = body.reason || header.reason;
                                    pending.reject(
                                        new Error(`Command failed: ${errorCode}${reason ? ` - ${reason}` : ''}`),
                                    );
                                }
                            }
                        }
                        return;
                    }

                    // Check for error
                    if (body.errorCode) {
                        if (cmdId) {
                            const pending = this.pendingCommands.get(cmdId);
                            if (pending) {
                                this.pendingCommands.delete(cmdId);
                                pending.reject(
                                    new Error(`Command failed: ${body.errorCode}${body.reason ? ` - ${body.reason}` : ''}`),
                                );
                            }
                        }
                        return;
                    }

                    // Standard response
                    if (cmdId) {
                        const pending = this.pendingCommands.get(cmdId);
                        if (pending) {
                            this.pendingCommands.delete(cmdId);
                            pending.resolve(body);
                        }
                    }
                } catch {
                    // Ignore parse errors
                }
            });

            ws.on('close', (code, reason) => {
                log.info(`[sonos] WebSocket closed: ${code} ${reason.toString()}`);
                if (this.pingTimer) {
                    clearInterval(this.pingTimer);
                    this.pingTimer = null;
                }
                this.ws = null;
                // Reject all pending commands
                for (const [id, pending] of this.pendingCommands) {
                    pending.reject(new Error('WebSocket disconnected'));
                    this.pendingCommands.delete(id);
                }
                // Notify for reconnection
                if (this.onDisconnectedCb) {
                    this.onDisconnectedCb();
                }
            });

            ws.on('error', (err) => {
                clearTimeout(timeout);
                log.warn(`[sonos] WebSocket error: ${err.message}`);
                this.ws = null;
                resolve(false);
            });
        });
    }

    disconnect(): void {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
            this.pingTimer = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        for (const [id, pending] of this.pendingCommands) {
            pending.reject(new Error('Disconnected'));
            this.pendingCommands.delete(id);
        }
    }

    async sendCommand(
        namespace: string,
        command: string,
        objectId?: string,
        options?: Record<string, any>,
        extraHeaders?: Record<string, any>,
    ): Promise<any> {
        const cmdId = randomUUID().replace(/-/g, '');

        const header: Record<string, any> = {
            cmdId,
            command,
            namespace: `${namespace}:${SONOS_CONSTANTS.API_VERSION}`,
        };

        if (objectId) {
            const key = this.getObjectIdKey(namespace, command);
            header[key] = objectId;
        }

        if (extraHeaders) {
            Object.assign(header, extraHeaders);
        }

        const message: WsMessage = [header, options || {}];

        return new Promise((resolve, reject) => {
            if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                reject(new Error('Not connected to WebSocket'));
                return;
            }

            this.pendingCommands.set(cmdId, { reject, resolve });

            const timeout = setTimeout(() => {
                const pending = this.pendingCommands.get(cmdId);
                if (pending) {
                    this.pendingCommands.delete(cmdId);
                    pending.reject(new Error(`Command timeout: ${command}`));
                }
            }, SONOS_CONSTANTS.WEBSOCKET_TIMEOUT_MS);

            try {
                this.ws!.send(JSON.stringify(message));
            } catch (e) {
                clearTimeout(timeout);
                this.pendingCommands.delete(cmdId);
                reject(e);
            }
        }).then((result) => {
            return result;
        });
    }

    private getObjectIdKey(namespace: string, command: string): string {
        switch (namespace) {
            case 'playback':
                return 'groupId';
            case 'playbackSession':
                switch (command) {
                    case 'createSession':
                        return 'playerId';
                    case 'loadStreamUrl':
                        return 'groupId';
                    case 'loadTrackList':
                        return 'sessionId';
                    case 'suspend':
                    case 'endSession':
                        return 'sessionId';
                    default:
                        return 'groupId';
                }
            case 'groupVolume':
                return 'groupId';
            default:
                return 'objectId';
        }
    }
}
