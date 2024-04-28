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
        id: item.id,
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
    item: z.infer<typeof ssType._response.albumArtist>,
    server: ServerListItem | null,
): AlbumArtist => {
    const imageUrl =
        getCoverArtUrl({
            baseUrl: server?.url,
            coverArtId: item.coverArt,
            credential: server?.credential,
            size: 100,
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
    item: z.infer<typeof ssType._response.album>,
    server: ServerListItem | null,
): Album => {
    const imageUrl =
        getCoverArtUrl({
            baseUrl: server?.url,
            coverArtId: item.coverArt,
            credential: server?.credential,
            size: 300,
        }) || null;

    return {
        albumArtist: item.artist,
        albumArtists: item.artistId
            ? [{ id: item.artistId, imageUrl: null, name: item.artist }]
            : [],
        artists: item.artistId ? [{ id: item.artistId, imageUrl: null, name: item.artist }] : [],
        backdropImageUrl: null,
        comment: null,
        createdAt: item.created,
        duration: item.duration,
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
        mbzId: null,
        name: item.name,
        playCount: null,
        releaseDate: item.year ? new Date(item.year, 0, 1).toISOString() : null,
        releaseYear: item.year ? Number(item.year) : null,
        serverId: server?.id || 'unknown',
        serverType: ServerType.SUBSONIC,
        size: null,
        songCount: item.songCount,
        songs: [],
        uniqueId: nanoid(),
        updatedAt: item.created,
        userFavorite: item.starred || false,
        userRating: item.userRating || null,
    };
};

export const ssNormalize = {
    album: normalizeAlbum,
    albumArtist: normalizeAlbumArtist,
    song: normalizeSong,
};
