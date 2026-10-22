import { describe, expect, it } from 'vitest';

import { searchLibraryItems } from '/@/renderer/features/shared/utils';
import { Album, LibraryItem, Song } from '/@/shared/types/domain-types';

const artist = (name: string) => ({ id: name, name }) as Album['artists'][number];

const albums = [
    {
        albumArtists: [artist('Daft Punk')],
        artists: [],
        genres: [{ name: 'House' }],
        id: 'a',
        name: 'Discovery',
    },
    {
        albumArtists: [artist('Radiohead')],
        artists: [],
        genres: [{ name: 'Rock' }],
        id: 'b',
        name: 'OK Computer',
    },
    {
        albumArtists: [artist('Radiohead')],
        artists: [],
        genres: [],
        id: 'c',
        name: 'Kid A',
        releaseType: 'album',
    },
] as unknown as Album[];

const ids = (items: { id: string }[]) => items.map((item) => item.id);

describe('searchLibraryItems', () => {
    it.each(['', '   ', undefined])('returns all items for the search term %j', (term) => {
        expect(searchLibraryItems(albums, term, LibraryItem.ALBUM)).toBe(albums);
    });

    it('matches albums by name, artist and genre', () => {
        expect(ids(searchLibraryItems(albums, 'discovery', LibraryItem.ALBUM))).toEqual(['a']);
        expect(ids(searchLibraryItems(albums, 'radiohead', LibraryItem.ALBUM)).sort()).toEqual([
            'b',
            'c',
        ]);
        expect(ids(searchLibraryItems(albums, 'house', LibraryItem.ALBUM))).toEqual(['a']);
    });

    it('tolerates small typos', () => {
        expect(ids(searchLibraryItems(albums, 'radiohaed', LibraryItem.ALBUM)).sort()).toEqual([
            'b',
            'c',
        ]);
    });

    it('returns nothing for unrelated terms', () => {
        expect(searchLibraryItems(albums, 'metallica', LibraryItem.ALBUM)).toEqual([]);
    });

    it('matches songs by album and artist', () => {
        const songs = [
            {
                album: 'Discovery',
                albumArtists: [],
                artists: [artist('Daft Punk')],
                id: 's1',
                name: 'One More Time',
            },
            {
                album: 'Homework',
                albumArtists: [],
                artists: [artist('Daft Punk')],
                id: 's2',
                name: 'Da Funk',
            },
            {
                album: 'Kid A',
                albumArtists: [],
                artists: [artist('Radiohead')],
                id: 's3',
                name: 'Idioteque',
            },
        ] as unknown as Song[];

        expect(ids(searchLibraryItems(songs, 'homework', LibraryItem.SONG))).toEqual(['s2']);
        expect(ids(searchLibraryItems(songs, 'daft punk', LibraryItem.SONG)).sort()).toEqual([
            's1',
            's2',
        ]);
    });
});
