import axios from 'axios';
import { app, ipcMain } from 'electron';
import { promises, Stats } from 'fs';
import { readFile } from 'fs/promises';
import { createServer, IncomingMessage, Server, ServerResponse } from 'http';
import { join } from 'path';
import { WebSocket, WebSocketServer, Server as WsServer } from 'ws';
import { deflate, gzip } from 'zlib';

import manifest from './manifest.json';

import { isLinux } from '/@/main/env';
import { getMainWindow } from '/@/main/index';
import log from '/@/main/logger';
import { QueueSong } from '/@/shared/types/domain-types';
import {
    ClientEvent,
    RemoteAlbumItem,
    RemotePlaylistItem,
    RemoteQueueItem,
    RemoteRadioItem,
    RemoteTrackItem,
    ServerEvent,
    ServerRadioStatus,
} from '/@/shared/types/remote-types';
import { PlayerRepeat, PlayerStatus, SongState } from '/@/shared/types/types';

let mprisPlayer: any | undefined;

async function initMpris() {
    if (isLinux()) {
        const mpris = await import('../../linux/mpris');
        mprisPlayer = mpris.mprisPlayer;
    }
}

initMpris();

interface MimeType {
    css: string;
    html: string;
    ico: string;
    js: string;
}

interface RemoteConfig {
    enabled: boolean;
    password: string;
    port: number;
    username: string;
}

declare class StatefulWebSocket extends WebSocket {
    alive: boolean;
    auth: boolean;
}

let server: Server | undefined;
let wsServer: undefined | WsServer<typeof StatefulWebSocket>;

const settings: RemoteConfig = {
    enabled: false,
    password: '',
    port: 4333,
    username: '',
};

type SendData = ServerEvent & {
    client: StatefulWebSocket;
};

function broadcast(message: ServerEvent): void {
    if (!wsServer) return;

    // Serialize once for every client instead of once per client — the
    // queue-state payload alone can carry hundreds of songs, and this fires
    // on every queue mutation.
    const payload = JSON.stringify(message);
    for (const client of wsServer.clients) {
        if (client.readyState === WebSocket.OPEN && client.alive && client.auth) {
            client.send(payload);
        }
    }
}

function send({ client, data, event }: SendData): void {
    if (client.readyState === WebSocket.OPEN) {
        if (client.alive && client.auth) {
            client.send(JSON.stringify({ data, event }));
        }
    }
}

// `closeCode` defaults to 4000 ("server is down", no client auto-retry) for
// a genuine shutdown. enableServer() below passes 4002 instead ("settings
// changed", the client already reloads and reconnects on that code) — it's
// not really shutting down, just replacing the running server with a fresh
// one, and reusing this function is what actually tears down the *previous*
// wsServer/heartBeat interval before that happens. Without this,
// re-enabling (or re-applying settings) left the old wsServer's clients set
// and its heartBeat `setInterval` running forever alongside the new one —
// `server.close()` alone stops new connections but never touches an
// already-upgraded WebSocket, and wsServer's own 'close' handler (which
// clears heartBeat) only fires from an explicit wsServer.close() call, which
// nothing here was ever making. Every re-enable leaked one more zombie
// heartbeat interval, each still ping/terminating whatever client it still
// held a reference to — indistinguishable, from the client's side, from the
// connection simply dying on its own every so often.
export const shutdownServer = (closeCode = 4000) => {
    if (wsServer || server) {
        log.info('Remote server shutting down');
    }

    if (wsServer) {
        wsServer.clients.forEach((client) => client.close(closeCode));
        wsServer.close();
        wsServer = undefined;
    }

    if (server) {
        server.close();
        server = undefined;
    }
};

const MIME_TYPES: MimeType = {
    css: 'text/css',
    html: 'text/html; charset=UTF-8',
    ico: 'image/x-icon',
    js: 'application/javascript',
};

const PING_TIMEOUT_MS = 10000;
const UP_TIMEOUT_MS = 5000;

enum Encoding {
    GZIP = 'gzip',
    NONE = 'none',
    ZLIB = 'deflate',
}

const GZIP_REGEX = /\bgzip\b/;
const ZLIB_REGEX = /bdeflate\b/;

