import z from 'zod';

import { ndType } from '/@/shared/api/navidrome/navidrome-types';
import { coerceYear, parsePartialIsoDate } from '/@/shared/api/partial-iso-date';
import { ssType } from '/@/shared/api/subsonic/subsonic-types';
import { replacePathPrefix } from '/@/shared/api/utils';
import {
    Album,
    AlbumArtist,
    ExplicitStatus,
    Genre,
    InternetRadioStation,
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

interface WithDate {
    playDate?: string;
}

const normalizePlayDate = (item: WithDate): null | string => {
    return !item.playDate || item.playDate.includes('0001-') ? null : item.playDate;
};

const normalizeNavidromeReleaseDate = (item: {
    date?: string;
    minYear?: number;
    releaseDate?: string;
}): { date: null | string; year: number } => {
    const fromRelease = parsePartialIsoDate(item.releaseDate);
    if (fromRelease.date) {
        return fromRelease;
    }

    const fromDateField = parsePartialIsoDate(item.date);
    if (fromDateField.date) {
        return fromDateField;
    }

    const y = coerceYear(item.minYear);
    if (y > 0) {
        return { date: String(y), year: y };
    }

    return { date: null, year: 0 };
};

const normalizeNavidromeOriginalDate = (item: {
    date?: string;
    minOriginalYear?: number;
    minYear?: number;
    originalDate?: string;
    releaseDate?: string;
}): { date: null | string; year: number } => {
    const fromOriginal = parsePartialIsoDate(item.originalDate);
    if (fromOriginal.date) {
        return fromOriginal;
    }

    const fromRelease = parsePartialIsoDate(item.releaseDate);
    if (fromRelease.date) {
        return fromRelease;
    }

    const fromDateField = parsePartialIsoDate(item.date);
    if (fromDateField.date) {
        return fromDateField;
    }

    const y = coerceYear(item.minOriginalYear ?? item.minYear);
    if (y > 0) {
        return { date: String(y), year: y };
    }

    return { date: null, year: 0 };
};

const getArtists = (
    item:
        | z.infer<typeof ndType._response.album>
        | z.infer<typeof ndType._response.playlistSong>
        | z.infer<typeof ndType._response.song>,
    includeRemixers = true,
) => {
    let albumArtists: RelatedArtist[] | undefined;
    let artists: RelatedArtist[] | undefined;
    let remixers: RelatedArtist[] | undefined;
    let participants: null | Record<string, RelatedArtist[]> = null;

    if (item.participants) {
        participants = {};
        for (const [role, list] of Object.entries(item.participants)) {
            if (role === 'albumartist' || role === 'artist' || role === 'remixer') {
                const roleList = list.map((item) => ({
                    id: item.id,
                    imageId: null,
                    imageUrl: null,
                    name: item.name,
                    userFavorite: false,
                    userRating: null,
                }));

                if (role === 'albumartist') {
                    albumArtists = roleList;
                } else if (role === 'remixer' && includeRemixers) {
                    remixers = roleList;
                    participants['remixer'] = remixers;
                } else {
                    artists = roleList;
                }
            } else {
                const subRoles = new Map<string | undefined, RelatedArtist[]>();

                for (const artist of list) {
                    const item: RelatedArtist = {
                        id: artist.id,
                        imageId: null,
                        imageUrl: null,
                        name: artist.name,
                        userFavorite: false,
                        userRating: null,
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
        albumArtists = [
            {
                id: item.albumArtistId,
                imageId: null,
                imageUrl: null,
                name: item.albumArtist,
                userFavorite: false,
                userRating: null,
            },
        ];
    }

    if (artists === undefined) {
        artists = [
            {
                id: item.artistId,
                imageId: null,
                imageUrl: null,
                name: item.artist,
                userFavorite: false,
                userRating: null,
            },
        ];
    }

    if (remixers?.length && includeRemixers) {
        const existingIds = new Set(artists.map((artist) => artist.id));
        for (const remixer of remixers) {
            if (!existingIds.has(remixer.id)) {
                artists.push(remixer);
            }
        }
    }

    return { albumArtists, artists, participants };
};

const normalizeSong = (
    item: z.infer<typeof ndType._response.playlistSong> | z.infer<typeof ndType._response.song>,
    server?: null | ServerListItem,
    pathReplace?: string,
    pathReplaceWith?: string,
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

    const fromSongRelease = parsePartialIsoDate(item.releaseDate);
    const songApiYear = coerceYear(item.year);
    const releaseYear: null | number =
        fromSongRelease.year > 0 ? fromSongRelease.year : songApiYear > 0 ? songApiYear : null;
    const releaseDate = fromSongRelease.date ?? (songApiYear > 0 ? String(songApiYear) : null);

    return {
        album: item.album,
        albumId: item.albumId,
        ...getArtists(item, true),
        _itemType: LibraryItem.SONG,
        _serverId: server?.id || 'unknown',
        _serverType: ServerType.NAVIDROME,
        albumArtistName: item.albumArtist,
        artistName: item.artist,
        bitDepth: item.bitDepth || null,
        bitRate: item.bitRate,
        bpm: item.bpm ? item.bpm : null,
        channels: item.channels ? item.channels : null,
        comment: item.comment ? item.comment : null,
        compilation: item.compilation,
        container: item.suffix,
        createdAt: item.createdAt,
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
            albumCount: null,
            id: genre.id,
            imageId: null,
            imageUrl: null,
            name: genre.name,
            songCount: null,
        })),
        id,
        imageId: id,
        imageUrl: null,
        lastPlayedAt: normalizePlayDate(item),
        lyrics: item.lyrics ? item.lyrics : null,
        mbzRecordingId: item.mbzReleaseTrackId || null,
        mbzTrackId: item.mbzReleaseTrackId || null,
        name: item.title,
        // Thankfully, Windows is merciful and allows a mix of separators. So, we can use the
        // POSIX separator here instead
        path: item.path ? replacePathPrefix(item.path, pathReplace, pathReplaceWith) : null,
        peak:
            item.rgAlbumPeak || item.rgTrackPeak
                ? { album: item.rgAlbumPeak, track: item.rgTrackPeak }
                : null,
        playCount: item.playCount || 0,
        playlistItemId,
        releaseDate,
        releaseYear,
        sampleRate: item.sampleRate || null,
        size: item.size,
        sortName: item.orderTitle,
        tags: item.tags || null,
        trackNumber: item.trackNumber,
        trackSubtitle: item.tags?.subtitle ? item.tags.subtitle.join(' · ') : null,
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
    pathReplace?: string,
    pathReplaceWith?: string,
): Album => {
    const releaseDate = normalizeNavidromeReleaseDate(item);
    const originalDate = normalizeNavidromeOriginalDate(item);

    return {
        ...parseAlbumTags(item),
        ...getArtists(item, false),
        _itemType: LibraryItem.ALBUM,
        _serverId: server?.id || 'unknown',
        _serverType: ServerType.NAVIDROME,
        albumArtistName: item.albumArtist,
        comment: item.comment || null,
        createdAt: item.createdAt,
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
            albumCount: null,
            id: genre.id,
            imageId: null,
            imageUrl: null,
            name: genre.name,
            songCount: null,
        })),
        id: item.id,
        imageId: item.coverArtId || item.id,
        imageUrl: null,
        isCompilation: item.compilation,
        lastPlayedAt: normalizePlayDate(item),
        mbzId: item.mbzAlbumId || null,
        mbzReleaseGroupId: item.mbzReleaseGroupId || null,
        name: item.name,
        originalDate: originalDate.date,
        originalYear: originalDate.year,
        playCount: item.playCount || 0,
        releaseDate: releaseDate.date,
        releaseType: item.mbzAlbumType || null,
        releaseYear: releaseDate.year > 0 ? releaseDate.year : null,
        size: item.size,
        songCount: item.songCount,
        songs: item.songs
            ? item.songs.map((song) => normalizeSong(song, server, pathReplace, pathReplaceWith))
            : undefined,
        sortName: item.orderAlbumName,
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
    const imageUrl = getImageUrl({ url: item?.largeImageUrl?.replace(/\?size=\d+/, '') || null });

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
        biography: item.biography || null,
        duration: null,
        genres: (item.genres || []).map((genre) => ({
            _itemType: LibraryItem.GENRE,
            _serverId: server?.id || 'unknown',
            _serverType: ServerType.NAVIDROME,
            albumCount: null,
            id: genre.id,
            imageId: null,
            imageUrl: null,
            name: genre.name,
            songCount: null,
        })),
        id: item.id,
        imageId: item.id,
        imageUrl: imageUrl || null,
        lastPlayedAt: normalizePlayDate(item),
        mbz: item.mbzArtistId || null,
        name: item.name,
        playCount: item.playCount || 0,
        similarArtists:
            item.similarArtists?.map((artist) => ({
                id: artist.id,
                imageId: null,
                imageUrl: artist?.artistImageUrl?.replace(/\?size=\d+/, '') || null,
                name: artist.name,
                userFavorite: Boolean(artist.starred) || false,
                userRating: artist.userRating || null,
            })) || [],
        songCount,
        userFavorite: item.starred || false,
        userRating: item.rating || null,
    };
};

