import { z } from 'zod';

import { jfType } from '/@/shared/api/jellyfin/jellyfin-types';
import {
    Album,
    AlbumArtist,
    Folder,
    Genre,
    LibraryItem,
    MusicFolder,
    Playlist,
    RelatedArtist,
    Song,
} from '/@/shared/types/domain-types';
import { ServerListItem, ServerType } from '/@/shared/types/types';

const TICKS_PER_MS = 10000;

type AlbumOrSong = z.infer<typeof jfType._response.album> | z.infer<typeof jfType._response.song>;

const KEYS_TO_OMIT = new Set(['AlbumArtist', 'Artist']);

const getPeople = (item: AlbumOrSong): null | Record<string, RelatedArtist[]> => {
    if (item.People) {
        const participants: Record<string, RelatedArtist[]> = {};

        for (const person of item.People) {
            const key = person.Type || '';
            if (KEYS_TO_OMIT.has(key)) {
                continue;
            }

            const item: RelatedArtist = {
                // for other roles, we just want to display this and not filter.
                // filtering (and links) would require a separate field, PersonIds
                id: '',
                imageId: null,
                imageUrl: null,
                name: person.Name,
            };

            if (key in participants) {
                participants[key].push(item);
            } else {
                participants[key] = [item];
            }
        }

        return participants;
    }

    return null;
};

const getTags = (item: AlbumOrSong): null | Record<string, string[]> => {
    if (item.Tags) {
        const tags: Record<string, string[]> = {};
        for (const tag of item.Tags) {
            tags[tag] = [];
        }

        return tags;
    }

    return null;
};

const getSongImageId = (item: z.infer<typeof jfType._response.song>): null | string => {
    if (item.ImageTags?.Primary) {
        return item.Id;
    }

    if (item.AlbumPrimaryImageTag && item.AlbumId) {
        return item.AlbumId;
    }

    return null;
};

const getAlbumImageId = (item: z.infer<typeof jfType._response.album>): null | string => {
    if (item.ImageTags?.Primary) {
        return item.Id;
    }

    return null;
};

const getAlbumArtistImageId = (
    item: z.infer<typeof jfType._response.albumArtist>,
): null | string => {
    if (item.ImageTags?.Primary) {
        return item.Id;
    }

    return null;
};

const getPlaylistImageId = (item: z.infer<typeof jfType._response.playlist>): null | string => {
    if (item.ImageTags?.Primary) {
        return item.Id;
    }

    return null;
};

const normalizeSong = (
    item: z.infer<typeof jfType._response.song>,
    server: null | ServerListItem,
): Song => {
    let bitRate = 0;
    let channels: null | number = null;
    let container: null | string = null;
    let path: null | string = null;
    let sampleRate: null | number = null;
    let size = 0;

    if (item.MediaSources?.length) {
        const source = item.MediaSources[0];

        container = source.Container;
        path = source.Path;
        size = source.Size;

        if ((source.MediaStreams?.length || 0) > 0) {
            for (const stream of source.MediaStreams) {
                if (stream.Type === 'Audio') {
                    bitRate =
                        stream.BitRate !== undefined
                            ? Number(Math.trunc(stream.BitRate / 1000))
                            : 0;
                    channels = stream.Channels || null;
                    sampleRate = stream.SampleRate || null;
                    break;
                }
            }
        }
    } else {
        console.warn('Jellyfin song retrieved with no media sources', item);
    }

    return {
        _itemType: LibraryItem.SONG,
        _serverId: server?.id || '',
        _serverType: ServerType.JELLYFIN,
        album: item.Album,
        albumArtists: item.AlbumArtists?.map((entry) => ({
            id: entry.Id,
            imageId: entry.Id,
            imageUrl: null,
            name: entry.Name,
        })),
        albumId: item.AlbumId || `dummy/${item.Id}`,
        artistName: item?.ArtistItems?.[0]?.Name || item?.AlbumArtists?.[0]?.Name,
        artists: (item?.ArtistItems?.length ? item.ArtistItems : item.AlbumArtists)?.map(
            (entry) => ({
                id: entry.Id,
                imageId: entry.Id,
                imageUrl: null,
                name: entry.Name,
            }),
        ),
        bitDepth: null,
        bitRate,
        bpm: null,
        channels,
        comment: null,
        compilation: null,
        container,
        createdAt: item.DateCreated,
        discNumber: (item.ParentIndexNumber && item.ParentIndexNumber) || 1,
        discSubtitle: null,
        duration: item.RunTimeTicks / TICKS_PER_MS,
        explicitStatus: null,
        gain:
            item.NormalizationGain !== undefined
                ? {
                      track: item.NormalizationGain,
                  }
                : item.LUFS
                  ? {
                        track: -18 - item.LUFS,
                    }
                  : null,
        genres: item.GenreItems?.map((entry) => ({
            _itemType: LibraryItem.GENRE,
            _serverId: server?.id || '',
            _serverType: ServerType.JELLYFIN,
            albumCount: null,
            id: entry.Id,
            imageId: null,
            imageUrl: null,
            name: entry.Name,
            songCount: null,
        })),
        id: item.Id,
        imageId: getSongImageId(item),
        imageUrl: null,
        lastPlayedAt: null,
        lyrics: null,
        mbzRecordingId: null,
        mbzTrackId: item.ProviderIds?.MusicBrainzTrack || null,
        name: item.Name,
        participants: getPeople(item),
        path,
        peak: null,
        playCount: (item.UserData && item.UserData.PlayCount) || 0,
        playlistItemId: item.PlaylistItemId,
        releaseDate: item.PremiereDate ? item.PremiereDate : null,
        releaseYear: item.ProductionYear || null,
        sampleRate,
        size,
        tags: getTags(item),
        trackNumber: item.IndexNumber,
        updatedAt: item.DateCreated,
        userFavorite: (item.UserData && item.UserData.IsFavorite) || false,
        userRating: null,
    };
};