const currentState: SongState = {};
let currentQueueState: { currentUniqueId: null | string; items: RemoteQueueItem[] } = {
    currentUniqueId: null,
    items: [],
};
let currentRadioStatus: ServerRadioStatus['data'] = { isActive: false };
// Mirrors the desktop's own confirmQueueChanges setting — safe default (ask)
// until the renderer's first push arrives, since assuming "don't ask" would
// be the wrong direction to fail in.
let confirmQueueChanges = true;
// Null until the renderer's first push (use-remote-settings-push.tsx)
// arrives — that computation needs generateColors() (@mantine/colors-
// generator), which is a browser-context-only dependency this main process
// can't safely run itself, so there's no meaningful default to fall back to
// here. Until then, the phone just keeps whatever primary color its own
// static theme CSS already set — close enough for the brief window before
// this lands, and the effective color only actually diverges from that for
// a desktop install that has customized its accent/shade settings anyway.
let currentAccentColor: null | { dark: string; light: string } = null;

// Only ever called once `client.auth` is true (either immediately, for an
// unprotected server, or from the `authenticate` message handler) — sending
// this unconditionally on every connection would leak playback state, the
// full queue, and radio status to a client that hadn't authenticated yet.
function sendInitialState(client: StatefulWebSocket): void {
    if (client.readyState !== WebSocket.OPEN) return;

    client.send(JSON.stringify({ data: currentState, event: 'state' }));
    client.send(JSON.stringify({ data: currentQueueState, event: 'queue-state' }));
    client.send(JSON.stringify({ data: currentRadioStatus, event: 'radio-status' }));
    client.send(
        JSON.stringify({ data: confirmQueueChanges, event: 'confirm-queue-changes-setting' }),
    );
    if (currentAccentColor) {
        client.send(JSON.stringify({ data: currentAccentColor, event: 'accent-color' }));
    }
}

// Tracks/playlists/radio browsing is request/response, not broadcast — the
// desktop renderer answers asynchronously over a separate IPC channel with no
// `ws` in scope, so the requesting client is remembered here by requestId
// until the matching `respond-*` IPC message arrives (or the timeout fires,
// as a leak guard if the renderer never responds).
const REQUEST_TIMEOUT_MS = 15000;
const requestClientMap = new Map<string, StatefulWebSocket>();

function rememberRequestClient(requestId: string, client: StatefulWebSocket): void {
    requestClientMap.set(requestId, client);
    setTimeout(() => {
        // Map.delete() returns false if a respond-* handler already resolved
        // (and removed) this request — only a genuinely unanswered request
        // reaches here, so the client isn't left waiting with no feedback at
        // all (e.g. the main window closed on macOS and silently dropped
        // the webContents.send that would have produced a response).
        if (requestClientMap.delete(requestId)) {
            send({ client, data: 'Request timed out', event: 'error' });
        }
    }, REQUEST_TIMEOUT_MS);
}

// Shared by every respond-* IPC handler below — looks up and consumes the
// client remembered for a request, so a bugfix here (or to the timeout in
// rememberRequestClient) only has to happen in one place.
function resolveRequestClient(requestId: string): StatefulWebSocket | undefined {
    const client = requestClientMap.get(requestId);
    requestClientMap.delete(requestId);
    return client;
}

const getEncoding = (encoding: string | string[]): Encoding => {
    const encodingArray = Array.isArray(encoding) ? encoding : [encoding];

    for (const code of encodingArray) {
        if (code.match(GZIP_REGEX)) {
            return Encoding.GZIP;
        }
        if (code.match(ZLIB_REGEX)) {
            return Encoding.ZLIB;
        }
    }

    return Encoding.NONE;
};

const cache = new Map<string, Map<Encoding, [number, Buffer]>>();

function authorize(req: IncomingMessage): boolean {
    if (settings.username || settings.password) {
        // https://stackoverflow.com/questions/23616371/basic-http-authentication-with-node-and-express-4

        const authorization = req.headers.authorization?.split(' ')[1] || '';
        const [login, password] = Buffer.from(authorization, 'base64').toString().split(':');

        return login === settings.username && password === settings.password;
    }

    return true;
}

