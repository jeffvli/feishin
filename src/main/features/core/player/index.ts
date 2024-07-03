import console from 'console';
import { rm } from 'fs/promises';
import { pid } from 'node:process';
import { app, ipcMain } from 'electron';
import uniq from 'lodash/uniq';
import MpvAPI from 'node-mpv';
import { getMainWindow, sendToastToRenderer } from '../../../main';
import { PlayerData } from '/@/renderer/store';
import { createLog, isWindows } from '../../../utils';
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
const socketPath = isWindows() ? `\\\\.\\pipe\\mpvserver-${pid}` : `/tmp/node-mpv-${pid}.sock`;

const NodeMpvErrorCode = {
    0: 'Unable to load file or stream',
    1: 'Invalid argument',
    2: 'Binary not found',
    3: 'IPC command invalid',
    4: 'Unable to bind IPC socket',
    5: 'Connection timeout',
    6: 'MPV is already running',
    7: 'Could not send IPC message',
    8: 'MPV is not running',
    9: 'Unsupported protocol',
};

type NodeMpvError = {
    errcode: number;
    method: string;
    stackTrace: string;
    verbose: string;
};

const mpvLog = (
    data: { action: string; toast?: 'info' | 'success' | 'warning' },
    err?: NodeMpvError,
) => {
    const { action, toast } = data;

    if (err) {
        const message = `[AUDIO PLAYER] ${action} - mpv errorcode ${err.errcode} - ${
            NodeMpvErrorCode[err.errcode as keyof typeof NodeMpvErrorCode]
        }`;

        sendToastToRenderer({ message, type: 'error' });
        createLog({ message, type: 'error' });
    }

    const message = `[AUDIO PLAYER] ${action}`;
    createLog({ message, type: 'error' });
    if (toast) {
        sendToastToRenderer({ message, type: toast });
    }
};

const MPV_BINARY_PATH = store.get('mpv_path') as string | undefined;

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
    binaryPath?: string;
    extraParameters?: string[];
    properties?: Record<string, any>;
}): Promise<MpvAPI> => {
    const { extraParameters, properties, binaryPath } = data;

    const params = uniq([...DEFAULT_MPV_PARAMETERS(extraParameters), ...(extraParameters || [])]);

    const mpv = new MpvAPI(
        {
            audio_only: true,
            auto_restart: false,
            binary: binaryPath || MPV_BINARY_PATH || undefined,
            socket: socketPath,
            time_update: 1,
        },
        params,
    );

    try {
        await mpv.start();
    } catch (error: any) {
        console.log('mpv failed to start', error);
    } finally {
        await mpv.setMultipleProperties(properties || {});
    }

    mpv.on('status', (status) => {
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
        getMainWindow()?.webContents.send('renderer-player-play');
    });

    // Automatically updates the play button when the player is stopped
    mpv.on('stopped', () => {
        getMainWindow()?.webContents.send('renderer-player-stop');
    });

    // Automatically updates the play button when the player is paused
    mpv.on('paused', () => {
        getMainWindow()?.webContents.send('renderer-player-pause');
    });

    // Event output every interval set by time_update, used to update the current time
    mpv.on('timeposition', (time: number) => {
        getMainWindow()?.webContents.send('renderer-player-current-time', time);
    });

    return mpv;
};

export const getMpvInstance = () => {
    return mpvInstance;
};

const quit = async () => {
    const instance = getMpvInstance();
    if (instance) {
        await instance.quit();
        if (!isWindows()) {
            await rm(socketPath);
        }
    }
};

const setAudioPlayerFallback = (isError: boolean) => {
    getMainWindow()?.webContents.send('renderer-player-fallback', isError);
};

ipcMain.on('player-set-properties', async (_event, data: Record<string, any>) => {
    mpvLog({ action: `Setting properties: ${JSON.stringify(data)}` });
    if (data.length === 0) {
        return;
    }

    try {
        if (data.length === 1) {
            getMpvInstance()?.setProperty(Object.keys(data)[0], Object.values(data)[0]);
        } else {
            getMpvInstance()?.setMultipleProperties(data);
        }
    } catch (err: NodeMpvError | any) {
        mpvLog({ action: `Failed to set properties: ${JSON.stringify(data)}` }, err);
    }
});

