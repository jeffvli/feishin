import { PlexMetadata } from '/@/shared/api/plex/plex-types';
import {
    Album,
    AlbumArtist,
    Genre,
    LibraryItem,
    Playlist,
    RelatedArtist,
    ServerListItem,
    ServerType,
    Song,
} from '/@/shared/types/domain-types';

const date = (seconds?: number): string => new Date((seconds ?? 0) * 1000).toISOString();

const common = (item: PlexMetadata, server: ServerListItem) => ({
    _serverId: server.id,
    _serverType: ServerType.PLEX,
    blurHash: item.thumbBlurHash ?? null,
    dominantColor: null,
    id: item.ratingKey,
    imageId: item.thumb ?? item.parentThumb ?? item.composite ?? null,
    imageUrl: null,
    name: item.title,
    thumbHash: null,
    userFavorite: item.userRating === 10,
    userRating: item.userRating === undefined ? null : item.userRating / 2,
});

const relatedArtist = (id: string | undefined, name: string | undefined): RelatedArtist[] =>
    id && name
        ? [{ id, imageId: null, imageUrl: null, name, userFavorite: false, userRating: null }]
        : [];

const genres = (item: PlexMetadata, server: ServerListItem): Genre[] =>
    (item.Genre ?? []).map((genre) => ({
        _itemType: LibraryItem.GENRE,
        _serverId: server.id,
        _serverType: ServerType.PLEX,
        albumCount: null,
        id: genre.id ?? genre.tag,
        imageId: null,
        imageUrl: null,
        name: genre.tag,
        songCount: null,
    }));

const song = (item: PlexMetadata, server: ServerListItem): Song => {
    const media = item.Media?.[0];
    const part = media?.Part?.[0];
    const audio = part?.Stream?.find((stream) => stream.streamType === 2);
    const artists = relatedArtist(item.grandparentRatingKey, item.grandparentTitle);
    const releaseDate = item.originallyAvailableAt ?? (item.year ? String(item.year) : null);
    return {
        ...common(item, server),
        _itemType: LibraryItem.SONG,
        album: item.parentTitle ?? null,
        albumArtistName: item.grandparentTitle ?? '',
        albumArtists: artists,
        albumId: item.parentRatingKey ?? '',
        artistName: item.originalTitle ?? item.grandparentTitle ?? '',
        artists,
        bitDepth: audio?.bitDepth ?? null,
        bitRate: media?.bitrate ?? 0,
        bpm: null,
        channels: media?.audioChannels ?? null,
        codec: media?.audioCodec ?? null,
        comment: item.summary ?? null,
        compilation: null,
        container: media?.container ?? null,
        createdAt: date(item.addedAt),
        date: releaseDate,
        discNumber: item.parentIndex ?? 1,
        discSubtitle: null,
        duration: item.duration ?? 0,
        explicitStatus: null,
        folderId: null,
        gain: null,
        genres: genres(item, server),
        lastPlayedAt: item.lastViewedAt ? date(item.lastViewedAt) : null,
        libraryId: item.librarySectionID ?? null,
        libraryName: item.librarySectionTitle ?? null,
        lyrics: null,
        mbzAlbumId: null,
        mbzAlbumType: null,
        mbzRecordingId: null,
        mbzReleaseGroupId: null,
        mbzTrackId: null,
        missing: null,
        originalDate: releaseDate,
        originalYear: item.year ?? null,
        participants: null,
        path: part?.file ?? null,
        peak: null,
        playCount: item.viewCount ?? 0,
        playlistItemId: item.playlistItemID,
        releaseDate,
        releaseYear: item.year ?? null,
        sampleRate: audio?.samplingRate ?? null,
        size: part?.size ?? 0,
        sortName: item.titleSort ?? item.title,
        tags: null,
        trackNumber: item.index ?? 0,
        trackSubtitle: null,
        updatedAt: date(item.updatedAt),
        year: item.year ?? null,
    };
};

const album = (item: PlexMetadata, server: ServerListItem): Album => ({
    ...common(item, server),
    _itemType: LibraryItem.ALBUM,
    albumArtistName: item.parentTitle ?? '',
    albumArtists: relatedArtist(item.parentRatingKey, item.parentTitle),
    artists: relatedArtist(item.parentRatingKey, item.parentTitle),
    comment: item.summary ?? null,
    createdAt: date(item.addedAt),
    discs: null,
    duration: item.duration ?? null,
    explicitStatus: null,
    gain: null,
    genres: genres(item, server),
    isCompilation: null,
    lastPlayedAt: item.lastViewedAt ? date(item.lastViewedAt) : null,
    mbzId: null,
    mbzReleaseGroupId: null,
    missing: null,
    originalDate: item.originallyAvailableAt ?? null,
    originalYear: item.year ?? null,
    participants: null,
    peak: null,
    playCount: item.viewCount ?? null,
    ratedAt: null,
    recordLabels: item.studio ? [item.studio] : [],
    releaseDate: item.originallyAvailableAt ?? null,
    releaseType: null,
    releaseTypes: [],
    releaseYear: item.year ?? null,
    size: null,
    songCount: item.leafCount ?? null,
    sortName: item.titleSort ?? item.title,
    starredAt: null,
    tags: null,
    trackYearRange: null,
    updatedAt: date(item.updatedAt),
    version: null,
});

const artist = (item: PlexMetadata, server: ServerListItem): AlbumArtist => ({
    ...common(item, server),
    _itemType: LibraryItem.ALBUM_ARTIST,
    albumCount: null,
    biography: item.summary ?? null,
    duration: null,
    genres: genres(item, server),
    lastPlayedAt: item.lastViewedAt ? date(item.lastViewedAt) : null,
    mbz: null,
    missing: null,
    playCount: item.viewCount ?? null,
    ratedAt: null,
    similarArtists: null,
    songCount: null,
    starredAt: null,
});

const playlist = (item: PlexMetadata, server: ServerListItem): Playlist => ({
    ...common(item, server),
    _itemType: LibraryItem.PLAYLIST,
    description: item.summary ?? null,
    duration: item.duration ?? null,
    evaluatedAt: null,
    genres: [],
    owner: server.username,
    ownerId: server.userId,
    public: null,
    // Smart playlists can be played, but not edited through the ordinary editor.
    rules: item.smart ? {} : null,
    size: null,
    songCount: item.leafCount ?? null,
});

export const plexNormalize = { album, artist, playlist, song };
