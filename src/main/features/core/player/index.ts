import console from 'console';
import { app, ipcMain } from 'electron';
import uniq from 'lodash/uniq';
import MpvAPI from 'node-mpv';
import { getMainWindow, sendToastToRenderer } from '../../../main';
import { PlayerData } from '/@/renderer/store';
import { isWindows } from '../../../utils';
import { store } from '../settings';

declare module 'node-mpv';

// function wait(timeout: number) {
//     return new Promise((resolve) => {
//         setTimeout(() => {
//             resolve('resolved');
//         }, timeout);
//     });
// }

let mpvInstance: MpvAPI | null = null;

const MPV_BINARY_PATH = store.get('mpv_path') as string | undefined;
const isDevelopment = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

const prefetchPlaylistParams = [
    '--prefetch-playlist=no',
    '--prefetch-playlist=yes',
    '--prefetch-playlist',
];

const DEFAULT_MPV_PARAMETERS = (extraParameters?: string[]) => {
    const parameters = ['--idle=yes', '--no-config', '--load-scripts=no'];

    if (!extraParameters?.some((param) => prefetchPlaylistParams.includes(param))) {
        parameters.push('--prefetch-playlist=yes');
    }

    return parameters;
};

const createMpv = async (data: {
    extraParameters?: string[];
    properties?: Record<string, any>;
}): Promise<MpvAPI> => {
    const { extraParameters, properties } = data;

    const params = uniq([...DEFAULT_MPV_PARAMETERS(extraParameters), ...(extraParameters || [])]);
    console.log('Setting mpv params: ', params);

    const extra = isDevelopment ? '-dev' : '';

    const mpv = new MpvAPI(
        {
            audio_only: true,
            auto_restart: false,
            binary: MPV_BINARY_PATH || undefined,
            socket: isWindows() ? `\\\\.\\pipe\\mpvserver${extra}` : `/tmp/node-mpv${extra}.sock`,
            time_update: 1,
        },
        params,
    );

    try {
        await mpv.start();
    } catch (error: { message: string; stack: any } | any) {
        console.log('MPV failed to start', error);
    } finally {
        console.log('Setting MPV properties: ', properties);
        await mpv.setMultipleProperties(properties || {});
    }

    mpv.on('status', (status, ...rest) => {
        console.log('MPV Event: status', status.property, status.value, rest);
        if (status.property === 'playlist-pos') {
            if (status.value === -1) {
                mpv?.stop();
            }

            if (status.value !== 0) {
                getMainWindow()?.webContents.send('renderer-player-auto-next');
            }
        }
    });

    // Automatically updates the play button when the player is playing
    mpv.on('resumed', () => {
        console.log('MPV Event: resumed');
        getMainWindow()?.webContents.send('renderer-player-play');
    });

    // Automatically updates the play button when the player is stopped
    mpv.on('stopped', () => {
        console.log('MPV Event: stopped');
        getMainWindow()?.webContents.send('renderer-player-stop');
    });

    // Automatically updates the play button when the player is paused
    mpv.on('paused', () => {
        console.log('MPV Event: paused');
        getMainWindow()?.webContents.send('renderer-player-pause');
    });

    // Event output every interval set by time_update, used to update the current time
    mpv.on('timeposition', (time: number) => {
        getMainWindow()?.webContents.send('renderer-player-current-time', time);
    });

    mpv.on('quit', () => {
        console.log('MPV Event: quit');
    });

    return mpv;
};

export const getMpvInstance = () => {
    return mpvInstance;
};

ipcMain.on('player-set-properties', async (_event, data: Record<string, any>) => {
    if (data.length === 0) {
        return;
    }

    if (data.length === 1) {
        getMpvInstance()?.setProperty(Object.keys(data)[0], Object.values(data)[0]);
    } else {
        getMpvInstance()?.setMultipleProperties(data);
    }
});

ipcMain.on(
    'player-restart',
    async (_event, data: { extraParameters?: string[]; properties?: Record<string, any> }) => {
        console.log('Initializing MPV with data: ', data);
        mpvInstance?.quit();
        try {
            mpvInstance = await createMpv(data);
        } catch (err) {
            console.log('init error', err);
            sendToastToRenderer({ message: 'Initialization error', type: 'error' });
        }
    },
);

ipcMain.handle(
    'player-initialize',
    async (_event, data: { extraParameters?: string[]; properties?: Record<string, any> }) => {
        console.log('Initializing MPV with data: ', data);
        try {
            mpvInstance = await createMpv(data);
        } catch (err) {
            console.log('init error', err);
            sendToastToRenderer({ message: 'Initialization error', type: 'error' });
        }
    },
);

ipcMain.on('player-quit', async () => {
    mpvInstance?.stop();
    mpvInstance?.quit();
    mpvInstance = null;
});

ipcMain.handle('player-is-running', async () => {
    return getMpvInstance()?.isRunning();
});