const normalizePlaylist = (
    item: z.infer<typeof ndType._response.playlist>,
    server?: null | ServerListItem,
): Playlist => {
    const imageId = !item.uploadedImage ? item.id : `${item.id}&_=${item.updatedAt}`;

    return {
        _itemType: LibraryItem.PLAYLIST,
        _serverId: server?.id || 'unknown',
        _serverType: ServerType.NAVIDROME,
        description: item.comment,
        duration: item.duration * 1000,
        genres: [],
        id: item.id,
        imageId,
        imageUrl: null,
        name: item.name,
        owner: item.ownerName,
        ownerId: item.ownerId,
        public: item.public,
        rules: item?.rules || null,
        size: item.size,
        songCount: item.songCount,
        sync: item.sync,
        uploadedImage: item.uploadedImage,
    };
};

const normalizeGenre = (
    item: z.infer<typeof ndType._response.genre> & { albumCount?: number; songCount?: number },
    server: null | ServerListItem,
): Genre => {
    return {
        _itemType: LibraryItem.GENRE,
        _serverId: server?.id || 'unknown',
        _serverType: ServerType.NAVIDROME,
        albumCount: item.albumCount ?? null,
        id: item.id,
        imageId: null,
        imageUrl: null,
        name: item.name,
        songCount: item.songCount ?? null,
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

const normalizeInternetRadioStation = (
    item: z.infer<typeof ndType._response.radioStation>,
): InternetRadioStation => {
    const homepageUrl = item.homePageUrl?.trim() ? item.homePageUrl : null;
    const imageId = item.uploadedImage ? `${item.id}&_=${item.updatedAt}` : item.id;

    return {
        homepageUrl,
        id: item.id,
        imageId,
        imageUrl: null,
        name: item.name,
        streamUrl: item.streamUrl,
        uploadedImage: item.uploadedImage || null,
    };
};

export const ndNormalize = {
    album: normalizeAlbum,
    albumArtist: normalizeAlbumArtist,
    genre: normalizeGenre,
    internetRadioStation: normalizeInternetRadioStation,
    playlist: normalizePlaylist,
    song: normalizeSong,
    user: normalizeUser,
};
