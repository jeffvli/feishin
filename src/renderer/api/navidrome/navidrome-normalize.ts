import { nanoid } from 'nanoid';
import { Song, LibraryItem, Album, Playlist, User, AlbumArtist } from '/@/renderer/api/types';
import { ServerListItem, ServerType } from '/@/renderer/types';
import z from 'zod';
import { ndType } from './navidrome-types';
import { ssType } from '/@/renderer/api/subsonic/subsonic-types';

const getImageUrl = (args: { url: string | null }) => {
    const { url } = args;
    if (url === '/app/artist-placeholder.webp') {
        return null;
    }

    if (url?.match('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
        return null;
    }

    return url;
};

const getCoverArtUrl = (args: {
    baseUrl: string | undefined;
    coverArtId: string;
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
    item: z.infer<typeof ndType._response.song> | z.infer<typeof ndType._response.playlistSong>,
    server: ServerListItem | null,
    deviceId: string,
    imageSize?: number,
): Song => {
    let id;
    let playlistItemId;

    // Dynamically determine the id field based on whether or not the item is a playlist song
    if ('mediaFileId' in item) {
        id = item.mediaFileId;
        playlistItemId = item.id;
    } else {
        id = item.id;
    }

    const imageUrl = getCoverArtUrl({
        baseUrl: server?.url,
        coverArtId: id,
        credential: server?.credential,
        size: imageSize || 100,
    });

    const imagePlaceholderUrl = null;

    return {
        album: item.album,
        albumArtists: [{ id: item.artistId, imageUrl: null, name: item.artist }],
        albumId: item.albumId,
        artistName: item.artist,
        artists: [{ id: item.artistId, imageUrl: null, name: item.artist }],
        bitRate: item.bitRate,
        bpm: item.bpm ? item.bpm : null,
        channels: item.channels ? item.channels : null,
        comment: item.comment ? item.comment : null,
        compilation: item.compilation,
        container: item.suffix,
        createdAt: item.createdAt.split('T')[0],
        discNumber: item.discNumber,
        duration: item.duration,
        genres: item.genres,
        id,
        imagePlaceholderUrl,
        imageUrl,
        itemType: LibraryItem.SONG,
        lastPlayedAt: item.playDate.includes('0001-') ? null : item.playDate,
        lyrics: item.lyrics ? item.lyrics : null,
        name: item.title,
        path: item.path,
        playCount: item.playCount,
        playlistItemId,
        releaseDate: new Date(item.year, 0, 1).toISOString(),
        releaseYear: String(item.year),
        serverId: server?.id || 'unknown',
        serverType: ServerType.NAVIDROME,
        size: item.size,
        streamUrl: `${server?.url}/rest/stream.view?id=${id}&v=1.13.0&c=feishin_${deviceId}&${server?.credential}`,
        trackNumber: item.trackNumber,
        uniqueId: nanoid(),
        updatedAt: item.updatedAt,
        userFavorite: item.starred || false,
        userRating: item.rating || null,
    };
};

const normalizeAlbum = (
    item: z.infer<typeof ndType._response.album> & {
        songs?: z.infer<typeof ndType._response.songList>;
    },
    server: ServerListItem | null,
    imageSize?: number,
): Album => {
    const imageUrl = getCoverArtUrl({
        baseUrl: server?.url,
        coverArtId: item.coverArtId || item.id,
        credential: server?.credential,
        size: imageSize || 300,
    });

    const imagePlaceholderUrl = null;

    const imageBackdropUrl = imageUrl?.replace(/size=\d+/, 'size=1000') || null;

    return {
        albumArtists: [{ id: item.albumArtistId, imageUrl: null, name: item.albumArtist }],
        artists: [{ id: item.artistId, imageUrl: null, name: item.artist }],
        backdropImageUrl: imageBackdropUrl,
        createdAt: item.createdAt.split('T')[0],
        duration: item.duration * 1000 || null,
        genres: item.genres,
        id: item.id,
        imagePlaceholderUrl,
        imageUrl,
        isCompilation: item.compilation,
        itemType: LibraryItem.ALBUM,
        lastPlayedAt: item.playDate.includes('0001-') ? null : item.playDate,
        name: item.name,
        playCount: item.playCount,
        releaseDate: new Date(item.minYear, 0, 1).toISOString(),
        releaseYear: item.minYear,
        serverId: server?.id || 'unknown',
        serverType: ServerType.NAVIDROME,
        size: item.size,
        songCount: item.songCount,
        songs: item.songs ? item.songs.map((song) => normalizeSong(song, server, '')) : undefined,
        uniqueId: nanoid(),
        updatedAt: item.updatedAt,
        userFavorite: item.starred,
        userRating: item.rating || null,
    };
};

const normalizeAlbumArtist = (
    item: z.infer<typeof ndType._response.albumArtist> & {
        similarArtists?: z.infer<typeof ssType._response.artistInfo>['artistInfo']['similarArtist'];
    },
    server: ServerListItem | null,
): AlbumArtist => {
    const imageUrl = getImageUrl({ url: item?.largeImageUrl || null });

    return {
        albumCount: item.albumCount,
        backgroundImageUrl: null,
        biography: item.biography || null,
        duration: null,
        genres: item.genres,
        id: item.id,
        imageUrl: imageUrl || null,
        itemType: LibraryItem.ALBUM_ARTIST,
        lastPlayedAt: item.playDate.includes('0001-') ? null : item.playDate,
        name: item.name,
        playCount: item.playCount,
        serverId: server?.id || 'unknown',
        serverType: ServerType.NAVIDROME,
        similarArtists:
            item.similarArtists?.map((artist) => ({
                id: artist.id,
                imageUrl: getImageUrl({ url: artist?.artistImageUrl || null }),
                name: artist.name,
            })) || null,
        songCount: item.songCount,
        userFavorite: item.starred,
        userRating: item.rating,
    };
};

const normalizePlaylist = (
    item: z.infer<typeof ndType._response.playlist>,
    server: ServerListItem | null,
    imageSize?: number,
): Playlist => {
    const imageUrl = getCoverArtUrl({
        baseUrl: server?.url,
        coverArtId: item.id,
        credential: server?.credential,
        size: imageSize || 300,
    });

    const imagePlaceholderUrl = null;

    return {
        description: item.comment,
        duration: item.duration * 1000,
        genres: [],
        id: item.id,
        imagePlaceholderUrl,
        imageUrl,
        itemType: LibraryItem.PLAYLIST,
        name: item.name,
        owner: item.ownerName,
        ownerId: item.ownerId,
        public: item.public,
        rules: item?.rules || null,
        serverId: server?.id || 'unknown',
        serverType: ServerType.NAVIDROME,
        size: item.size,
        songCount: item.songCount,
        sync: item.sync,
    };
};

const normalizeUser = (item: z.infer<typeof ndType._response.user>): User => {
    return {
        createdAt: item.createdAt,
        email: item.email || null,
        id: item.id,
        isAdmin: item.isAdmin,
        lastLoginAt: item.lastLoginAt,
        name: item.userName,
        updatedAt: item.updatedAt,
    };
};

export const ndNormalize = {
    album: normalizeAlbum,
    albumArtist: normalizeAlbumArtist,
    playlist: normalizePlaylist,
    song: normalizeSong,
    user: normalizeUser,
};