ipcMain.handle('player-clean-up', async () => {
    getMpvInstance()?.stop();
    getMpvInstance()?.clearPlaylist();
});

ipcMain.on('player-start', async () => {
    await getMpvInstance()
        ?.play()
        .catch((err) => {
            console.log('MPV failed to play', err);
        });
});

// Starts the player
ipcMain.on('player-play', async () => {
    await getMpvInstance()
        ?.play()
        .catch((err) => {
            console.log('MPV failed to play', err);
        });
});

// Pauses the player
ipcMain.on('player-pause', async () => {
    await getMpvInstance()
        ?.pause()
        .catch((err) => {
            console.log('MPV failed to pause', err);
        });
});

// Stops the player
ipcMain.on('player-stop', async () => {
    await getMpvInstance()
        ?.stop()
        .catch((err) => {
            console.log('MPV failed to stop', err);
        });
});

// Goes to the next track in the playlist
ipcMain.on('player-next', async () => {
    await getMpvInstance()
        ?.next()
        .catch((err) => {
            console.log('MPV failed to go to next', err);
        });
});

// Goes to the previous track in the playlist
ipcMain.on('player-previous', async () => {
    await getMpvInstance()
        ?.prev()
        .catch((err) => {
            console.log('MPV failed to go to previous', err);
        });
});

// Seeks forward or backward by the given amount of seconds
ipcMain.on('player-seek', async (_event, time: number) => {
    await getMpvInstance()
        ?.seek(time)
        .catch((err) => {
            console.log('MPV failed to seek', err);
        });
});

// Seeks to the given time in seconds
ipcMain.on('player-seek-to', async (_event, time: number) => {
    await getMpvInstance()
        ?.goToPosition(time)
        .catch((err) => {
            console.log(`MPV failed to seek to ${time}`, err);
        });
});

// Sets the queue in position 0 and 1 to the given data. Used when manually starting a song or using the next/prev buttons
ipcMain.on('player-set-queue', async (_event, data: PlayerData, pause?: boolean) => {
    if (!data.queue.current && !data.queue.next) {
        await getMpvInstance()
            ?.clearPlaylist()
            .catch((err) => {
                console.log('MPV failed to clear playlist', err);
            });

        await getMpvInstance()
            ?.pause()
            .catch((err) => {
                console.log('MPV failed to pause', err);
            });
        return;
    }

    try {
        if (data.queue.current) {
            await getMpvInstance()
                ?.load(data.queue.current.streamUrl, 'replace')
                .catch((err) => {
                    console.log('MPV failed to load song', err);
                    getMpvInstance()?.play();
                });

            if (data.queue.next) {
                await getMpvInstance()?.load(data.queue.next.streamUrl, 'append');
            }
        }
    } catch (err) {
        console.error(err);
    }

    if (pause) {
        getMpvInstance()?.pause();
    }
});

// Replaces the queue in position 1 to the given data
ipcMain.on('player-set-queue-next', async (_event, data: PlayerData) => {
    const size = await getMpvInstance()
        ?.getPlaylistSize()
        .catch((err) => {
            console.log('MPV failed to get playlist size', err);
        });

    if (!size) {
        return;
    }

    if (size > 1) {
        await getMpvInstance()
            ?.playlistRemove(1)
            .catch((err) => {
                console.log('MPV failed to remove song from playlist', err);
            });
    }

    if (data.queue.next) {
        await getMpvInstance()
            ?.load(data.queue.next.streamUrl, 'append')
            .catch((err) => {
                console.log('MPV failed to load next song', err);
            });
    }
});

// Sets the next song in the queue when reaching the end of the queue
ipcMain.on('player-auto-next', async (_event, data: PlayerData) => {
    // Always keep the current song as position 0 in the mpv queue
    // This allows us to easily set update the next song in the queue without
    // disturbing the currently playing song
    await getMpvInstance()
        ?.playlistRemove(0)
        .catch((err) => {
            console.log('MPV failed to remove song from playlist', err);
            getMpvInstance()?.pause();
        });

    if (data.queue.next) {
        await getMpvInstance()
            ?.load(data.queue.next.streamUrl, 'append')
            .catch((err) => {
                console.log('MPV failed to load next song', err);
            });
    }
});

// Sets the volume to the given value (0-100)
ipcMain.on('player-volume', async (_event, value: number) => {
    await getMpvInstance()
        ?.volume(value)
        .catch((err) => {
            console.log('MPV failed to set volume', err);
        });
});

// Toggles the mute status
ipcMain.on('player-mute', async (_event, mute: boolean) => {
    await getMpvInstance()
        ?.mute(mute)
        .catch((err) => {
            console.log('MPV failed to toggle mute', err);
        });
});

ipcMain.handle('player-get-time', async (): Promise<number | undefined> => {
    return getMpvInstance()?.getTimePosition();
});

app.on('before-quit', () => {
    getMpvInstance()?.stop();
    getMpvInstance()?.quit();
});

app.on('window-all-closed', () => {
    getMpvInstance()?.quit();
});