ipcMain.handle(
    'player-restart',
    async (_event, data: { extraParameters?: string[]; properties?: Record<string, any> }) => {
        try {
            mpvLog({
                action: `Attempting to initialize mpv with parameters: ${JSON.stringify(data)}`,
            });

            // Clean up previous mpv instance
            getMpvInstance()?.stop();
            getMpvInstance()
                ?.quit()
                .catch((error) => {
                    mpvLog({ action: 'Failed to quit existing MPV' }, error);
                });
            mpvInstance = null;

            mpvInstance = await createMpv(data);
            mpvLog({ action: 'Restarted mpv', toast: 'success' });
            setAudioPlayerFallback(false);
        } catch (err: NodeMpvError | any) {
            mpvLog({ action: 'Failed to restart mpv, falling back to web player' }, err);
            setAudioPlayerFallback(true);
        }
    },
);

ipcMain.handle(
    'player-initialize',
    async (_event, data: { extraParameters?: string[]; properties?: Record<string, any> }) => {
        try {
            mpvLog({
                action: `Attempting to initialize mpv with parameters: ${JSON.stringify(data)}`,
            });
            mpvInstance = await createMpv(data);
            setAudioPlayerFallback(false);
        } catch (err: NodeMpvError | any) {
            mpvLog({ action: 'Failed to initialize mpv, falling back to web player' }, err);
            setAudioPlayerFallback(true);
        }
    },
);

ipcMain.on('player-quit', async () => {
    try {
        await getMpvInstance()?.stop();
        await quit();
    } catch (err: NodeMpvError | any) {
        mpvLog({ action: 'Failed to quit mpv' }, err);
    } finally {
        mpvInstance = null;
    }
});

ipcMain.handle('player-is-running', async () => {
    return getMpvInstance()?.isRunning();
});

ipcMain.handle('player-clean-up', async () => {
    getMpvInstance()?.stop();
    getMpvInstance()?.clearPlaylist();
});

ipcMain.on('player-start', async () => {
    try {
        await getMpvInstance()?.play();
    } catch (err: NodeMpvError | any) {
        mpvLog({ action: 'Failed to start mpv playback' }, err);
    }
});

// Starts the player
ipcMain.on('player-play', async () => {
    try {
        await getMpvInstance()?.play();
    } catch (err: NodeMpvError | any) {
        mpvLog({ action: 'Failed to start mpv playback' }, err);
    }
});

// Pauses the player
ipcMain.on('player-pause', async () => {
    try {
        await getMpvInstance()?.pause();
    } catch (err: NodeMpvError | any) {
        mpvLog({ action: 'Failed to pause mpv playback' }, err);
    }
});

// Stops the player
ipcMain.on('player-stop', async () => {
    try {
        await getMpvInstance()?.stop();
    } catch (err: NodeMpvError | any) {
        mpvLog({ action: 'Failed to stop mpv playback' }, err);
    }
});

// Goes to the next track in the playlist
ipcMain.on('player-next', async () => {
    try {
        await getMpvInstance()?.next();
    } catch (err: NodeMpvError | any) {
        mpvLog({ action: 'Failed to go to next track' }, err);
    }
});

// Goes to the previous track in the playlist
ipcMain.on('player-previous', async () => {
    try {
        await getMpvInstance()?.prev();
    } catch (err: NodeMpvError | any) {
        mpvLog({ action: 'Failed to go to previous track' }, err);
    }
});

// Seeks forward or backward by the given amount of seconds
ipcMain.on('player-seek', async (_event, time: number) => {
    try {
        await getMpvInstance()?.seek(time);
    } catch (err: NodeMpvError | any) {
        mpvLog({ action: `Failed to seek by ${time} seconds` }, err);
    }
});

// Seeks to the given time in seconds
ipcMain.on('player-seek-to', async (_event, time: number) => {
    try {
        await getMpvInstance()?.goToPosition(time);
    } catch (err: NodeMpvError | any) {
        mpvLog({ action: `Failed to seek to ${time} seconds` }, err);
    }
});