async function serveFile(
    req: IncomingMessage,
    file: string,
    extension: keyof MimeType,
    res: ServerResponse,
): Promise<void> {
    const fileName = `${file}.${extension}`;
    const path = app.isPackaged
        ? join(__dirname, '../remote', fileName)
        : join(__dirname, '../../out/remote', fileName);

    let stats: Stats;

    try {
        stats = await promises.stat(path);
    } catch (error) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        res.end((error as Error).message);
        // This is a resolve, even though it is an error, because we want specific (non 500) status
        return Promise.resolve();
    }

    const encodings = req.headers['accept-encoding'] ?? '';
    const selectedEncoding = getEncoding(encodings);

    const ifMatch = req.headers['if-none-match'];

    const fileInfo = cache.get(fileName);
    let cached = fileInfo?.get(selectedEncoding);

    if (cached && cached[0] !== stats.mtimeMs) {
        cache.get(fileName)!.delete(selectedEncoding);
        cached = undefined;
    }

    if (ifMatch && cached) {
        const options = ifMatch.split(',');

        for (const option of options) {
            const mTime = Number(option.replaceAll('"', '').trim());

            if (cached[0] === mTime) {
                setOk(res, cached[0], extension, selectedEncoding);
                return Promise.resolve();
            }
        }
    }

    if (!cached || cached[0] !== stats.mtimeMs) {
        const content = await readFile(path);

        switch (selectedEncoding) {
            case Encoding.GZIP:
                return new Promise((resolve, reject) => {
                    gzip(content, (error, result) => {
                        if (error) {
                            reject(error);
                            return;
                        }

                        const newEntry: [number, Buffer] = [stats.mtimeMs, result];

                        if (fileInfo) {
                            fileInfo.set(selectedEncoding, newEntry);
                        } else {
                            cache.set(fileName, new Map([[selectedEncoding, newEntry]]));
                        }

                        setOk(res, stats.mtimeMs, extension, selectedEncoding, result);
                        resolve();
                    });
                });

            case Encoding.ZLIB:
                return new Promise((resolve, reject) => {
                    deflate(content, (error, result) => {
                        if (error) {
                            reject(error);
                            return;
                        }

                        const newEntry: [number, Buffer] = [stats.mtimeMs, result];

                        if (fileInfo) {
                            fileInfo.set(selectedEncoding, newEntry);
                        } else {
                            cache.set(fileName, new Map([[selectedEncoding, newEntry]]));
                        }

                        setOk(res, stats.mtimeMs, extension, selectedEncoding, result);
                        resolve();
                    });
                });
            default: {
                const newEntry: [number, Buffer] = [stats.mtimeMs, content];

                if (fileInfo) {
                    fileInfo.set(selectedEncoding, newEntry);
                } else {
                    cache.set(fileName, new Map([[selectedEncoding, newEntry]]));
                }

                setOk(res, stats.mtimeMs, extension, selectedEncoding, content);
                return Promise.resolve();
            }
        }
    }

    setOk(res, cached[0], extension, selectedEncoding, cached[1]);

    return Promise.resolve();
}

function setOk(
    res: ServerResponse,
    mtimeMs: number,
    extension: keyof MimeType,
    encoding: Encoding,
    data?: Buffer,
) {
    res.statusCode = data ? 200 : 304;

    res.setHeader('Content-Type', MIME_TYPES[extension]);
    res.setHeader('ETag', `"${mtimeMs}"`);
    res.setHeader('Cache-Control', 'public');

    if (encoding !== 'none') res.setHeader('Content-Encoding', encoding);
    res.end(data);
}

