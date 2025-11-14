import z from 'zod';

import { ndType } from '/@/shared/api/navidrome/navidrome-types';
import { ssType } from '/@/shared/api/subsonic/subsonic-types';
import {
    Album,
    AlbumArtist,
    ExplicitStatus,
    Genre,
    LibraryItem,
    Playlist,
    RelatedArtist,
    Song,
    User,
} from '/@/shared/types/domain-types';
import { ServerListItem, ServerType } from '/@/shared/types/types';

const getImageUrl = (args: { url: null | string }) => {
    const { url } = args;
    if (url === '/app/artist-placeholder.webp') {
        return null;
    }

    return url;
};

const getCoverArtUrl = (args: {
    baseUrl: string | undefined;
    coverArtId: string;
    credential: string | undefined;
    size: number;
    updated: string;
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
        `&size=${size}` +
        // A dummy variable to invalidate the cached image if the item is updated
        // This is adapted from how Navidrome web does it
        `&_=${args.updated}`
    );
};

interface WithDate {
    playDate?: string;
}

const normalizePlayDate = (item: WithDate): null | string => {
    return !item.playDate || item.playDate.includes('0001-') ? null : item.playDate;
};

const getArtists = (
    item:
        | z.infer<typeof ndType._response.album>
        | z.infer<typeof ndType._response.playlistSong>
        | z.infer<typeof ndType._response.song>,
) => {
    let albumArtists: RelatedArtist[] | undefined;
    let artists: RelatedArtist[] | undefined;
    let participants: null | Record<string, RelatedArtist[]> = null;

    if (item.participants) {
        participants = {};
        for (const [role, list] of Object.entries(item.participants)) {
            if (role === 'albumartist' || role === 'artist') {
                const roleList = list.map((item) => ({
                    id: item.id,
                    imageUrl: null,
                    name: item.name,
                }));

                if (role === 'albumartist') {
                    albumArtists = roleList;
                } else {
                    artists = roleList;
                }
            } else {
                const subRoles = new Map<string | undefined, RelatedArtist[]>();

                for (const artist of list) {
                    const item: RelatedArtist = {
                        id: artist.id,
                        imageUrl: null,
                        name: artist.name,
                    };

                    if (subRoles.has(artist.subRole)) {
                        subRoles.get(artist.subRole)!.push(item);
                    } else {
                        subRoles.set(artist.subRole, [item]);
                    }
                }

                for (const [subRole, items] of subRoles.entries()) {
                    if (subRole) {
                        participants[`${role} (${subRole})`] = items;
                    } else {
                        participants[role] = items;
                    }
                }
            }
        }
    }

    if (albumArtists === undefined) {
        albumArtists = [{ id: item.albumArtistId, imageUrl: null, name: item.albumArtist }];
    }

    if (artists === undefined) {
        artists = [{ id: item.artistId, imageUrl: null, name: item.artist }];
    }

    return { albumArtists, artists, participants };
};

