import { nanoid } from 'nanoid';
import { z } from 'zod';
import { ssType } from '/@/renderer/api/subsonic/subsonic-types';
import {
    QueueSong,
    LibraryItem,
    AlbumArtist,
    Album,
    ServerListItem,
    ServerType,
    Playlist,
    Genre,
} from '/@/renderer/api/types';

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
    item: z.infer<typeof ssType._response.song>,
    server: ServerListItem | null,
    deviceId: string,
    size?: number,
): QueueSong => {
    const imageUrl =
        getCoverArtUrl({
            baseUrl: server?.url,
            coverArtId: item.coverArt?.toString(),
            credential: server?.credential,
            size: size || 300,
        }) || null;

    const streamUrl = `${server?.url}/rest/stream.view?id=${item.id}&v=1.13.0&c=feishin_${deviceId}&${server?.credential}`;

    return {
        album: item.album || '',
        albumArtists: [
            {
                id: item.artistId?.toString() || '',
                imageUrl: null,
                name: item.artist || '',
            },
        ],
        albumId: item.albumId?.toString() || '',
        artistName: item.artist || '',
        artists: [
            {
                id: item.artistId?.toString() || '',
                imageUrl: null,
                name: item.artist || '',
            },
        ],
        bitRate: item.bitRate || 0,
        bpm: item.bpm || null,
        channels: null,
        comment: null,
        compilation: null,
        container: item.contentType,
        createdAt: item.created,
        discNumber: item.discNumber || 1,
        discSubtitle: null,
        duration: item.duration ? item.duration * 1000 : 0,
        gain:
            item.replayGain && (item.replayGain.albumGain || item.replayGain.trackGain)
                ? {
                      album: item.replayGain.albumGain,
                      track: item.replayGain.trackGain,
                  }
                : null,
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
        id: item.id.toString(),
        imagePlaceholderUrl: null,
        imageUrl,
        itemType: LibraryItem.SONG,
        lastPlayedAt: null,
        lyrics: null,
        name: item.title,
        path: item.path,
        peak:
            item.replayGain && (item.replayGain.albumPeak || item.replayGain.trackPeak)
                ? {
                      album: item.replayGain.albumPeak,
                      track: item.replayGain.trackPeak,
                  }
                : null,
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
        | z.infer<typeof ssType._response.albumArtist>
        | z.infer<typeof ssType._response.artistListEntry>,
    server: ServerListItem | null,
    imageSize?: number,
): AlbumArtist => {
    const imageUrl =
        getCoverArtUrl({
            baseUrl: server?.url,
            coverArtId: item.coverArt?.toString(),
            credential: server?.credential,
            size: imageSize || 100,
        }) || null;

    return {
        albumCount: item.albumCount ? Number(item.albumCount) : 0,
        backgroundImageUrl: null,
        biography: null,
        duration: null,
        genres: [],
        id: item.id.toString(),
        imageUrl,
        itemType: LibraryItem.ALBUM_ARTIST,
        lastPlayedAt: null,
        mbz: null,
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
    item: z.infer<typeof ssType._response.album> | z.infer<typeof ssType._response.albumListEntry>,
    server: ServerListItem | null,
    imageSize?: number,
): Album => {
    const imageUrl =
        getCoverArtUrl({
            baseUrl: server?.url,
            coverArtId: item.coverArt?.toString(),
            credential: server?.credential,
            size: imageSize || 300,
        }) || null;

    return {
        albumArtist: item.artist,
        albumArtists: item.artistId
            ? [{ id: item.artistId.toString(), imageUrl: null, name: item.artist }]
            : [],
        artists: item.artistId
            ? [{ id: item.artistId.toString(), imageUrl: null, name: item.artist }]
            : [],
        backdropImageUrl: null,
        comment: null,
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
        id: item.id.toString(),
        imagePlaceholderUrl: null,
        imageUrl,
        isCompilation: null,
        itemType: LibraryItem.ALBUM,
        lastPlayedAt: null,
        mbzId: null,
        name: item.name,
        originalDate: null,
        playCount: null,
        releaseDate: item.year ? new Date(Date.UTC(item.year, 0, 1)).toISOString() : null,
        releaseYear: item.year ? Number(item.year) : null,
        serverId: server?.id || 'unknown',
        serverType: ServerType.SUBSONIC,
        size: null,
        songCount: item.songCount,
        songs:
            (item as z.infer<typeof ssType._response.album>).song?.map((song) =>
                normalizeSong(song, server, ''),
            ) || [],
        uniqueId: nanoid(),
        updatedAt: item.created,
        userFavorite: item.starred || false,
        userRating: item.userRating || null,
    };
};

const normalizePlaylist = (
    item:
        | z.infer<typeof ssType._response.playlist>
        | z.infer<typeof ssType._response.playlistListEntry>,
    server: ServerListItem | null,
): Playlist => {
    return {
        description: item.comment || null,
        duration: item.duration,
        genres: [],
        id: item.id.toString(),
        imagePlaceholderUrl: null,
        imageUrl: getCoverArtUrl({
            baseUrl: server?.url,
            coverArtId: item.coverArt?.toString(),
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

const normalizeGenre = (item: z.infer<typeof ssType._response.genre>): Genre => {
    return {
        albumCount: item.albumCount,
        id: item.value,
        imageUrl: null,
        itemType: LibraryItem.GENRE,
        name: item.value,
        songCount: item.songCount,
    };
};

export const ssNormalize = {
    album: normalizeAlbum,
    albumArtist: normalizeAlbumArtist,
    genre: normalizeGenre,
    playlist: normalizePlaylist,
    song: normalizeSong,
};