const enableServer = (config: RemoteConfig): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
        try {
            // 4002, not the shutdownServer() default of 4000 — this is a
            // restart (re-enable, or a settings change re-applying), not a
            // real shutdown, and the client already knows how to handle
            // 4002 cleanly (reload and reconnect) from the existing
            // remote-username/remote-password flows.
            shutdownServer(4002);

            server = createServer({}, async (req, res) => {
                if (!authorize(req)) {
                    res.statusCode = 401;
                    res.setHeader('WWW-Authenticate', 'Basic realm="401"');
                    res.end('Authorization required');
                    return;
                }

                try {
                    switch (req.url) {
                        case '/': {
                            await serveFile(req, 'index', 'html', res);
                            break;
                        }
                        case '/credentials': {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'text/plain');
                            res.end(req.headers.authorization);
                            break;
                        }
                        case '/favicon.ico': {
                            await serveFile(req, 'favicon', 'ico', res);
                            break;
                        }
                        case '/manifest.json': {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.end(JSON.stringify(manifest));
                            break;
                        }
                        case '/remote.css': {
                            await serveFile(req, 'remote', 'css', res);
                            break;
                        }
                        case '/remote.js': {
                            await serveFile(req, 'remote', 'js', res);
                            break;
                        }
                        default: {
                            if (req.url?.startsWith('/worker.js')) {
                                await serveFile(req, 'worker', 'js', res);
                            } else if (req.method === 'GET' || req.method === 'HEAD') {
                                // SPA fallback, not a 404 — HashRouter keeps
                                // every route in the URL *fragment*
                                // (`#/library`), which never reaches this
                                // server on a normal reload, so in practice
                                // this only matters when a client sends
                                // something else entirely (a stray query
                                // string, or a mobile browser/WebView that
                                // — unlike the spec — includes the fragment
                                // in the request). Either way, index.html is
                                // the right response: the client-side router
                                // reads the real route from location.hash
                                // itself once it mounts, same as it does for
                                // "/" today.
                                await serveFile(req, 'index', 'html', res);
                            } else {
                                res.statusCode = 404;
                                res.setHeader('Content-Type', 'text/plain');
                                res.end('Not Found');
                            }
                        }
                    }
                } catch (error) {
                    res.statusCode = 500;
                    res.setHeader('Content-Type', 'text/plain');
                    res.end((error as Error).message);
                }
            });

            let settled = false;
            const settle = (fn: () => void) => {
                if (settled) return;
                settled = true;
                fn();
            };

            server.listen(config.port, () => {
                log.info('Remote server listening', { port: config.port });
                settle(() => resolve());
            });
            server.on('error', (error) => {
                log.error('Remote server listen failed', { error, port: config.port });
                settle(() => reject(error));
            });
            wsServer = new WebSocketServer<typeof StatefulWebSocket>({ server });

            wsServer!.on('connection', (ws: StatefulWebSocket) => {
                let authFail: number | undefined;
                ws.alive = true;
                log.info('Remote client connected', { clients: wsServer?.clients.size });

                if (!settings.username && !settings.password) {
                    ws.auth = true;
                    sendInitialState(ws);
                } else {
                    authFail = setTimeout(() => {
                        if (!ws.auth) {
                            log.warn('Remote client auth timeout');
                            // Distinct code so the client can tell this apart
                            // from a transient network drop and not retry
                            // automatically forever.
                            ws.close(4004, 'Authentication timed out');
                        }
                    }, 10000) as unknown as number;
                }

                ws.on('error', log.error);

                ws.on('close', () => {
                    log.info('Remote client disconnected', { clients: wsServer?.clients.size });
                });

                ws.on('message', (data) => {
                    try {
                        const json = JSON.parse(data.toString()) as ClientEvent;
                        const event = json.event;

                        if (!ws.auth) {
                            if (event === 'authenticate') {
                                const auth = json.header.split(' ')[1];
                                const [login, password] = Buffer.from(auth, 'base64')
                                    .toString()
                                    .split(':');

                                if (login === settings.username && password === settings.password) {
                                    ws.auth = true;
                                    log.info('Remote client authenticated');
                                    sendInitialState(ws);
                                } else {
                                    log.warn('Remote client auth failed');
                                    ws.close(4004, 'Invalid credentials');
                                }

                                clearTimeout(authFail);
                            } else {
                                return;
                            }
                        }

                        switch (event) {
                            case 'add-to-playlist': {
                                const { playlistId, requestId, songId } = json;
                                if (requestId) rememberRequestClient(requestId, ws);
                                getMainWindow()?.webContents.send('request-add-to-playlist', {
                                    playlistId,
                                    requestId,
                                    songId,
                                });
                                break;
                            }
                            case 'albums-request': {
                                const { limit, requestId, searchTerm, startIndex } = json;
                                rememberRequestClient(requestId, ws);
                                getMainWindow()?.webContents.send('request-albums', {
                                    limit,
                                    requestId,
                                    searchTerm,
                                    startIndex,
                                });
                                break;
                            }
                            case 'clear-queue': {
                                const { requestId } = json;
                                if (requestId) rememberRequestClient(requestId, ws);
                                getMainWindow()?.webContents.send('request-clear-queue', {
                                    requestId,
                                });
                                break;
                            }
                            case 'favorite': {
                                const { favorite, id } = json;
                                if (id && id === currentState.song?.id) {
                                    getMainWindow()?.webContents.send('request-favorite', {
                                        favorite,
                                        id,
                                        serverId: currentState.song._serverId,
                                    });
                                }
                                break;
                            }
                            case 'next': {
                                getMainWindow()?.webContents.send('renderer-player-next');
                                break;
                            }
                            case 'pause': {
                                getMainWindow()?.webContents.send('renderer-player-pause');
                                break;
                            }
                            case 'play': {
                                getMainWindow()?.webContents.send('renderer-player-play');
                                break;
                            }
                            case 'play-album': {
                                if (json.requestId) rememberRequestClient(json.requestId, ws);
                                getMainWindow()?.webContents.send('request-play-album', {
                                    id: json.id,
                                    playType: json.playType,
                                    requestId: json.requestId,
                                });
                                break;
                            }
                            case 'play-playlist': {
                                if (json.requestId) rememberRequestClient(json.requestId, ws);
                                getMainWindow()?.webContents.send('request-play-playlist', {
                                    id: json.id,
                                    playType: json.playType,
                                    requestId: json.requestId,
                                });
                                break;
                            }
                            case 'play-radio': {
                                getMainWindow()?.webContents.send('request-play-radio', {
                                    id: json.id,
                                });
                                break;
                            }
                            case 'play-track': {
                                if (json.requestId) rememberRequestClient(json.requestId, ws);
                                getMainWindow()?.webContents.send('request-play-track', {
                                    id: json.id,
                                    playType: json.playType,
                                    requestId: json.requestId,
                                });
                                break;
                            }
                            case 'play-track-radio': {
                                if (json.requestId) rememberRequestClient(json.requestId, ws);
                                getMainWindow()?.webContents.send('request-play-track-radio', {
                                    id: json.id,
                                    playType: json.playType,
                                    requestId: json.requestId,
                                });
                                break;
                            }
                            case 'playlists-request': {
                                const { limit, requestId, searchTerm, startIndex } = json;
                                rememberRequestClient(requestId, ws);
                                getMainWindow()?.webContents.send('request-playlists', {
                                    limit,
                                    requestId,
                                    searchTerm,
                                    startIndex,
                                });
                                break;
                            }
                            case 'previous': {
                                getMainWindow()?.webContents.send('renderer-player-previous');
                                break;
                            }
                            case 'proxy': {
                                const toFetch = currentState.song?.imageUrl?.replaceAll(
                                    /&(size|width|height)=\d+/g,
                                    '',
                                );

                                if (!toFetch) return;

                                axios
                                    .get(toFetch, { responseType: 'arraybuffer' })
                                    .then((resp) => {
                                        if (ws.readyState === WebSocket.OPEN) {
                                            send({
                                                client: ws,
                                                data: Buffer.from(resp.data, 'binary').toString(
                                                    'base64',
                                                ),
                                                event: 'proxy',
                                            });
                                        }
                                        return null;
                                    })
                                    .catch((error) => {
                                        if (ws.readyState === WebSocket.OPEN) {
                                            send({
                                                client: ws,
                                                data: error.message,
                                                event: 'error',
                                            });
                                        }
                                    });

                                break;
                            }
                            case 'queue-jump': {
                                getMainWindow()?.webContents.send('request-queue-jump', {
                                    uniqueId: json.uniqueId,
                                });
                                break;
                            }
                            case 'radio-request': {
                                const { limit, requestId, searchTerm, startIndex } = json;
                                rememberRequestClient(requestId, ws);
                                getMainWindow()?.webContents.send('request-radio', {
                                    limit,
                                    requestId,
                                    searchTerm,
                                    startIndex,
                                });
                                break;
                            }
                            case 'rating': {
                                const { id, rating } = json;
                                if (id && id === currentState.song?.id) {
                                    getMainWindow()?.webContents.send('request-rating', {
                                        id,
                                        rating,
                                        serverId: currentState.song._serverId,
                                    });
                                }
                                break;
                            }
                            case 'remove-from-queue': {
                                const { uniqueId } = json;
                                getMainWindow()?.webContents.send('request-remove-from-queue', {
                                    uniqueId,
                                });
                                break;
                            }
                            case 'reorder-queue': {
                                const { edge, targetUniqueId, uniqueId } = json;
                                getMainWindow()?.webContents.send('request-reorder-queue', {
                                    edge,
                                    targetUniqueId,
                                    uniqueId,
                                });
                                break;
                            }
                            case 'repeat': {
                                getMainWindow()?.webContents.send('renderer-player-toggle-repeat');
                                break;
                            }
                            case 'shuffle': {
                                getMainWindow()?.webContents.send('renderer-player-toggle-shuffle');
                                break;
                            }
                            case 'tracks-request': {
                                const { limit, requestId, searchTerm, startIndex } = json;
                                rememberRequestClient(requestId, ws);
                                getMainWindow()?.webContents.send('request-tracks', {
                                    limit,
                                    requestId,
                                    searchTerm,
                                    startIndex,
                                });
                                break;
                            }
                            case 'volume': {
                                let volume = Number(json.volume);

                                if (volume > 100) {
                                    volume = 100;
                                } else if (volume < 0) {
                                    volume = 0;
                                }

                                currentState.volume = volume;

                                broadcast({ data: volume, event: 'volume' });
                                getMainWindow()?.webContents.send('request-volume', {
                                    volume,
                                });

                                if (mprisPlayer) {
                                    mprisPlayer.volume = volume / 100;
                                }
                                break;
                            }
                            case 'position': {
                                const { position } = json;
                                if (mprisPlayer) {
                                    mprisPlayer.getPosition = () => position * 1e6;
                                }
                                getMainWindow()?.webContents.send('request-position', {
                                    position,
                                });
                            }
                        }
                    } catch (error) {
                        log.error(error);
                    }
                });

                ws.on('pong', () => {
                    log.debug('Remote heartbeat pong received');
                    ws.alive = true;
                });
            });

            const heartBeat = setInterval(() => {
                wsServer?.clients.forEach((ws) => {
                    if (!ws.alive) {
                        log.warn('Remote heartbeat missed - terminating client', {
                            readyState: ws.readyState,
                        });
                        ws.terminate();
                        return;
                    }

                    ws.alive = false;
                    log.debug('Remote heartbeat ping sent');
                    ws.ping();
                });
            }, PING_TIMEOUT_MS);

            wsServer!.on('close', () => {
                clearInterval(heartBeat);
            });

            setTimeout(() => {
                settle(() => reject(new Error('Server did not come up')));
            }, UP_TIMEOUT_MS);
        } catch (error) {
            reject(error);
            shutdownServer();
        }
    });
};

