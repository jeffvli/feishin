import { Stats, promises } from 'fs';
import { readFile } from 'fs/promises';
import { IncomingMessage, Server, ServerResponse, createServer } from 'http';
import { join } from 'path';
import { deflate, gzip } from 'zlib';
import axios from 'axios';
import { app, ipcMain } from 'electron';
import { Server as WsServer, WebSocketServer, WebSocket } from 'ws';
import { QueueSong } from '../../../../renderer/api/types';
import { PlayerRepeat, SongUpdate } from '../../../../renderer/types';
import { getMainWindow } from '../../../main';
import { isLinux } from '../../../utils';
import { store } from '../settings/index';

let mprisPlayer: any | undefined;

if (isLinux()) {
  // eslint-disable-next-line global-require
  mprisPlayer = require('../../linux/mpris').mprisPlayer;
}

interface RemoteConfig {
  enabled: boolean;
  port: number;
}

interface MimeType {
  css: string;
  html: string;
  ico: string;
  js: string;
}

interface StatefulWebSocket extends WebSocket {
  alive: boolean;
}

let server: Server | undefined;
let wsServer: WsServer<StatefulWebSocket> | undefined;

interface SongUpdateSocket extends Omit<SongUpdate, 'song'> {
  song?: QueueSong | null;
}

function broadcast(event: string, data: SongUpdateSocket): void {
  if (wsServer) {
    for (const client of wsServer.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ data, event }));
      }
    }
  }
}

const shutdownServer = () => {
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

let currentSong: SongUpdate = {
  currentTime: 0,
};

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

async function serveFile(
  req: IncomingMessage,
  file: string,
  extension: keyof MimeType,
  res: ServerResponse,
): Promise<void> {
  const fileName = `${file}.${extension}`;
  let path: string;

  if (extension === 'ico') {
    path = app.isPackaged
      ? join(process.resourcesPath, 'assets', fileName)
      : join(__dirname, '../../../../../assets', fileName);
  } else {
    path = app.isPackaged
      ? join(__dirname, '../remote', fileName)
      : join(__dirname, '../../../../../.erb/dll', fileName);
  }

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

  const fileInfo = cache.get(file);
  let cached = fileInfo?.get(selectedEncoding);

  if (cached && cached[0] !== stats.mtimeMs) {
    cache.get(file)!.delete(selectedEncoding);
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
              cache.set(file, new Map([[selectedEncoding, newEntry]]));
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
              cache.set(file, new Map([[selectedEncoding, newEntry]]));
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
          cache.set(file, new Map([[selectedEncoding, newEntry]]));
        }

        setOk(res, stats.mtimeMs, extension, selectedEncoding, content);
        return Promise.resolve();
      }
    }
  }

  setOk(res, cached[0], extension, selectedEncoding, cached[1]);

  return Promise.resolve();
}

