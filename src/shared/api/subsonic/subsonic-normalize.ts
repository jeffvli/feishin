import { z } from 'zod';

import { ssType } from '/@/shared/api/subsonic/subsonic-types';
import {
    Album,
    AlbumArtist,
    ExplicitStatus,
    Genre,
    LibraryItem,
    Playlist,
    RelatedArtist,
    ServerListItemWithCredential,
    ServerType,
    Song,
} from '/@/shared/types/domain-types';

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
        '&c=Feishin' +
        `&size=${size}`
    );
};

const getArtistList = (
    artists?: typeof ssType._response.song._type.artists,
    artistId?: number | string,
    artistName?: string,
) => {
    return artists
        ? artists.map((item) => ({
              id: item.id.toString(),
              imageUrl: null,
              name: item.name,
          }))
        : [
              {
                  id: artistId?.toString() || '',
                  imageUrl: null,
                  name: artistName || '',
              },
          ];
};

const getParticipants = (
    item:
        | z.infer<typeof ssType._response.album>
        | z.infer<typeof ssType._response.albumListEntry>
        | z.infer<typeof ssType._response.song>,
) => {
    let participants: null | Record<string, RelatedArtist[]> = null;

    if (item.contributors) {
        participants = {};

        for (const contributor of item.contributors) {
            const artist = {
                id: contributor.artist.id?.toString() || '',
                imageUrl: null,
                name: contributor.artist.name || '',
            };

            const role = contributor.subRole
                ? `${contributor.role} (${contributor.subRole})`
                : contributor.role;

            if (role in participants) {
                participants[role].push(artist);
            } else {
                participants[role] = [artist];
            }
        }
    }

    return participants;
};

const getGenres = (
    item:
        | z.infer<typeof ssType._response.album>
        | z.infer<typeof ssType._response.albumListEntry>
        | z.infer<typeof ssType._response.song>,
    server?: null | ServerListItemWithCredential,
): Genre[] => {
    return item.genres
        ? item.genres.map((genre) => ({
              _itemType: LibraryItem.GENRE,
              _serverId: server?.id || 'unknown',
              _serverType: ServerType.SUBSONIC,
              id: genre.name,
              imageUrl: null,
              name: genre.name,
          }))
        : item.genre
          ? [
                {
                    _itemType: LibraryItem.GENRE,
                    _serverId: server?.id || 'unknown',
                    _serverType: ServerType.SUBSONIC,
                    id: item.genre,
                    imageUrl: null,
                    name: item.genre,
                },
            ]
          : [];
};

const normalizeSong = (
    item: z.infer<typeof ssType._response.song>,
    server?: null | ServerListItemWithCredential,
    size?: number,
): Song => {
    const imageUrl =
        getCoverArtUrl({
            baseUrl: server?.url,
            coverArtId: item.coverArt?.toString(),
            credential: server?.credential,
            size: size || 300,
        }) || null;

    const streamUrl = `${server?.url}/rest/stream.view?id=${item.id}&v=1.13.0&c=Feishin&${server?.credential}`;

    return {
        _itemType: LibraryItem.SONG,
        _serverId: server?.id || 'unknown',
        _serverType: ServerType.SUBSONIC,
        album: item.album || '',
        albumArtists: getArtistList(item.albumArtists, item.artistId, item.artist),
        albumId: item.albumId?.toString() || '',
        artistName: item.artist || '',
        artists: getArtistList(item.artists, item.artistId, item.artist),
        bitDepth: item.bitDepth || null,
        bitRate: item.bitRate || 0,
        bpm: item.bpm || null,
        channels: item.channelCount || null,
        comment: null,
        compilation: null,
        container: item.contentType,
        createdAt: item.created,
        discNumber: item.discNumber || 1,
        discSubtitle: null,
        duration: item.duration ? item.duration * 1000 : 0,
        explicitStatus:
            item.explicitStatus === 'explicit'
                ? ExplicitStatus.EXPLICIT
                : item.explicitStatus === 'clean'
                  ? ExplicitStatus.CLEAN
                  : null,
        gain:
            item.replayGain && (item.replayGain.albumGain || item.replayGain.trackGain)
                ? {
                      album: item.replayGain.albumGain,
                      track: item.replayGain.trackGain,
                  }
                : null,
        genres: getGenres(item, server),
        id: item.id.toString(),
        imagePlaceholderUrl: null,
        imageUrl,
        lastPlayedAt: null,
        lyrics: null,
        mbzRecordingId: item.musicBrainzId || null,
        mbzTrackId: null,
        name: item.title,
        participants: getParticipants(item),
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
        sampleRate: item.samplingRate || null,
        size: item.size,
        streamUrl,
        tags: null,
        trackNumber: item.track || 1,
        updatedAt: '',
        userFavorite: item.starred || false,
        userRating: item.userRating || null,
    };
};

