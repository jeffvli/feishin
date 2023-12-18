import { nanoid } from 'nanoid';
import { z } from 'zod';
import { SubsonicApi } from '/@/renderer/api/subsonic/subsonic-types';
import {
    QueueSong,
    LibraryItem,
    AlbumArtist,
    Album,
    Genre,
    MusicFolder,
    Playlist,
} from '/@/renderer/api/types';
import { ServerListItem, ServerType } from '/@/renderer/types';

const getCoverArtUrl = (args: {
    baseUrl: string | undefined;
    coverArtId?: string;
    credential: string | undefined;
    size: number;
}) => {
    const size = args.size ? args.size : 250;

    if (!args.coverArtId || args.coverArtId.match('2a96cbd8b46e442fc41c2b86b821562f')) {
        return null;
    }

    return (
        `${args.baseUrl}/rest/getCoverArt.view` +
        `?id=${args.coverArtId}` +
        `&${args.credential}` +
        '&v=1.13.0' +
        '&c=feishin' +
        `&size=${size}`
    );
};

const normalizeSong = (
    item: z.infer<typeof SubsonicApi._baseTypes.song>,
    server: ServerListItem | null,
    deviceId: string,
): QueueSong => {
    const imageUrl =
        getCoverArtUrl({
            baseUrl: server?.url,
            coverArtId: item.coverArt,
            credential: server?.credential,
            size: 100,
        }) || null;

    const streamUrl = `${server?.url}/rest/stream.view?id=${item.id}&v=1.13.0&c=feishin_${deviceId}&${server?.credential}`;

    return {
        album: item.album || '',
        albumArtists: [
            {
                id: item.artistId || '',
                imageUrl: null,
                name: item.artist || '',
            },
        ],
        albumId: item.albumId || '',
        artistName: item.artist || '',
        artists: [
            {
                id: item.artistId || '',
                imageUrl: null,
                name: item.artist || '',
            },
        ],
        bitRate: item.bitRate || 0,
        bpm: null,
        channels: null,
        comment: null,
        compilation: null,
        container: item.contentType,
        createdAt: item.created,
        discNumber: item.discNumber || 1,
        discSubtitle: null,
        duration: item.duration ? item.duration * 1000 : 0,
        gain: null,
        genres: item.genre
            ? [
                  {
                      id: item.genre,
                      imageUrl: null,
                      itemType: LibraryItem.GENRE,
                      name: item.genre,
                  },
              ]
            : [],
        id: item.id,
        imagePlaceholderUrl: null,
        imageUrl,
        itemType: LibraryItem.SONG,
        lastPlayedAt: null,
        lyrics: null,
        name: item.title,
        path: item.path,
        peak: null,
        playCount: item?.playCount || 0,
        releaseDate: null,
        releaseYear: item.year ? String(item.year) : null,
        serverId: server?.id || 'unknown',
        serverType: ServerType.SUBSONIC,
        size: item.size,
        streamUrl,
        trackNumber: item.track || 1,
        uniqueId: nanoid(),
        updatedAt: '',
        userFavorite: item.starred || false,
        userRating: item.userRating || null,
    };
};

const normalizeAlbumArtist = (
    item:
        | z.infer<typeof SubsonicApi._baseTypes.artist>
        | z.infer<typeof SubsonicApi._baseTypes.artistListEntry>,
    server: ServerListItem | null,
    imageSize?: number,
): AlbumArtist => {
    const imageUrl =
        getCoverArtUrl({
            baseUrl: server?.url,
            coverArtId: item.coverArt,
            credential: server?.credential,
            size: imageSize || 100,
        }) || null;

    return {
        albumCount: item.albumCount ? Number(item.albumCount) : 0,
        backgroundImageUrl: null,
        biography: null,
        duration: null,
        genres: [],
        id: item.id,
        imageUrl,
        itemType: LibraryItem.ALBUM_ARTIST,
        lastPlayedAt: null,
        name: item.name,
        playCount: null,
        serverId: server?.id || 'unknown',
        serverType: ServerType.SUBSONIC,
        similarArtists: [],
        songCount: null,
        userFavorite: false,
        userRating: null,
    };
};

const normalizeAlbum = (
    item:
        | z.infer<typeof SubsonicApi._baseTypes.album>
        | z.infer<typeof SubsonicApi._baseTypes.albumListEntry>,
    server: ServerListItem | null,
    size?: number,
): Album => {
    const imageUrl =
        getCoverArtUrl({
            baseUrl: server?.url,
            coverArtId: item.coverArt,
            credential: server?.credential,
            size: size || 300,
        }) || null;

    return {
        albumArtists: item.artistId
            ? [{ id: item.artistId, imageUrl: null, name: item.artist }]
            : [],
        artists: item.artistId ? [{ id: item.artistId, imageUrl: null, name: item.artist }] : [],
        backdropImageUrl: null,
        createdAt: item.created,
        duration: item.duration * 1000,
        genres: item.genre
            ? [
                  {
                      id: item.genre,
                      imageUrl: null,
                      itemType: LibraryItem.GENRE,
                      name: item.genre,
                  },
              ]
            : [],
        id: item.id,
        imagePlaceholderUrl: null,
        imageUrl,
        isCompilation: null,
        itemType: LibraryItem.ALBUM,
        lastPlayedAt: null,
        name: item.name,
        playCount: null,
        releaseDate: item.year ? new Date(item.year, 0, 1).toISOString() : null,
        releaseYear: item.year ? Number(item.year) : null,
        serverId: server?.id || 'unknown',
        serverType: ServerType.SUBSONIC,
        size: null,
        songCount: item.songCount,
        songs:
            (item as z.infer<typeof SubsonicApi._baseTypes.album>).song?.map((song) =>
                normalizeSong(song, server, ''),
            ) || [],
        uniqueId: nanoid(),
        updatedAt: item.created,
        userFavorite: item.starred || false,
        userRating: item.userRating || null,
    };
};

const normalizeGenre = (item: z.infer<typeof SubsonicApi._baseTypes.genre>): Genre => {
    return {
        albumCount: item.albumCount,
        id: item.value,
        imageUrl: null,
        itemType: LibraryItem.GENRE,
        name: item.value,
        songCount: item.songCount,
    };
};

const normalizeMusicFolder = (
    item: z.infer<typeof SubsonicApi._baseTypes.musicFolder>,
): MusicFolder => {
    return {
        id: item.id,
        name: item.name,
    };
};

const normalizePlaylist = (
    item:
        | z.infer<typeof SubsonicApi._baseTypes.playlist>
        | z.infer<typeof SubsonicApi._baseTypes.playlistListEntry>,
    server: ServerListItem | null,
): Playlist => {
    return {
        description: item.comment || null,
        duration: item.duration,
        genres: [],
        id: item.id,
        imagePlaceholderUrl: null,
        imageUrl: getCoverArtUrl({
            baseUrl: server?.url,
            coverArtId: item.coverArt,
            credential: server?.credential,
            size: 300,
        }),
        itemType: LibraryItem.PLAYLIST,
        name: item.name,
        owner: item.owner,
        ownerId: item.owner,
        public: item.public,
        serverId: server?.id || 'unknown',
        serverType: ServerType.SUBSONIC,
        size: null,
        songCount: item.songCount,
    };
};

export const subsonicNormalize = {
    album: normalizeAlbum,
    albumArtist: normalizeAlbumArtist,
    genre: normalizeGenre,
    musicFolder: normalizeMusicFolder,
    playlist: normalizePlaylist,
    song: normalizeSong,
};
