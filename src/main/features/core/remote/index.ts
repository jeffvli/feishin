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
import { QueueSong } from '/@/shared/types/domain-types';
import { ClientEvent, ServerEvent } from '/@/shared/types/remote-types';
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
    if (wsServer) {
        for (const client of wsServer.clients) {
            send({ client, ...message });
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

export const shutdownServer = () => {
    if (wsServer) {
        wsServer.clients.forEach((client) => client.close(4000));
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
            if (server) {
                server.close();
            }

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

            server.listen(config.port, resolve);
            wsServer = new WebSocketServer<typeof StatefulWebSocket>({ server });

            wsServer!.on('connection', (ws: StatefulWebSocket) => {
                let authFail: number | undefined;
                ws.alive = true;

                if (!settings.username && !settings.password) {
                    ws.auth = true;
                } else {
                    authFail = setTimeout(() => {
                        if (!ws.auth) {
                            ws.close();
                        }
                    }, 10000) as unknown as number;
                }

                ws.on('error', console.error);

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
                                } else {
                                    ws.close();
                                }

                                clearTimeout(authFail);
                            } else {
                                return;
                            }
                        }

                        switch (event) {
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
                            case 'repeat': {
                                getMainWindow()?.webContents.send('renderer-player-toggle-repeat');
                                break;
                            }
                            case 'shuffle': {
                                getMainWindow()?.webContents.send('renderer-player-toggle-shuffle');
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
                        console.error(error);
                    }
                });

                ws.on('pong', () => {
                    ws.alive = true;
                });

                ws.send(JSON.stringify({ data: currentState, event: 'state' }));
            });

            const heartBeat = setInterval(() => {
                wsServer?.clients.forEach((ws) => {
                    if (!ws.alive) {
                        ws.terminate();
                        return;
                    }

                    ws.alive = false;
                    ws.ping();
                });
            }, PING_TIMEOUT_MS);

            wsServer!.on('close', () => {
                clearInterval(heartBeat);
            });

            setTimeout(() => {
                reject(new Error('Server did not come up'));
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