ipcMain.handle('remote-enable', async (_event, enabled: boolean) => {
    settings.enabled = enabled;

    if (enabled) {
        try {
            await enableServer(settings);
        } catch (error) {
            return (error as Error).message;
        }
    } else {
        shutdownServer();
    }

    return null;
});

ipcMain.handle('remote-port', async (_event, port: number) => {
    settings.port = port;
});

ipcMain.on('remote-password', (_event, password: string) => {
    settings.password = password;
    wsServer?.clients.forEach((client) => client.close(4002));
});

ipcMain.handle(
    'remote-settings',
    async (_event, enabled: boolean, port: number, username: string, password: string) => {
        settings.enabled = enabled;
        settings.password = password;
        settings.port = port;
        settings.username = username;

        if (enabled) {
            try {
                await enableServer(settings);
            } catch (error) {
                return (error as Error).message;
            }
        } else {
            shutdownServer();
        }

        return null;
    },
);

ipcMain.on('remote-username', (_event, username: string) => {
    settings.username = username;
    wsServer?.clients.forEach((client) => client.close(4002));
});

ipcMain.on('update-favorite', (_event, favorite: boolean, serverId: string, ids: string[]) => {
    if (currentState.song?._serverId !== serverId) return;

    const id = currentState.song.id;

    for (const songId of ids) {
        if (songId === id) {
            currentState.song.userFavorite = favorite;
            broadcast({ data: { favorite, id: songId }, event: 'favorite' });
            return;
        }
    }
});