// Sets the queue in position 0 and 1 to the given data. Used when manually starting a song or using the next/prev buttons
ipcMain.on('player-set-queue', async (_event, data: PlayerData, pause?: boolean) => {
    if (!data.queue.current?.id && !data.queue.next?.id) {
        try {
            await getMpvInstance()?.clearPlaylist();
            await getMpvInstance()?.pause();
            return;
        } catch (err: NodeMpvError | any) {
            mpvLog({ action: `Failed to clear play queue` }, err);
        }
    }

    try {
        if (data.queue.current?.streamUrl) {
            await getMpvInstance()
                ?.load(data.queue.current.streamUrl, 'replace')
                .catch(() => {
                    getMpvInstance()?.play();
                });

            if (data.queue.next?.streamUrl) {
                await getMpvInstance()?.load(data.queue.next.streamUrl, 'append');
            }
        }

        if (pause) {
            await getMpvInstance()?.pause();
        } else if (pause === false) {
            // Only force play if pause is explicitly false
            await getMpvInstance()?.play();
        }
    } catch (err: NodeMpvError | any) {
        mpvLog({ action: `Failed to set play queue` }, err);
    }
});

// Replaces the queue in position 1 to the given data
ipcMain.on('player-set-queue-next', async (_event, data: PlayerData) => {
    try {
        const size = await getMpvInstance()?.getPlaylistSize();

        if (!size) {
            return;
        }

        if (size > 1) {
            await getMpvInstance()?.playlistRemove(1);
        }

        if (data.queue.next?.streamUrl) {
            await getMpvInstance()?.load(data.queue.next.streamUrl, 'append');
        }
    } catch (err: NodeMpvError | any) {
        mpvLog({ action: `Failed to set play queue` }, err);
    }
});

// Sets the next song in the queue when reaching the end of the queue
ipcMain.on('player-auto-next', async (_event, data: PlayerData) => {
    // Always keep the current song as position 0 in the mpv queue
    // This allows us to easily set update the next song in the queue without
    // disturbing the currently playing song
    try {
        await getMpvInstance()
            ?.playlistRemove(0)
            .catch(() => {
                getMpvInstance()?.pause();
            });

        if (data.queue.next?.streamUrl) {
            await getMpvInstance()?.load(data.queue.next.streamUrl, 'append');
        }
    } catch (err: NodeMpvError | any) {
        mpvLog({ action: `Failed to load next song` }, err);
    }
});

// Sets the volume to the given value (0-100)
ipcMain.on('player-volume', async (_event, value: number) => {
    try {
        if (!value || value < 0 || value > 100) {
            return;
        }

        await getMpvInstance()?.volume(value);
    } catch (err: NodeMpvError | any) {
        mpvLog({ action: `Failed to set volume to ${value}` }, err);
    }
});

// Toggles the mute status
ipcMain.on('player-mute', async (_event, mute: boolean) => {
    try {
        await getMpvInstance()?.mute(mute);
    } catch (err: NodeMpvError | any) {
        mpvLog({ action: `Failed to set mute status` }, err);
    }
});

ipcMain.handle('player-get-time', async (): Promise<number | undefined> => {
    try {
        return getMpvInstance()?.getTimePosition();
    } catch (err: NodeMpvError | any) {
        mpvLog({ action: `Failed to get current time` }, err);
        return 0;
    }
});

enum MpvState {
    STARTED,
    IN_PROGRESS,
    DONE,
}

let mpvState = MpvState.STARTED;

app.on('before-quit', async (event) => {
    switch (mpvState) {
        case MpvState.DONE:
            return;
        case MpvState.IN_PROGRESS:
            event.preventDefault();
            break;
        case MpvState.STARTED: {
            try {
                mpvState = MpvState.IN_PROGRESS;
                event.preventDefault();
                await getMpvInstance()?.stop();
                await quit();
            } catch (err: NodeMpvError | any) {
                mpvLog({ action: `Failed to cleanly before-quit` }, err);
            } finally {
                mpvState = MpvState.DONE;
                app.quit();
            }
            break;
        }
    }
});