const normalizeAlbumArtist = (
    item:
        | z.infer<typeof ssType._response.albumArtist>
        | z.infer<typeof ssType._response.artistListEntry>,
    server?: null | ServerListItemWithCredential,
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
        _itemType: LibraryItem.ALBUM_ARTIST,
        _serverId: server?.id || 'unknown',
        _serverType: ServerType.SUBSONIC,
        albumCount: item.albumCount ? Number(item.albumCount) : 0,
        backgroundImageUrl: null,
        biography: null,
        duration: null,
        genres: [],
        id: item.id.toString(),
        imageUrl,
        lastPlayedAt: null,
        mbz: null,
        name: item.name,
        playCount: null,
        similarArtists: [],
        songCount: null,
        userFavorite: false,
        userRating: null,
    };
};

const normalizeAlbum = (
    item: z.infer<typeof ssType._response.album> | z.infer<typeof ssType._response.albumListEntry>,
    server?: null | ServerListItemWithCredential,
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
        _itemType: LibraryItem.ALBUM,
        _serverId: server?.id || 'unknown',
        _serverType: ServerType.SUBSONIC,
        albumArtist: item.artist,
        albumArtists: getArtistList(item.artists, item.artistId, item.artist),
        artists: [],
        backdropImageUrl: null,
        comment: null,
        createdAt: item.created,
        duration: item.duration * 1000,
        explicitStatus:
            item.explicitStatus === 'explicit'
                ? ExplicitStatus.EXPLICIT
                : item.explicitStatus === 'clean'
                  ? ExplicitStatus.CLEAN
                  : null,
        genres: getGenres(item, server),
        id: item.id.toString(),
        imagePlaceholderUrl: null,
        imageUrl,
        isCompilation: null,
        lastPlayedAt: null,
        mbzId: null,
        name: item.name,
        originalDate: null,
        participants: getParticipants(item),
        playCount: null,
        recordLabels: item.recordLabels?.map((item) => item.name) || [],
        releaseDate: item.year ? new Date(Date.UTC(item.year, 0, 1)).toISOString() : null,
        releaseTypes: item.releaseTypes || [],
        releaseYear: item.year ? Number(item.year) : null,
        size: null,
        songCount: item.songCount,
        songs:
            (item as z.infer<typeof ssType._response.album>).song?.map((song) =>
                normalizeSong(song, server),
            ) || [],
        tags: null,
        updatedAt: item.created,
        userFavorite: item.starred || false,
        userRating: item.userRating || null,
        version: item.version || null,
    };
};

const normalizePlaylist = (
    item:
        | z.infer<typeof ssType._response.playlist>
        | z.infer<typeof ssType._response.playlistListEntry>,
    server?: null | ServerListItemWithCredential,
): Playlist => {
    return {
        _itemType: LibraryItem.PLAYLIST,
        _serverId: server?.id || 'unknown',
        _serverType: ServerType.SUBSONIC,
        description: item.comment || null,
        duration: item.duration * 1000,
        genres: [],
        id: item.id.toString(),
        imagePlaceholderUrl: null,
        imageUrl: getCoverArtUrl({
            baseUrl: server?.url,
            coverArtId: item.coverArt?.toString(),
            credential: server?.credential,
            size: 300,
        }),
        name: item.name,
        owner: item.owner,
        ownerId: item.owner,
        public: item.public,
        size: null,
        songCount: item.songCount,
    };
};

const normalizeGenre = (
    item: z.infer<typeof ssType._response.genre>,
    server: null | ServerListItemWithCredential,
): Genre => {
    return {
        _itemType: LibraryItem.GENRE,
        _serverId: server?.id || 'unknown',
        _serverType: ServerType.SUBSONIC,
        albumCount: item.albumCount,
        id: item.value,
        imageUrl: null,
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