ipcMain.on('update-rating', (_event, rating: number, serverId: string, ids: string[]) => {
    if (currentState.song?._serverId !== serverId) return;

    const id = currentState.song.id;

    for (const songId of ids) {
        if (songId === id) {
            currentState.song.userRating = rating;
            broadcast({ data: { id: songId, rating }, event: 'rating' });
            return;
        }
    }
});

ipcMain.on('update-repeat', (_event, repeat: PlayerRepeat) => {
    currentState.repeat = repeat;
    broadcast({ data: repeat, event: 'repeat' });
});

ipcMain.on('update-shuffle', (_event, shuffle: boolean) => {
    currentState.shuffle = shuffle;
    broadcast({ data: shuffle, event: 'shuffle' });
});

ipcMain.on('update-playback', (_event, status: PlayerStatus) => {
    currentState.status = status;
    broadcast({ data: status, event: 'playback' });
});

ipcMain.on('update-song', (_event, song: QueueSong | undefined, imageUrl?: null | string) => {
    const songChanged = song?.id !== currentState.song?.id;
    if (song) {
        song.imageUrl = imageUrl || null;
    }
    currentState.song = song;

    if (songChanged) {
        broadcast({ data: song || null, event: 'song' });
    }
});

ipcMain.on('update-volume', (_event, volume: number) => {
    currentState.volume = volume;
    broadcast({ data: volume, event: 'volume' });
});