const enableServer = (config: RemoteConfig): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    try {
      if (server) {
        server.close();
      }

      server = createServer({}, async (req, res) => {
        try {
          switch (req.url) {
            case '/': {
              await serveFile(req, 'index', 'html', res);
              break;
            }
            case '/favicon.ico': {
              await serveFile(req, 'icon', 'ico', res);
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
              res.statusCode = 404;
              res.setHeader('Content-Type', 'text/plain');
              res.end('Not FOund');
            }
          }
        } catch (error) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'text/plain');
          res.end((error as Error).message);
        }
      });
      server.listen(config.port, resolve);
      wsServer = new WebSocketServer({ server });

      wsServer.on('connection', (ws) => {
        ws.alive = true;

        ws.on('error', console.error);

        ws.on('message', (data) => {
          try {
            const json = JSON.parse(data.toString());
            const event = json[0];

            switch (event) {
              case 'pause': {
                getMainWindow()?.webContents.send('renderer-player-pause');
                break;
              }
              case 'play': {
                getMainWindow()?.webContents.send('renderer-player-play');
                break;
              }
              case 'next': {
                getMainWindow()?.webContents.send('renderer-player-next');
                break;
              }
              case 'previous': {
                getMainWindow()?.webContents.send('renderer-player-previous');
                break;
              }
              case 'proxy': {
                const toFetch = currentSong.song?.imageUrl?.replaceAll(
                  /&(size|width|height=\d+)/g,
                  '',
                );

                if (!toFetch) return;

                axios
                  .get(toFetch, { responseType: 'arraybuffer' })
                  .then((resp) => {
                    if (ws.readyState === WebSocket.OPEN) {
                      ws.send(
                        JSON.stringify({
                          data: Buffer.from(resp.data, 'binary').toString('base64'),
                          event: 'proxy',
                        }),
                      );
                    }
                    return null;
                  })
                  .catch((error) => {
                    if (ws.readyState === WebSocket.OPEN) {
                      ws.send(JSON.stringify({ data: error.message, event: 'error' }));
                    }
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
              case 'volume': {
                let volume = Number(json[1]);

                if (volume > 100) {
                  volume = 100;
                } else if (volume < 0) {
                  volume = 0;
                }

                currentSong.volume = volume;

                broadcast('song', { volume });
                getMainWindow()?.webContents.send('request-volume', {
                  volume,
                });

                if (mprisPlayer) {
                  mprisPlayer.volume = volume / 100;
                }
                break;
              }
            }
          } catch (error) {
            console.error(error);
          }
        });

        ws.on('pong', () => {
          ws.alive = true;
        });

        ws.send(JSON.stringify({ data: currentSong, event: 'song' }));
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

      wsServer.on('close', () => {
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

const DEFAULT_CONFIG = { enabled: false, port: 4333 };

ipcMain.handle('remote-enable', async (_event, enabled: boolean) => {
  const settings = store.get('remote', DEFAULT_CONFIG) as RemoteConfig;
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

  store.set('remote', settings);
  return null;
});

ipcMain.handle('remote-port', async (_event, port: number) => {
  const settings = store.get('remote', DEFAULT_CONFIG) as RemoteConfig;
  settings.port = port;
  store.set('remote', settings);

  return null;
});

ipcMain.on('update-repeat', (_event, repeat: PlayerRepeat) => {
  currentSong.repeat = repeat;
  broadcast('song', { repeat });
});

ipcMain.on('update-shuffle', (_event, shuffle: boolean) => {
  currentSong.shuffle = shuffle;
  broadcast('song', { shuffle });
});

ipcMain.on('update-song', (_event, data: SongUpdate) => {
  const { song, ...rest } = data;
  const songChanged = song?.id !== currentSong.song?.id;

  if (!song?.id) {
    currentSong = {
      ...currentSong,
      ...data,
      song: undefined,
    };
  } else {
    currentSong = {
      ...currentSong,
      ...data,
    };
  }

  if (songChanged) {
    broadcast('song', { ...rest, song: song || null });
  } else {
    broadcast('song', rest);
  }
});

ipcMain.on('update-volume', (_event, volume: number) => {
  currentSong.volume = volume;
  broadcast('song', { volume });
});

if (mprisPlayer) {
  mprisPlayer.on('loopStatus', (event: string) => {
    const repeat =
      event === 'Playlist'
        ? PlayerRepeat.ALL
        : event === 'Track'
        ? PlayerRepeat.ONE
        : PlayerRepeat.NONE;

    currentSong.repeat = repeat;
    broadcast('song', { repeat });
  });

  mprisPlayer.on('shuffle', (shuffle: boolean) => {
    currentSong.shuffle = shuffle;
    broadcast('song', { shuffle });
  });

  mprisPlayer.on('volume', (vol: number) => {
    let volume = Math.round(vol * 100);

    if (volume > 100) {
      volume = 100;
    } else if (volume < 0) {
      volume = 0;
    }
    currentSong.volume = volume;
    broadcast('song', { volume });
  });
}
