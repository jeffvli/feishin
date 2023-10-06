import console from 'console';
import { ipcMain } from 'electron';
import { getMpvInstance } from '../../../main';
import { PlayerData } from '/@/renderer/store';

declare module 'node-mpv';

// function wait(timeout: number) {
//     return new Promise((resolve) => {
//         setTimeout(() => {
//             resolve('resolved');
//         }, timeout);
//     });
// }

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
            getMpvInstance()
                ?.load(data.queue.current.streamUrl, 'replace')
                .catch((err) => {
                    console.log('MPV failed to load song', err);
                    getMpvInstance()?.play();
                });

            if (data.queue.next) {
                getMpvInstance()?.load(data.queue.next.streamUrl, 'append');
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
