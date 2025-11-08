import Fuse from 'fuse.js';

import { QueueSong } from '/@/shared/types/domain-types';

export const searchSongs = (songs: QueueSong[], searchTerm: string) => {
    const fuse = new Fuse(songs, {
        fieldNormWeight: 1,
        ignoreLocation: true,
        keys: [
            'name',
            'album',
            {
                getFn: (song) => song.artists.map((artist) => artist.name),
                name: 'artist',
            },
        ],
        threshold: 0,
    });
    return fuse.search(searchTerm).map((item) => item.item);
};
