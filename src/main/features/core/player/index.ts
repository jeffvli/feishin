import { ipcMain } from 'electron';
import { getMainWindow, getMpvInstance } from '../../../main';
import { PlayerData } from '/@/renderer/store';

declare module 'node-mpv';

function wait(timeout: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('resolved');
    }, timeout);
  });
}

ipcMain.on('player-start', async () => {
  await getMpvInstance()?.play();
});

// Starts the player
ipcMain.on('player-play', async () => {
  await getMpvInstance()?.play();
});

// Pauses the player
ipcMain.on('player-pause', async () => {
  await getMpvInstance()?.pause();
});

// Stops the player
ipcMain.on('player-stop', async () => {
  await getMpvInstance()?.stop();
});

// Goes to the next track in the playlist
ipcMain.on('player-next', async () => {
  await getMpvInstance()?.next();
});

// Goes to the previous track in the playlist
ipcMain.on('player-previous', async () => {
  await getMpvInstance()?.prev();
});

// Seeks forward or backward by the given amount of seconds
ipcMain.on('player-seek', async (_event, time: number) => {
  await getMpvInstance()?.seek(time);
});

// Seeks to the given time in seconds
ipcMain.on('player-seek-to', async (_event, time: number) => {
  await getMpvInstance()?.goToPosition(time);
});

// Sets the queue in position 0 and 1 to the given data. Used when manually starting a song or using the next/prev buttons
ipcMain.on('player-set-queue', async (_event, data: PlayerData) => {
  if (!data.queue.current && !data.queue.next) {
    await getMpvInstance()?.clearPlaylist();
    await getMpvInstance()?.pause();
    return;
  }

  let complete = false;
  let tryAttempts = 0;

  while (!complete) {
    if (tryAttempts > 3) {
      getMainWindow()?.webContents.send('renderer-player-error', 'Failed to load song');
      complete = true;
    } else {
      try {
        if (data.queue.current) {
          await getMpvInstance()?.load(data.queue.current.streamUrl, 'replace');
        }

        if (data.queue.next) {
          await getMpvInstance()?.load(data.queue.next.streamUrl, 'append');
        }

        complete = true;
      } catch (err) {
        console.error(err);
        tryAttempts += 1;
        await wait(500);
      }
    }
  }
});

// Replaces the queue in position 1 to the given data
ipcMain.on('player-set-queue-next', async (_event, data: PlayerData) => {
  const size = await getMpvInstance()?.getPlaylistSize();

  if (!size) {
    return;
  }

  if (size > 1) {
    await getMpvInstance()?.playlistRemove(1);
  }

  if (data.queue.next) {
    await getMpvInstance()?.load(data.queue.next.streamUrl, 'append');
  }
});

// Sets the next song in the queue when reaching the end of the queue
ipcMain.on('player-auto-next', async (_event, data: PlayerData) => {
  // Always keep the current song as position 0 in the mpv queue
  // This allows us to easily set update the next song in the queue without
  // disturbing the currently playing song
  await getMpvInstance()?.playlistRemove(0);

  if (data.queue.next) {
    await getMpvInstance()?.load(data.queue.next.streamUrl, 'append');
  }
});

// Sets the volume to the given value (0-100)
ipcMain.on('player-volume', async (_event, value: number) => {
  await getMpvInstance()?.volume(value);
});

// Toggles the mute status
ipcMain.on('player-mute', async () => {
  await getMpvInstance()?.mute();
});