const normalizeSong = (
    item: z.infer<typeof ndType._response.playlistSong> | z.infer<typeof ndType._response.song>,
    server?: null | ServerListItem,
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
        updated: item.updatedAt,
    });

    const imagePlaceholderUrl = null;
    return {
        album: item.album,
        albumId: item.albumId,
        ...getArtists(item),
        _itemType: LibraryItem.SONG,
        _serverId: server?.id || 'unknown',
        _serverType: ServerType.NAVIDROME,
        artistName: item.artist,
        bitDepth: item.bitDepth || null,
        bitRate: item.bitRate,
        bpm: item.bpm ? item.bpm : null,
        channels: item.channels ? item.channels : null,
        comment: item.comment ? item.comment : null,
        compilation: item.compilation,
        container: item.suffix,
        createdAt: item.createdAt.split('T')[0],
        discNumber: item.discNumber,
        discSubtitle: item.discSubtitle ? item.discSubtitle : null,
        duration: item.duration * 1000,
        explicitStatus:
            item.explicitStatus === 'e'
                ? ExplicitStatus.EXPLICIT
                : item.explicitStatus === 'c'
                  ? ExplicitStatus.CLEAN
                  : null,
        gain:
            item.rgAlbumGain || item.rgTrackGain
                ? { album: item.rgAlbumGain, track: item.rgTrackGain }
                : null,
        genres: (item.genres || []).map((genre) => ({
            _itemType: LibraryItem.GENRE,
            _serverId: server?.id || 'unknown',
            _serverType: ServerType.NAVIDROME,
            id: genre.id,
            imageUrl: null,
            name: genre.name,
        })),
        id,
        imagePlaceholderUrl,
        imageUrl,
        lastPlayedAt: normalizePlayDate(item),
        lyrics: item.lyrics ? item.lyrics : null,
        mbzRecordingId: item.mbzReleaseTrackId || null,
        mbzTrackId: item.mbzReleaseTrackId || null,
        name: item.title,
        // Thankfully, Windows is merciful and allows a mix of separators. So, we can use the
        // POSIX separator here instead
        path: (item.libraryPath ? item.libraryPath + '/' : '') + item.path,
        peak:
            item.rgAlbumPeak || item.rgTrackPeak
                ? { album: item.rgAlbumPeak, track: item.rgTrackPeak }
                : null,
        playCount: item.playCount || 0,
        playlistItemId,
        releaseDate: (item.releaseDate
            ? new Date(item.releaseDate)
            : new Date(Date.UTC(item.year, 0, 1))
        ).toISOString(),
        releaseYear: String(item.year),
        sampleRate: item.sampleRate || null,
        size: item.size,
        streamUrl: `${server?.url}/rest/stream.view?id=${id}&v=1.13.0&c=Feishin&${server?.credential}`,
        tags: item.tags || null,
        trackNumber: item.trackNumber,
        updatedAt: item.updatedAt,
        userFavorite: item.starred || false,
        userRating: item.rating || null,
    };
};

const parseAlbumTags = (
    item: z.infer<typeof ndType._response.album>,
): Pick<Album, 'recordLabels' | 'releaseTypes' | 'tags' | 'version'> => {
    if (!item.tags) {
        return {
            recordLabels: [],
            releaseTypes: [],
            tags: null,
            version: null,
        };
    }

    // We get the genre from elsewhere. We don't need genre twice
    delete item.tags['genre'];

    let recordLabels: string[] = [];
    if (item.tags['recordlabel']) {
        recordLabels = item.tags['recordlabel'];
        delete item.tags['recordlabel'];
    }

    let releaseTypes: string[] = [];
    if (item.tags['releasetype']) {
        releaseTypes = item.tags['releasetype'];
        delete item.tags['releasetype'];
    }

    let version: null | string = null;
    if (item.tags['albumversion']) {
        version = item.tags['albumversion'].join(' · ');
        delete item.tags['albumversion'];
    }

    return {
        recordLabels,
        releaseTypes,
        tags: item.tags,
        version,
    };
};

const normalizeAlbum = (
    item: z.infer<typeof ndType._response.album> & {
        songs?: z.infer<typeof ndType._response.songList>;
    },
    server?: null | ServerListItem,
    imageSize?: number,
): Album => {
    const imageUrl = getCoverArtUrl({
        baseUrl: server?.url,
        coverArtId: item.coverArtId || item.id,
        credential: server?.credential,
        size: imageSize || 300,
        updated: item.updatedAt,
    });

    const imagePlaceholderUrl = null;

    const imageBackdropUrl = imageUrl?.replace(/size=\d+/, 'size=1000') || null;

    return {
        ...parseAlbumTags(item),
        ...getArtists(item),
        _itemType: LibraryItem.ALBUM,
        _serverId: server?.id || 'unknown',
        _serverType: ServerType.NAVIDROME,
        albumArtist: item.albumArtist,
        backdropImageUrl: imageBackdropUrl,
        comment: item.comment || null,
        createdAt: item.createdAt.split('T')[0],
        duration: item.duration !== undefined ? item.duration * 1000 : null,
        explicitStatus:
            item.explicitStatus === 'e'
                ? ExplicitStatus.EXPLICIT
                : item.explicitStatus === 'c'
                  ? ExplicitStatus.CLEAN
                  : null,
        genres: (item.genres || []).map((genre) => ({
            _itemType: LibraryItem.GENRE,
            _serverId: server?.id || 'unknown',
            _serverType: ServerType.NAVIDROME,
            id: genre.id,
            imageUrl: null,
            name: genre.name,
        })),
        id: item.id,
        imagePlaceholderUrl,
        imageUrl,

        isCompilation: item.compilation,
        lastPlayedAt: normalizePlayDate(item),
        mbzId: item.mbzAlbumId || null,
        name: item.name,
        originalDate: item.originalDate
            ? new Date(item.originalDate).toISOString()
            : item.originalYear
              ? new Date(Date.UTC(item.originalYear, 0, 1)).toISOString()
              : null,
        playCount: item.playCount || 0,
        releaseDate: (item.releaseDate
            ? new Date(item.releaseDate)
            : new Date(Date.UTC(item.minYear, 0, 1))
        ).toISOString(),
        releaseYear: item.minYear,
        size: item.size,
        songCount: item.songCount,
        songs: item.songs ? item.songs.map((song) => normalizeSong(song, server)) : undefined,
        tags: item.tags || null,
        updatedAt: item.updatedAt,
        userFavorite: item.starred || false,
        userRating: item.rating || null,
    };
};