const normalizeAlbum = (
    item: z.infer<typeof jfType._response.album>,
    server: null | ServerListItem,
): Album => {
    return {
        _itemType: LibraryItem.ALBUM,
        _serverId: server?.id || '',
        _serverType: ServerType.JELLYFIN,
        albumArtist: item.AlbumArtist,
        albumArtists:
            item.AlbumArtists.map((entry) => ({
                id: entry.Id,
                imageId: entry.Id,
                imageUrl: null,
                name: entry.Name,
            })) || [],
        artists: (item.ArtistItems?.length ? item.ArtistItems : item.AlbumArtists)?.map(
            (entry) => ({
                id: entry.Id,
                imageId: entry.Id,
                imageUrl: null,
                name: entry.Name,
            }),
        ),
        comment: null,
        createdAt: item.DateCreated,
        duration: item.RunTimeTicks / TICKS_PER_MS,
        explicitStatus: null,
        genres:
            item.GenreItems?.map((entry) => ({
                _itemType: LibraryItem.GENRE,
                _serverId: server?.id || '',
                _serverType: ServerType.JELLYFIN,
                albumCount: null,
                id: entry.Id,
                imageId: null,
                imageUrl: null,
                name: entry.Name,
                songCount: null,
            })) || [],
        id: item.Id,
        imageId: getAlbumImageId(item),
        imageUrl: null,
        isCompilation: null,
        lastPlayedAt: null,
        mbzId: item.ProviderIds?.MusicBrainzAlbum || null,
        name: item.Name,
        originalDate: null,
        participants: getPeople(item),
        playCount: item.UserData?.PlayCount || 0,
        recordLabels: item.Studios?.map((entry) => entry.Name) || [],
        releaseDate: item.PremiereDate || null,
        releaseTypes: [],
        releaseYear: item.ProductionYear || null,
        size: null,
        songCount: item?.ChildCount || null,
        songs: item.Songs?.map((song) => normalizeSong(song, server)),
        tags: getTags(item),
        updatedAt: item?.DateLastMediaAdded || item.DateCreated,
        userFavorite: item.UserData?.IsFavorite || false,
        userRating: null,
        version: null,
    };
};