ipcMain.on(
    'respond-tracks',
    (_event, requestId: string, hasMore: boolean, items: RemoteTrackItem[]) => {
        const client = resolveRequestClient(requestId);
        if (client) send({ client, data: { hasMore, items, requestId }, event: 'tracks-response' });
    },
);

ipcMain.on(
    'respond-albums',
    (_event, requestId: string, hasMore: boolean, items: RemoteAlbumItem[]) => {
        const client = resolveRequestClient(requestId);
        if (client) send({ client, data: { hasMore, items, requestId }, event: 'albums-response' });
    },
);

ipcMain.on(
    'respond-playlists',
    (_event, requestId: string, hasMore: boolean, items: RemotePlaylistItem[]) => {
        const client = resolveRequestClient(requestId);
        if (client) {
            send({ client, data: { hasMore, items, requestId }, event: 'playlists-response' });
        }
    },
);

ipcMain.on(
    'respond-radio',
    (_event, requestId: string, hasMore: boolean, items: RemoteRadioItem[]) => {
        const client = resolveRequestClient(requestId);
        if (client) send({ client, data: { hasMore, items, requestId }, event: 'radio-response' });
    },
);

ipcMain.on('respond-operation', (_event, requestId: string, error?: string) => {
    const client = resolveRequestClient(requestId);
    if (client) send({ client, data: { error, requestId }, event: 'operation-ack' });
});

ipcMain.on('update-queue', (_event, currentUniqueId: null | string, items: RemoteQueueItem[]) => {
    currentQueueState = { currentUniqueId, items };
    broadcast({ data: currentQueueState, event: 'queue-state' });
});

ipcMain.on('update-radio-status', (_event, status: ServerRadioStatus['data']) => {
    currentRadioStatus = status;
    broadcast({ data: status, event: 'radio-status' });
});

ipcMain.on('update-confirm-queue-changes-setting', (_event, enabled: boolean) => {
    confirmQueueChanges = enabled;
    broadcast({ data: enabled, event: 'confirm-queue-changes-setting' });
});

ipcMain.on('update-accent-color', (_event, color: { dark: string; light: string }) => {
    currentAccentColor = color;
    broadcast({ data: color, event: 'accent-color' });
});

if (mprisPlayer) {
    mprisPlayer.on('loopStatus', (event: string) => {
        const repeat = event === 'Playlist' ? 'all' : event === 'Track' ? 'one' : 'none';

        currentState.repeat = repeat as PlayerRepeat;
        broadcast({ data: repeat, event: 'repeat' } as ServerEvent);
    });

    mprisPlayer.on('shuffle', (shuffle: boolean) => {
        currentState.shuffle = shuffle;
        broadcast({ data: shuffle, event: 'shuffle' });
    });

    mprisPlayer.on('volume', (vol: number) => {
        let volume = Math.round(vol * 100);

        if (volume > 100) {
            volume = 100;
        } else if (volume < 0) {
            volume = 0;
        }
        currentState.volume = volume;
        broadcast({ data: volume, event: 'volume' });
        getMainWindow()?.webContents.send('request-volume', {
            volume,
        });
    });
}

ipcMain.on('update-position', (_event, position: number) => {
    currentState.position = position;
    broadcast({ data: position, event: 'position' });
});
