import { net } from 'electron';

import { getMainWindow } from '../../../index';
import { isMacOS } from '../../../utils';
import { PlayerData } from '/@/shared/types/domain-types';

// macOS Now Playing / Control Center integration.
//
// The HTML5 MediaSession API (which Electron forwards to the
// macOS Now Playing info-center) lives in the renderer process.
// This file acts as coordinator: whenever the track or playback
// state changes it sends an IPC message to the renderer which
// then updates its MediaSession object.  Electron on macOS
// automatically mirrors that into the Control Center widget and
// Touch Bar.

let lastImageUrl: null | string = null;
let lastImageData: null | string = null;

async function fetchImageAsDataUrl(url: string): Promise<null | string> {
    if (lastImageUrl === url && lastImageData) {
        return lastImageData;
    }

    return new Promise((resolve) => {
        const request = net.request(url);
        const chunks: Buffer[] = [];

        request.on('response', (response) => {
            const contentType = (response.headers['content-type'] as string) || 'image/jpeg';

            response.on('data', (chunk) => {
                chunks.push(chunk as Buffer);
            });

            response.on('end', () => {
                const buffer = Buffer.concat(chunks);
                const dataUrl = `data:${contentType};base64,${buffer.toString('base64')}`;
                lastImageUrl = url;
                lastImageData = dataUrl;
                resolve(dataUrl);
            });

            response.on('error', () => resolve(null));
        });

        request.on('error', () => resolve(null));
        request.end();
    });
}

export async function updateNowPlaying(data: PlayerData): Promise<void> {
    if (!isMacOS()) return;

    const window = getMainWindow();
    if (!window) return;

    const song = data.currentSong;
    if (!song) {
        window.webContents.send('update-media-session', null);
        return;
    }

    let artworkDataUrl: null | string = null;
    if (song.imageUrl) {
        artworkDataUrl = await fetchImageAsDataUrl(song.imageUrl).catch(() => null);
    }

    window.webContents.send('update-media-session', {
        album: song.album ?? '',
        artist: song.artistName ?? '',
        artworkDataUrl,
        duration: song.duration ?? 0,
        playbackState: data.status,
        title: song.name,
    });
}