const normalizeAlbumArtist = (
    item: z.infer<typeof jfType._response.albumArtist> & {
        similarArtists?: z.infer<typeof jfType._response.albumArtistList>;
    },
    server: null | ServerListItem,
): AlbumArtist => {
    const similarArtists =
        item.similarArtists?.Items?.filter((entry) => entry.Name !== 'Various Artists').map(
            (entry) => ({
                id: entry.Id,
                imageId: entry.Id,
                imageUrl: null,
                name: entry.Name,
            }),
        ) || [];

    return {
        _itemType: LibraryItem.ALBUM_ARTIST,
        _serverId: server?.id || '',
        _serverType: ServerType.JELLYFIN,
        albumCount: item.AlbumCount ?? null,
        biography: item.Overview || null,
        duration: item.RunTimeTicks / TICKS_PER_MS,
        genres: item.GenreItems?.map((entry) => ({
            _itemType: LibraryItem.GENRE,
            _serverId: server?.id || '',
            _serverType: ServerType.JELLYFIN,
            albumCount: null,
            id: entry.Id,
            imageId: null,
            imageUrl: null,
            name: entry.Name,
            songCount: null,
        })),
        id: item.Id,
        imageId: getAlbumArtistImageId(item),
        imageUrl: null,
        lastPlayedAt: null,
        mbz: item.ProviderIds?.MusicBrainzArtist || null,
        name: item.Name,
        playCount: item.UserData?.PlayCount || 0,
        similarArtists,
        songCount: item.SongCount ?? null,
        userFavorite: item.UserData?.IsFavorite || false,
        userRating: null,
    };
};

const normalizePlaylist = (
    item: z.infer<typeof jfType._response.playlist>,
    server: null | ServerListItem,
): Playlist => {
    return {
        _itemType: LibraryItem.PLAYLIST,
        _serverId: server?.id || '',
        _serverType: ServerType.JELLYFIN,
        description: item.Overview || null,
        duration: item.RunTimeTicks / TICKS_PER_MS,
        genres: item.GenreItems?.map((entry) => ({
            _itemType: LibraryItem.GENRE,
            _serverId: server?.id || '',
            _serverType: ServerType.JELLYFIN,
            albumCount: null,
            id: entry.Id,
            imageId: null,
            imageUrl: null,
            name: entry.Name,
            songCount: null,
        })),
        id: item.Id,
        imageId: getPlaylistImageId(item),
        imageUrl: null,
        name: item.Name,
        owner: null,
        ownerId: null,
        public: null,
        rules: null,
        size: null,
        songCount: item?.ChildCount || null,
        sync: null,
    };
};

const normalizeMusicFolder = (item: z.infer<typeof jfType._response.musicFolder>): MusicFolder => {
    return {
        id: item.Id,
        name: item.Name,
    };
};

// const normalizeArtist = (item: any) => {
//   return {
//     album: (item.album || []).map((entry: any) => normalizeAlbum(entry)),
//     albumCount: item.AlbumCount,
//     duration: item.RunTimeTicks / 10000000,
//     genre: item.GenreItems && item.GenreItems.map((entry: any) => normalizeItem(entry)),
//     id: item.Id,
//     image: getCoverArtUrl(item),
//     info: {
//       biography: item.Overview,
//       externalUrl: (item.ExternalUrls || []).map((entry: any) => normalizeItem(entry)),
//       imageUrl: undefined,
//       similarArtist: (item.similarArtist || []).map((entry: any) => normalizeArtist(entry)),
//     },
//     starred: item.UserData && item.UserData?.IsFavorite ? 'true' : undefined,
//     title: item.Name,
//     uniqueId: nanoid(),
//   };
// };

const normalizeGenre = (
    item: z.infer<typeof jfType._response.genre>,
    server: null | ServerListItem,
): Genre => {
    return {
        _itemType: LibraryItem.GENRE,
        _serverId: server?.id || '',
        _serverType: ServerType.JELLYFIN,
        albumCount: null,
        id: item.Id,
        imageId: item.Id,
        imageUrl: null,
        name: item.Name,
        songCount: null,
    };
};

const normalizeFolder = (
    item: z.infer<typeof jfType._response.folder>,
    server: null | ServerListItem,
): Folder => {
    return {
        _itemType: LibraryItem.FOLDER,
        _serverId: server?.id || 'unknown',
        _serverType: ServerType.JELLYFIN,
        children: undefined,
        id: item.Id,
        name: item.Name || 'Unknown folder',
        parentId: item.ParentId,
    };
};

// const normalizeScanStatus = () => {
//   return {
//     count: 'N/a',
//     scanning: false,
//   };
// };

export const jfNormalize = {
    album: normalizeAlbum,
    albumArtist: normalizeAlbumArtist,
    folder: normalizeFolder,
    genre: normalizeGenre,
    musicFolder: normalizeMusicFolder,
    playlist: normalizePlaylist,
    song: normalizeSong,
};
