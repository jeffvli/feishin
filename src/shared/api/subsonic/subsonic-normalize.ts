import { z } from 'zod';

import { ssType } from '/@/shared/api/subsonic/subsonic-types';
import { replacePathPrefix } from '/@/shared/api/utils';
import {
    Album,
    AlbumArtist,
    ExplicitStatus,
    Folder,
    Genre,
    InternetRadioStation,
    LibraryItem,
    Playlist,
    RelatedArtist,
    ServerListItemWithCredential,
    ServerType,
    Song,
} from '/@/shared/types/domain-types';

const getArtistList = (
    artists?: typeof ssType._response.song._type.artists,
    artistId?: number | string,
    artistName?: string,
    participants?: null | Record<string, RelatedArtist[]>,
) => {
    if (!artists && !participants) {
        return [
            {
                id: artistId?.toString() || '',
                imageId: null,
                imageUrl: null,
                name: artistName || '',
                userFavorite: false,
                userRating: null,
            },
        ];
    }

    const result: RelatedArtist[] = [];

    artists?.forEach((item) => {
        result.push({
            id: item.id.toString(),
            imageId: null,
            imageUrl: null,
            name: item.name,
            userFavorite: false,
            userRating: null,
        });
    });

    if (participants?.['remixer']) {
        result.push(...participants['remixer']);
    }

    return result;
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
                imageId: null,
                imageUrl: null,
                name: contributor.artist.name || '',
                userFavorite: false,
                userRating: null,
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
              albumCount: null,
              id: genre.name,
              imageId: null,
              imageUrl: null,
              name: genre.name,
              songCount: null,
          }))
        : item.genre
          ? [
                {
                    _itemType: LibraryItem.GENRE,
                    _serverId: server?.id || 'unknown',
                    _serverType: ServerType.SUBSONIC,
                    albumCount: null,
                    id: item.genre,
                    imageId: null,
                    imageUrl: null,
                    name: item.genre,
                    songCount: null,
                },
            ]
          : [];
};

const normalizeSong = (
    item: z.infer<typeof ssType._response.song>,
    server?: null | ServerListItemWithCredential,
    pathReplace?: string,
    pathReplaceWith?: string,
): Song => {
    const participants = getParticipants(item);

    return {
        _itemType: LibraryItem.SONG,
        _serverId: server?.id || 'unknown',
        _serverType: ServerType.SUBSONIC,
        album: item.album || '',
        albumArtistName: item.artist || '',
        albumArtists: getArtistList(item.albumArtists, item.artistId, item.artist),
        albumId: item.albumId?.toString() || '',
        artistName: item.artist || '',
        artists: getArtistList(item.artists, item.artistId, item.artist, participants),
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
        imageId: item.coverArt?.toString() || null,
        imageUrl: null,
        lastPlayedAt: null,
        lyrics: null,
        mbzRecordingId: item.musicBrainzId || null,
        mbzTrackId: null,
        name: item.title,
        participants,
        path: replacePathPrefix(item.path || '', pathReplace, pathReplaceWith),
        peak:
            item.replayGain && (item.replayGain.albumPeak || item.replayGain.trackPeak)
                ? {
                      album: item.replayGain.albumPeak,
                      track: item.replayGain.trackPeak,
                  }
                : null,
        playCount: item?.playCount || 0,
        releaseDate: null,
        releaseYear: item.year || null,
        sampleRate: item.samplingRate || null,
        size: item.size,
        tags: null,
        trackNumber: item.track || 1,
        trackSubtitle: null,
        updatedAt: '',
        userFavorite: Boolean(item.starred) || false,
        userRating: item.userRating || null,
    };
};

const normalizeAlbumArtist = (
    item:
        | (z.infer<typeof ssType._response.albumArtist> & {
              similarArtists?: z.infer<
                  typeof ssType._response.artistInfo
              >['artistInfo']['similarArtist'];
          })
        | (z.infer<typeof ssType._response.artistListEntry> & {
              similarArtists?: z.infer<
                  typeof ssType._response.artistInfo
              >['artistInfo']['similarArtist'];
          }),
    server?: null | ServerListItemWithCredential,
): AlbumArtist => {
    return {
        _itemType: LibraryItem.ALBUM_ARTIST,
        _serverId: server?.id || 'unknown',
        _serverType: ServerType.SUBSONIC,
        albumCount: item.albumCount ? Number(item.albumCount) : 0,
        biography: null,
        duration: null,
        genres: [],
        id: item.id.toString(),
        imageId: item.coverArt?.toString() || null,
        imageUrl: null,
        lastPlayedAt: null,
        mbz: null,
        name: item.name,
        playCount: null,
        similarArtists:
            item.similarArtists?.map((artist) => ({
                id: artist.id,
                imageId: null,
                imageUrl: null,
                name: artist.name,
                userFavorite: Boolean(artist.starred) || false,
                userRating: artist.userRating || null,
            })) || [],
        songCount: null,
        userFavorite: Boolean(item.starred) || false,
        userRating: null,
    };
};

