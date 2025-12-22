import Fuse from 'fuse.js';
import z from 'zod';

import i18n from '/@/i18n/i18n';
import {
    Album,
    AlbumArtist,
    Artist,
    Genre,
    InternetRadioStation,
    LibraryItem,
    Playlist,
    QueueSong,
    Song,
} from '/@/shared/types/domain-types';
import { Play } from '/@/shared/types/types';

export const PLAY_TYPES = [
    {
        label: i18n.t('player.play', { postProcess: 'sentenceCase' }),
        play: Play.NOW,
    },
    {
        label: i18n.t('player.shuffle', { postProcess: 'sentenceCase' }),
        play: Play.SHUFFLE,
    },
    {
        label: i18n.t('player.addLast', { postProcess: 'sentenceCase' }),
        play: Play.LAST,
    },
    {
        label: i18n.t('player.addNext', { postProcess: 'sentenceCase' }),
        play: Play.NEXT,
    },
];

export const customFiltersSchema = z.record(z.string(), z.any());

enum AlbumFilterKeys {
    _CUSTOM = '_custom',
    ARTIST_IDS = 'artistIds',
    COMPILATION = 'compilation',
    FAVORITE = 'favorite',
    GENRE_ID = 'genreIds',
    HAS_RATING = 'hasRating',
    MAX_YEAR = 'maxYear',
    MIN_YEAR = 'minYear',
    RECENTLY_PLAYED = 'isRecentlyPlayed',
}

enum ArtistFilterKeys {
    ROLE = 'role',
}

enum SharedFilterKeys {
    MUSIC_FOLDER_ID = 'musicFolderId',
    SEARCH_TERM = 'searchTerm',
    SORT_BY = 'sortBy',
    SORT_ORDER = 'sortOrder',
}

enum SongFilterKeys {
    _CUSTOM = '_custom',
    ALBUM_IDS = 'albumIds',
    ARTIST_IDS = 'artistIds',
    FAVORITE = 'favorite',
    GENRE_ID = 'genreIds',
    MAX_YEAR = 'maxYear',
    MIN_YEAR = 'minYear',
}

const PaginationFilterKeys = {
    CURRENT_PAGE: 'currentPage',
    SCROLL_OFFSET: 'scrollOffset',
};

enum FolderFilterKeys {
    FOLDER_PATH = 'folderPath',
}

enum PlaylistFilterKeys {
    CUSTOM = '_custom',
}

export const FILTER_KEYS = {
    ALBUM: AlbumFilterKeys,
    ARTIST: ArtistFilterKeys,
    FOLDER: FolderFilterKeys,
    PAGINATION: PaginationFilterKeys,
    PLAYLIST: PlaylistFilterKeys,
    SHARED: SharedFilterKeys,
    SONG: SongFilterKeys,
};

interface CreateFuseOptions {
    fieldNormWeight?: number;
    ignoreLocation?: boolean;
    threshold?: number;
}

type FuseSearchableItem =
    | Album
    | AlbumArtist
    | Artist
    | Genre
    | InternetRadioStation
    | Playlist
    | QueueSong
    | Song;

export const createFuseForLibraryItem = <T extends FuseSearchableItem>(
    items: T[],
    itemType: LibraryItem,
    options: CreateFuseOptions = {},
): Fuse<T> => {
    const { fieldNormWeight = 1, ignoreLocation = true, threshold = 0.3 } = options;

    if (items.length === 0) {
        return new Fuse(items, {
            fieldNormWeight,
            ignoreLocation,
            keys: [],
            threshold,
        });
    }

    const sampleItem = items[0];

    const stringKeys = Object.keys(sampleItem).filter(
        (key) =>
            typeof sampleItem[key as keyof T] === 'string' &&
            !key.startsWith('_') &&
            key !== 'id' &&
            key !== 'albumId' &&
            key !== 'streamUrl' &&
            key !== 'serverId' &&
            key !== 'ownerId',
    ) as string[];

    const nestedKeys: Array<{ getFn: (item: T) => string; name: string }> = [];

    switch (itemType) {
        case LibraryItem.ALBUM: {
            nestedKeys.push(
                {
                    getFn: (item) => {
                        const a = item as Album;
                        return a.artists?.map((artist) => artist.name).join(' ') || '';
                    },
                    name: 'artists',
                },
                {
                    getFn: (item) => {
                        const a = item as Album;
                        return a.albumArtists?.map((artist) => artist.name).join(' ') || '';
                    },
                    name: 'albumArtists',
                },
                {
                    getFn: (item) => {
                        const a = item as Album;
                        return a.genres?.map((genre) => genre.name).join(' ') || '';
                    },
                    name: 'genres',
                },
            );
            break;
        }

        case LibraryItem.ALBUM_ARTIST: {
            nestedKeys.push({
                getFn: (item) => {
                    const aa = item as AlbumArtist;
                    return aa.genres?.map((genre) => genre.name).join(' ') || '';
                },
                name: 'genres',
            });
            break;
        }

        case LibraryItem.ARTIST:
        case LibraryItem.GENRE:
        case LibraryItem.RADIO_STATION:
            break;

        case LibraryItem.PLAYLIST: {
            nestedKeys.push({
                getFn: (item) => {
                    const p = item as Playlist;
                    return p.genres?.map((genre) => genre.name).join(' ') || '';
                },
                name: 'genres',
            });
            break;
        }

        case LibraryItem.PLAYLIST_SONG:
        case LibraryItem.QUEUE_SONG:
        case LibraryItem.SONG: {
            nestedKeys.push(
                {
                    getFn: (item) => {
                        const s = item as QueueSong | Song;
                        return s.artists?.map((artist) => artist.name).join(' ') || '';
                    },
                    name: 'artists',
                },
                {
                    getFn: (item) => {
                        const s = item as QueueSong | Song;
                        return s.albumArtists?.map((artist) => artist.name).join(' ') || '';
                    },
                    name: 'albumArtists',
                },
            );
            break;
        }
    }

    return new Fuse(items, {
        fieldNormWeight,
        ignoreLocation,
        keys: [...stringKeys, ...nestedKeys],
        threshold,
    });
};

export const searchLibraryItems = <T extends FuseSearchableItem>(
    items: T[],
    searchTerm: string,
    itemType: LibraryItem,
    options?: CreateFuseOptions,
): T[] => {
    if (!searchTerm.trim()) {
        return items;
    }

    const fuse = createFuseForLibraryItem(items, itemType, options);
    return fuse.search(searchTerm).map((result) => result.item);
};
