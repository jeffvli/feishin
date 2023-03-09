import { ipcMain } from 'electron';
import { mpv } from '../../../main';
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
  await mpv.load('./dummy.mp3', 'replace');
  await mpv.play();
});

// Starts the player
ipcMain.on('player-play', async () => {
  await mpv.play();
});

// Pauses the player
ipcMain.on('player-pause', async () => {
  await mpv.pause();
});

// Stops the player
ipcMain.on('player-stop', async () => {
  await mpv.stop();
});

// Goes to the next track in the playlist
ipcMain.on('player-next', async () => {
  await mpv.next();
});

// Goes to the previous track in the playlist
ipcMain.on('player-previous', async () => {
  await mpv.prev();
});

// Seeks forward or backward by the given amount of seconds
ipcMain.on('player-seek', async (_event, time: number) => {
  await mpv.seek(time);
});

// Seeks to the given time in seconds
ipcMain.on('player-seek-to', async (_event, time: number) => {
  await mpv.goToPosition(time);
});

// Sets the queue in position 0 and 1 to the given data. Used when manually starting a song or using the next/prev buttons
ipcMain.on('player-set-queue', async (_event, data: PlayerData) => {
  if (!data.queue.current && !data.queue.next) {
    await mpv.clearPlaylist();
    await mpv.pause();
    return;
  }

  let complete = false;

  while (!complete) {
    try {
      if (data.queue.current) {
        await mpv.load(data.queue.current.streamUrl, 'replace');
      }

      if (data.queue.next) {
        await mpv.load(data.queue.next.streamUrl, 'append');
      }

      await mpv.play();
      complete = true;
    } catch (err) {
      console.error(err);
      await wait(500);
    }
  }
});

// Replaces the queue in position 1 to the given data
ipcMain.on('player-set-queue-next', async (_event, data: PlayerData) => {
  const size = await mpv.getPlaylistSize();

  if (size > 1) {
    await mpv.playlistRemove(1);
  }

  if (data.queue.next) {
    await mpv.load(data.queue.next.streamUrl, 'append');
  }
});

// Sets the next song in the queue when reaching the end of the queue
ipcMain.on('player-auto-next', async (_event, data: PlayerData) => {
  // Always keep the current song as position 0 in the mpv queue
  // This allows us to easily set update the next song in the queue without
  // disturbing the currently playing song
  await mpv.playlistRemove(0);

  if (data.queue.next) {
    await mpv.load(data.queue.next.streamUrl, 'append');
  }
});

// Sets the volume to the given value (0-100)
ipcMain.on('player-volume', async (_event, value: number) => {
  await mpv.volume(value);
});

// Toggles the mute status
ipcMain.on('player-mute', async () => {
  await mpv.mute();
});

ipcMain.on('player-quit', async () => {
  await mpv.stop();
});