const normalizeAlbumArtist = (
    item: z.infer<typeof ndType._response.albumArtist> & {
        similarArtists?: z.infer<typeof ssType._response.artistInfo>['artistInfo']['similarArtist'];
    },
    server?: null | ServerListItem,
): AlbumArtist => {
    let imageUrl = getImageUrl({ url: item?.largeImageUrl || null });

    if (!imageUrl) {
        imageUrl = getCoverArtUrl({
            baseUrl: server?.url,
            coverArtId: `ar-${item.id}`,
            credential: server?.credential,
            size: 300,
            updated: item.updatedAt || '',
        });
    }

    let albumCount: number;
    let songCount: number;

    if (item.stats) {
        albumCount = Math.max(
            item.stats.albumartist?.albumCount ?? 0,
            item.stats.artist?.albumCount ?? 0,
        );
        songCount = Math.max(
            item.stats.albumartist?.songCount ?? 0,
            item.stats.artist?.songCount ?? 0,
        );
    } else {
        albumCount = item.albumCount;
        songCount = item.songCount;
    }

    return {
        _itemType: LibraryItem.ALBUM_ARTIST,
        _serverId: server?.id || 'unknown',
        _serverType: ServerType.NAVIDROME,
        albumCount,
        backgroundImageUrl: null,
        biography: item.biography || null,
        duration: null,
        genres: (item.genres || []).map((genre) => ({
            _itemType: LibraryItem.GENRE,
            _serverId: server?.id || 'unknown',
            _serverType: ServerType.NAVIDROME,
            id: genre.id,
            imageUrl: null,
            name: genre.name,
        })),
        id: item.id,
        imageUrl: imageUrl || null,
        lastPlayedAt: normalizePlayDate(item),
        mbz: item.mbzArtistId || null,
        name: item.name,
        playCount: item.playCount || 0,
        similarArtists:
            item.similarArtists?.map((artist) => ({
                id: artist.id,
                imageUrl: artist?.artistImageUrl || null,
                name: artist.name,
            })) || null,
        songCount,
        userFavorite: item.starred || false,
        userRating: item.rating || null,
    };
};

const normalizePlaylist = (
    item: z.infer<typeof ndType._response.playlist>,
    server?: null | ServerListItem,
    imageSize?: number,
): Playlist => {
    const imageUrl = getCoverArtUrl({
        baseUrl: server?.url,
        coverArtId: item.id,
        credential: server?.credential,
        size: imageSize || 300,
        updated: item.updatedAt,
    });

    const imagePlaceholderUrl = null;

    return {
        _itemType: LibraryItem.PLAYLIST,
        _serverId: server?.id || 'unknown',
        _serverType: ServerType.NAVIDROME,
        description: item.comment,
        duration: item.duration * 1000,
        genres: [],
        id: item.id,
        imagePlaceholderUrl,
        imageUrl,
        name: item.name,
        owner: item.ownerName,
        ownerId: item.ownerId,
        public: item.public,
        rules: item?.rules || null,
        size: item.size,
        songCount: item.songCount,
        sync: item.sync,
    };
};

const normalizeGenre = (
    item: z.infer<typeof ndType._response.genre>,
    server: null | ServerListItem,
): Genre => {
    return {
        _itemType: LibraryItem.GENRE,
        _serverId: server?.id || 'unknown',
        _serverType: ServerType.NAVIDROME,
        albumCount: undefined,
        id: item.id,
        imageUrl: null,
        name: item.name,
        songCount: undefined,
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
    genre: normalizeGenre,
    playlist: normalizePlaylist,
    song: normalizeSong,
    user: normalizeUser,
};