const PRIMARY_RELEASE_TYPES = ['album', 'ep', 'single', 'broadcast', 'other'];

const getReleaseType = (
    item: z.infer<typeof ssType._response.album> | z.infer<typeof ssType._response.albumListEntry>,
) => {
    if (!item.releaseTypes) {
        return null;
    }

    // Return the first primary release type
    return item.releaseTypes.find((type) => PRIMARY_RELEASE_TYPES.includes(type)) || null;
};

const normalizeAlbum = (
    item: z.infer<typeof ssType._response.album> | z.infer<typeof ssType._response.albumListEntry>,
    server?: null | ServerListItemWithCredential,
    pathReplace?: string,
    pathReplaceWith?: string,
): Album => {
    const releaseDate =
        item.releaseDate &&
        typeof item.releaseDate.year === 'number' &&
        typeof item.releaseDate.month === 'number' &&
        typeof item.releaseDate.day === 'number'
            ? `${item.releaseDate.year}-${item.releaseDate.month}-${item.releaseDate.day}`
            : null;

    return {
        _itemType: LibraryItem.ALBUM,
        _serverId: server?.id || 'unknown',
        _serverType: ServerType.SUBSONIC,
        albumArtistName: item.artist,
        albumArtists: getArtistList(item.artists, item.artistId, item.artist),
        artists: [],
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
        imageId: item.coverArt?.toString() || null,
        imageUrl: null,
        isCompilation: null,
        lastPlayedAt: null,
        mbzId: null,
        name: item.name,
        originalDate: releaseDate,
        originalYear: item.year || null,
        participants: getParticipants(item),
        playCount: null,
        recordLabels: item.recordLabels?.map((item) => item.name) || [],
        releaseDate,
        releaseType: getReleaseType(item),
        releaseTypes: item.releaseTypes || [],
        releaseYear: item.year || null,
        size: null,
        songCount: item.songCount,
        songs:
            (item as z.infer<typeof ssType._response.album>).song?.map((song) =>
                normalizeSong(song, server, pathReplace, pathReplaceWith),
            ) || [],
        tags: null,
        updatedAt: item.created,
        userFavorite: Boolean(item.starred) || false,
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
        imageId: item.coverArt?.toString() || null,
        imageUrl: null,
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
        imageId: null,
        imageUrl: null,
        name: item.value,
        songCount: item.songCount,
    };
};

const normalizeFolder = (
    item: z.infer<typeof ssType._response.directory>,
    server?: null | ServerListItemWithCredential,
    pathReplace?: string,
    pathReplaceWith?: string,
): Folder => {
    const results = item.child?.reduce(
        (acc: { folders: Folder[]; songs: Song[] }, item) => {
            const isDirectory = item.isDir === true;

            if (isDirectory) {
                const folder = normalizeFolder(item, server);
                acc.folders.push(folder);
            } else {
                const song = normalizeSong(item, server, pathReplace, pathReplaceWith);
                acc.songs.push(song);
            }

            return acc;
        },
        {
            folders: [],
            songs: [],
        },
    );

    return {
        _itemType: LibraryItem.FOLDER,
        _serverId: server?.id || 'unknown',
        _serverType: ServerType.SUBSONIC,
        children: {
            folders: results?.folders || [],
            songs: results?.songs || [],
        },
        id: item.id.toString(),
        name: item.title,
        parentId: item.parent,
    };
};

const normalizeInternetRadioStation = (
    item: z.infer<typeof ssType._response.internetRadioStation>,
): InternetRadioStation => {
    return {
        homepageUrl: item.homepageUrl || null,
        id: item.id,
        name: item.name,
        streamUrl: item.streamUrl,
    };
};

export const ssNormalize = {
    album: normalizeAlbum,
    albumArtist: normalizeAlbumArtist,
    folder: normalizeFolder,
    genre: normalizeGenre,
    internetRadioStation: normalizeInternetRadioStation,
    playlist: normalizePlaylist,
    song: normalizeSong,
};
