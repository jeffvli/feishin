import isElectron from 'is-electron';
import { QueueSong } from '/@/renderer/api/types';

const remote = isElectron() ? window.electron.remote : null;
const mediaSession = navigator.mediaSession;

export const updateSong = (song: QueueSong | undefined) => {
    if (mediaSession) {
        let metadata: MediaMetadata;

        if (song?.id) {
            let artwork: MediaImage[];

            if (song.imageUrl) {
                const image300 = song.imageUrl
                    ?.replace(/&size=\d+/, '&size=300')
                    .replace(/\?width=\d+/, '?width=300')
                    .replace(/&height=\d+/, '&height=300');

                artwork = [{ sizes: '300x300', src: image300, type: 'image/png' }];
            } else {
                artwork = [];
            }

            metadata = new MediaMetadata({
                album: song.album ?? '',
                artist: song.artistName,
                artwork,
                title: song.name,
            });
        } else {
            metadata = new MediaMetadata();
        }

        mediaSession.metadata = metadata;
    }

    remote?.updateSong(song);
};
