import isElectron from 'is-electron';

import { QueueSong } from '/@/shared/types/domain-types';

const remote = isElectron() ? window.api.remote : null;
const mediaSession = navigator.mediaSession;

export const updateSong = (song: QueueSong | undefined, imageUrl?: null | string) => {
    if (mediaSession) {
        let metadata: MediaMetadata;

        if (song?.id) {
            let artwork: MediaImage[];

            if (imageUrl) {
                artwork = [{ sizes: '300x300', src: imageUrl, type: 'image/png' }];
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
