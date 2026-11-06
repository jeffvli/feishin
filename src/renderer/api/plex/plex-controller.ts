import { plexHeaders, plexMutation, plexRequest, plexUrl } from '/@/renderer/api/plex/plex-api';
import { authenticatePlex } from '/@/renderer/api/plex/plex-auth';
import { getServerUrl } from '/@/renderer/utils/normalize-server-url';
import { plexNormalize } from '/@/shared/api/plex/plex-normalize';
import { PlexMetadata } from '/@/shared/api/plex/plex-types';
import { sortSongList } from '/@/shared/api/utils';
import {
    AlbumArtistListArgs,
    AlbumArtistListSort,
    AlbumListQuery,
    AlbumListSort,
    ArtistListArgs,
    ArtistListQuery,
    Genre,
    InternalControllerEndpoint,
    LibraryItem,
    Played,
    PlaylistListSort,
    ReplaceApiClientProps,
    ServerInfoArgs,
    ServerListItemWithCredential,
    ServerType,
    SongListQuery,
    SongListSort,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ServerFeature } from '/@/shared/types/features-types';

type ClientProps = ReplaceApiClientProps<ServerInfoArgs>['apiClientProps'];
type ListQuery = Partial<
    Omit<AlbumListQuery, 'sortBy'> & Omit<ArtistListQuery, 'sortBy'> & Omit<SongListQuery, 'sortBy'>
> & { played?: Played; sortBy?: string };

const PLEX_SORTS: Record<string, string> = {
    album: 'album.titleSort',
    albumArtist: 'artist.titleSort',
    artist: 'artist.titleSort',
    duration: 'duration',
    name: 'titleSort',
    playCount: 'viewCount',
    random: 'random',
    rating: 'userRating',
    recentlyAdded: 'addedAt',
    recentlyPlayed: 'lastViewedAt',
    releaseDate: 'originallyAvailableAt',
    sortName: 'titleSort',
    year: 'year',
};

const requiredServer = (props: ClientProps): ServerListItemWithCredential => {
    if (!props.server) throw new Error('Plex server is required');
    return props.server;
};

const sections = async (props: ClientProps) =>
    (await plexRequest(props, '/library/sections')).Directory?.filter(
        (item) => item.type === 'artist',
    ) ?? [];

const metadata = async (props: ClientProps, id: string) => {
    const result = await plexRequest(props, `/library/metadata/${encodeURIComponent(id)}`);
    const item = result.Metadata?.[0];
    if (!item) throw new Error('Plex item not found');
    return item;
};

// Plex caps some responses even without a container size. Walk pages when the caller needs all items.
const items = async (props: ClientProps, path: string, params: Record<string, unknown> = {}) => {
    const result: PlexMetadata[] = [];
    let start = 0;
    while (true) {
        const page = await plexRequest(props, path, {
            ...params,
            'X-Plex-Container-Size': 500,
            'X-Plex-Container-Start': start,
        });
        const entries = page.Metadata ?? [];
        result.push(...entries);
        start += entries.length;
        if (!entries.length || start >= (page.totalSize ?? page.size ?? start)) break;
    }
    return result;
};

const list = async (props: ClientProps, type: 8 | 9 | 10, query: ListQuery) => {
    const selected = Array.isArray(query.musicFolderId)
        ? query.musicFolderId[0]
        : query.musicFolderId;
    const field = PLEX_SORTS[query.sortBy ?? 'name'] ?? 'titleSort';
    const params: Record<string, unknown> = {
        sort:
            field === 'random'
                ? 'random'
                : `${field}:${query.sortOrder === SortOrder.DESC ? 'desc' : 'asc'}`,
        type,
    };
    if (query.searchTerm) params.title = query.searchTerm;
    if (query.artistIds?.length || query.albumArtistIds?.length) {
        params['artist.id'] = (query.artistIds ?? query.albumArtistIds)?.join(',');
    }
    if (query.albumIds?.length) params['album.id'] = query.albumIds.join(',');
    if (query.genreIds?.length) params.genre = query.genreIds.join(',');
    if (query.favorite) params.userRating = 10;
    if (query.hasRating) params['userRating>>'] = 0;
    if (query.minYear) params['year>>'] = query.minYear - 1;
    if (query.maxYear) params['year<<'] = query.maxYear + 1;
    if (query.played === Played.Never) params.viewCount = 0;
    if (query.played === Played.Played) params['viewCount>>'] = 0;
    const path = selected
        ? `/library/sections/${encodeURIComponent(selected)}/all`
        : '/library/all';
    const startIndex = query.startIndex ?? 0;
    if (query.limit === undefined || query.limit < 0) {
        const entries = await items(props, path, params);
        return { entries: entries.slice(startIndex), startIndex, totalRecordCount: entries.length };
    }
    const response = await plexRequest(props, path, {
        ...params,
        'X-Plex-Container-Size': query.limit,
        'X-Plex-Container-Start': startIndex,
    });
    return {
        entries: response.Metadata ?? [],
        startIndex,
        totalRecordCount: response.totalSize ?? response.size ?? 0,
    };
};

const songList: InternalControllerEndpoint['getSongList'] = async ({ apiClientProps, query }) => {
    const { entries, ...page } = await list(apiClientProps, 10, query);
    const songs = entries.map((item) => plexNormalize.song(item, requiredServer(apiClientProps)));
    const sortAlbumTracks =
        (query.limit === undefined || query.limit < 0) &&
        (query.sortBy === SongListSort.ALBUM || query.sortBy === SongListSort.ALBUM_ARTIST);
    return {
        ...page,
        items: sortAlbumTracks ? sortSongList(songs, query.sortBy, query.sortOrder) : songs,
    };
};

const albumList: InternalControllerEndpoint['getAlbumList'] = async ({ apiClientProps, query }) => {
    const { entries, ...page } = await list(apiClientProps, 9, query);
    return {
        ...page,
        items: entries.map((item) => plexNormalize.album(item, requiredServer(apiClientProps))),
    };
};

const artistList = async ({
    apiClientProps,
    query,
}: ReplaceApiClientProps<AlbumArtistListArgs> | ReplaceApiClientProps<ArtistListArgs>) => {
    const { entries, ...page } = await list(apiClientProps, 8, query);
    return {
        ...page,
        items: entries.map((item) => plexNormalize.artist(item, requiredServer(apiClientProps))),
    };
};

const playlistItems = (props: ClientProps, id: string) =>
    items(props, `/playlists/${encodeURIComponent(id)}/items`);

const playlistDetail = async (props: ClientProps, id: string) => {
    const result = await plexRequest(props, `/playlists/${encodeURIComponent(id)}`);
    const playlist = result.Metadata?.[0];
    if (!playlist) throw new Error('Plex playlist not found');
    return playlist;
};

const assertEditablePlaylist = async (props: ClientProps, id: string) => {
    const playlist = await playlistDetail(props, id);
    if (playlist.type !== 'playlist' || playlist.playlistType !== 'audio' || playlist.smart) {
        throw new Error('Only regular Plex music playlists can be edited');
    }
};

const playlistUri = async (props: ClientProps, ids: string[]) => {
    const server = await plexRequest(props, '/');
    if (!server.machineIdentifier) throw new Error('Plex server identifier is missing');
    return `server://${server.machineIdentifier}/com.plexapp.plugins.library/library/metadata/${ids.map(encodeURIComponent).join(',')}`;
};

const addToPlaylist: InternalControllerEndpoint['addToPlaylist'] = async ({
    apiClientProps,
    body,
    query,
}) => {
    await assertEditablePlaylist(apiClientProps, query.id);
    // Keep URI query strings below common reverse-proxy limits while preserving order and duplicates.
    for (let start = 0; start < body.songId.length; start += 50) {
        await plexMutation(apiClientProps, `/playlists/${encodeURIComponent(query.id)}/items`, {
            uri: await playlistUri(apiClientProps, body.songId.slice(start, start + 50)),
        });
    }
    return null;
};

const replacePlaylist: InternalControllerEndpoint['replacePlaylist'] = async ({
    apiClientProps,
    body,
    query,
}) => {
    await assertEditablePlaylist(apiClientProps, query.id);
    // ponytail: validate serially before replacement; batch metadata if large replacements become slow.
    for (const id of body.songId) {
        if ((await metadata(apiClientProps, id)).type !== 'track')
            throw new Error('Invalid Plex track');
    }
    const previous = await playlistItems(apiClientProps, query.id);
    if (previous.some((item) => !item.playlistItemID))
        throw new Error('Plex playlist entry ID is missing');
    // Plex has no atomic replace. Append successfully before removing old entries to avoid data loss.
    await addToPlaylist({ apiClientProps, body, query });
    for (const item of previous) {
        await plexMutation(
            apiClientProps,
            `/playlists/${encodeURIComponent(query.id)}/items/${encodeURIComponent(item.playlistItemID!)}`,
            {},
            'DELETE',
        );
    }
    return null;
};

const fileUrl = async (props: ClientProps, id: string, download = false) => {
    const item = await metadata(props, id);
    const part = item.Media?.[0]?.Part?.[0];
    const base = getServerUrl(props.server, props.forceRemoteUrl);
    if (!part?.key || !base) throw new Error('Plex track has no playable media');
    const url = plexUrl(base, part.key);
    // Media players cannot attach headers; use the same client identity as timeline reports.
    for (const [key, value] of Object.entries(plexHeaders(requiredServer(props).credential))) {
        if (key.startsWith('X-Plex-')) url.searchParams.set(key, value);
    }
    if (download) url.searchParams.set('download', '1');
    return url.toString();
};

const unsupported = async (): Promise<never> => {
    throw new Error('This feature is not supported by Plex');
};

export const PlexController: InternalControllerEndpoint = {
    addToPlaylist,
    authenticate: authenticatePlex,
    createFavorite: async ({ apiClientProps, query }) => {
        for (const id of query.id)
            await plexMutation(apiClientProps, '/:/rate', {
                identifier: 'com.plexapp.plugins.library',
                key: id,
                rating: 10,
            });
        return null;
    },
    createInternetRadioStation: unsupported,
    createPlaylist: async ({ apiClientProps, body }) => {
        const result = await plexRequest(
            apiClientProps,
            '/playlists',
            {
                smart: 0,
                title: body.name,
                type: 'audio',
            },
            'POST',
        );
        const id = result.Metadata?.[0]?.ratingKey;
        if (!id) throw new Error('Plex did not create the playlist');
        return { id };
    },
    deleteFavorite: async ({ apiClientProps, query }) => {
        for (const id of query.id)
            await plexMutation(apiClientProps, '/:/rate', {
                identifier: 'com.plexapp.plugins.library',
                key: id,
                rating: 0,
            });
        return null;
    },
    deleteInternetRadioStation: unsupported,
    deletePlaylist: async ({ apiClientProps, query }) => {
        await plexMutation(
            apiClientProps,
            `/playlists/${encodeURIComponent(query.id)}`,
            {},
            'DELETE',
        );
        return null;
    },
    getAlbumArtistDetail: async ({ apiClientProps, query }) =>
        plexNormalize.artist(
            await metadata(apiClientProps, query.id),
            requiredServer(apiClientProps),
        ),
    getAlbumArtistInfo: async ({ apiClientProps, query }) => ({
        biography: (await metadata(apiClientProps, query.id)).summary ?? null,
        similarArtists: [],
    }),
    getAlbumArtistList: artistList,
    getAlbumArtistListCount: async ({ apiClientProps, query }) =>
        (await list(apiClientProps, 8, { ...query, limit: 0 })).totalRecordCount,
    getAlbumDetail: async ({ apiClientProps, query }) => {
        const [item, tracks] = await Promise.all([
            metadata(apiClientProps, query.id),
            items(apiClientProps, `/library/metadata/${encodeURIComponent(query.id)}/children`),
        ]);
        const server = requiredServer(apiClientProps);
        const songs = tracks
            .filter((track) => track.type === 'track')
            .map((track) => plexNormalize.song(track, server));
        songs.sort((a, b) => a.discNumber - b.discNumber || a.trackNumber - b.trackNumber);
        return {
            ...plexNormalize.album(item, server),
            duration: songs.reduce((sum, song) => sum + song.duration, 0),
            songCount: songs.length,
            songs,
        };
    },
    getAlbumInfo: async ({ apiClientProps, query }) => ({
        imageUrl: null,
        notes: (await metadata(apiClientProps, query.id)).summary ?? null,
    }),
    getAlbumList: albumList,
    getAlbumListCount: async ({ apiClientProps, query }) =>
        (await list(apiClientProps, 9, { ...query, limit: 0 })).totalRecordCount,
    getAlbumRadio: unsupported,
    getArtistList: artistList,
    getArtistListCount: async ({ apiClientProps, query }) =>
        (await list(apiClientProps, 8, { ...query, limit: 0 })).totalRecordCount,
    getArtistRadio: unsupported,
    getDownloadUrl: ({ apiClientProps, query }) => fileUrl(apiClientProps, query.id, true),
    getFavoriteSongs: ({ apiClientProps, query }) =>
        songList({
            apiClientProps,
            query: {
                artistIds: [query.artistId],
                favorite: query.type !== 'rating',
                hasRating: query.type === 'rating',
                limit: query.limit,
                sortBy: query.type === 'rating' ? SongListSort.RATING : SongListSort.PLAY_COUNT,
                sortOrder: SortOrder.DESC,
                startIndex: 0,
            },
        }),
    getFolder: unsupported,
    getGenreList: async ({ apiClientProps, query }) => {
        const folders = await sections(apiClientProps);
        const selected = Array.isArray(query.musicFolderId)
            ? query.musicFolderId[0]
            : query.musicFolderId;
        const results = await Promise.all(
            folders
                .filter((folder) => !selected || folder.key === selected)
                .map((folder) =>
                    plexRequest(
                        apiClientProps,
                        `/library/sections/${encodeURIComponent(folder.key)}/genre`,
                        { type: 9 },
                    ),
                ),
        );
        const server = requiredServer(apiClientProps);
        const unique = new Map(
            results.flatMap((result) => result.Directory ?? []).map((entry) => [entry.key, entry]),
        );
        let genres: Genre[] = [...unique.values()].map((entry) => ({
            _itemType: LibraryItem.GENRE,
            _serverId: server.id,
            _serverType: ServerType.PLEX,
            albumCount: null,
            id: entry.key,
            imageId: null,
            imageUrl: null,
            name: entry.title,
            songCount: null,
        }));
        genres = genres.filter(
            (entry) =>
                !query.searchTerm ||
                entry.name.toLowerCase().includes(query.searchTerm.toLowerCase()),
        );
        genres.sort(
            (a, b) => a.name.localeCompare(b.name) * (query.sortOrder === SortOrder.DESC ? -1 : 1),
        );
        return {
            items: genres.slice(
                query.startIndex,
                query.limit === undefined || query.limit < 0
                    ? undefined
                    : query.startIndex + query.limit,
            ),
            startIndex: query.startIndex,
            totalRecordCount: genres.length,
        };
    },
    getImageRequest: ({ apiClientProps, baseUrl, query }) => {
        const server = requiredServer(apiClientProps);
        const base = baseUrl ?? getServerUrl(server, apiClientProps.forceRemoteUrl);
        if (!base) return null;
        const path = query.id.startsWith('/')
            ? query.id
            : `/library/metadata/${encodeURIComponent(query.id)}/thumb`;
        return {
            cacheKey: ['plex', server.id, baseUrl ?? '', path].join(':'),
            headers: plexHeaders(server.credential),
            url: plexUrl(base, path).toString(),
        };
    },
    getImageUrl: (args) => {
        const request = PlexController.getImageRequest(args);
        if (!request) return null;
        const url = new URL(request.url);
        url.searchParams.set('X-Plex-Token', requiredServer(args.apiClientProps).credential);
        return url.toString();
    },
    getInternetRadioStations: async () => [],
    getMusicFolderList: async ({ apiClientProps }) => {
        const folders = await sections(apiClientProps);
        return {
            items: folders.map((entry) => ({ id: entry.key, name: entry.title })),
            startIndex: 0,
            totalRecordCount: folders.length,
        };
    },
    getPlaylistDetail: async ({ apiClientProps, query }) =>
        plexNormalize.playlist(
            await playlistDetail(apiClientProps, query.id),
            requiredServer(apiClientProps),
        ),
    getPlaylistList: async ({ apiClientProps, query }) => {
        const playlists = (
            await items(apiClientProps, '/playlists', { playlistType: 'audio' })
        ).filter(
            (entry) =>
                (!query.excludeSmartPlaylists || !entry.smart) &&
                (!query.searchTerm ||
                    entry.title.toLowerCase().includes(query.searchTerm.toLowerCase())),
        );
        playlists.sort((a, b) => {
            const fields: Partial<
                Record<PlaylistListSort, 'duration' | 'leafCount' | 'updatedAt'>
            > = {
                [PlaylistListSort.DURATION]: 'duration',
                [PlaylistListSort.SONG_COUNT]: 'leafCount',
                [PlaylistListSort.UPDATED_AT]: 'updatedAt',
            };
            const field = fields[query.sortBy];
            const comparison = field
                ? Number(a[field] ?? 0) - Number(b[field] ?? 0)
                : a.title.localeCompare(b.title);
            return comparison * (query.sortOrder === SortOrder.DESC ? -1 : 1);
        });
        return {
            items: playlists
                .slice(
                    query.startIndex,
                    query.limit === undefined || query.limit < 0
                        ? undefined
                        : query.startIndex + query.limit,
                )
                .map((entry) => plexNormalize.playlist(entry, requiredServer(apiClientProps))),
            startIndex: query.startIndex,
            totalRecordCount: playlists.length,
        };
    },
    getPlaylistListCount: async ({ apiClientProps, query }) =>
        (
            await PlexController.getPlaylistList({
                apiClientProps,
                query: { ...query, limit: 0, startIndex: 0 },
            })
        ).totalRecordCount ?? 0,
    getPlaylistSongIds: async ({ apiClientProps, query }) => {
        const entries = await playlistItems(apiClientProps, query.id);
        return {
            items: entries.map((entry) => entry.ratingKey),
            startIndex: 0,
            totalRecordCount: entries.length,
        };
    },
    getPlaylistSongList: async ({ apiClientProps, query }) => {
        const entries = await playlistItems(apiClientProps, query.id);
        return {
            items: entries.map((entry) =>
                plexNormalize.song(entry, requiredServer(apiClientProps)),
            ),
            startIndex: 0,
            totalRecordCount: entries.length,
        };
    },
    getPlayQueue: unsupported,
    getRandomSongList: async ({ apiClientProps, query }) => {
        return songList({
            apiClientProps,
            query: {
                ...query,
                genreIds: query.genre ? [query.genre] : undefined,
                sortBy: SongListSort.RANDOM,
                sortOrder: SortOrder.ASC,
                startIndex: 0,
            },
        });
    },
    getRoles: async () => [],
    getScanStatus: async ({ apiClientProps }) => ({
        count: 0,
        folderCount: 0,
        scanning: (await sections(apiClientProps)).some((entry) => entry.refreshing),
    }),
    getServerInfo: async ({ apiClientProps }) => {
        const result = await plexRequest(apiClientProps, '/');
        return {
            features: {
                [ServerFeature.REPORT_PLAYBACK]: [1],
                [ServerFeature.TOP_SONGS_BY_ARTIST_ID]: [1],
            },
            id: requiredServer(apiClientProps).id,
            version: result.version ?? '',
        };
    },
    getSimilarSongs: unsupported,
    getSongDetail: async ({ apiClientProps, query }) =>
        plexNormalize.song(
            await metadata(apiClientProps, query.id),
            requiredServer(apiClientProps),
        ),
    getSongList: songList,
    getSongListCount: async ({ apiClientProps, query }) =>
        (await list(apiClientProps, 10, { ...query, limit: 0 })).totalRecordCount,
    getStreamUrl: async ({ apiClientProps, query }) => {
        if (!query.transcode) return fileUrl(apiClientProps, query.id);
        const base = getServerUrl(apiClientProps.server, apiClientProps.forceRemoteUrl);
        if (!base) throw new Error('Plex server is required');
        const url = plexUrl(base, '/music/:/transcode/universal/start.mp3');
        const params = {
            audioBitrate: String(query.bitrate || 320),
            audioCodec: 'mp3',
            directPlay: '0',
            directStream: '0',
            mediaIndex: '0',
            offset: String(query.startTime ?? 0),
            partIndex: '0',
            path: `/library/metadata/${encodeURIComponent(query.id)}`,
            protocol: 'http',
            ...plexHeaders(requiredServer(apiClientProps).credential),
        };
        for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
        return url.toString();
    },
    getTopSongs: ({ apiClientProps, query }) =>
        songList({
            apiClientProps,
            query: {
                artistIds: [query.artistId],
                limit: query.limit,
                sortBy: SongListSort.PLAY_COUNT,
                sortOrder: SortOrder.DESC,
                startIndex: 0,
            },
        }),
    getUserInfo: async ({ apiClientProps }) => {
        await sections(apiClientProps);
        const server = requiredServer(apiClientProps);
        return { id: server.userId ?? 'plex', isAdmin: false, name: server.username };
    },
    movePlaylistItem: async ({ apiClientProps, query }) => {
        await assertEditablePlaylist(apiClientProps, query.playlistId);
        const entries = await playlistItems(apiClientProps, query.playlistId);
        const from = entries.findIndex((entry) => entry.playlistItemID === query.trackId);
        if (
            from < 0 ||
            !Number.isInteger(query.endingIndex) ||
            query.endingIndex < 0 ||
            query.endingIndex >= entries.length
        )
            throw new Error('Invalid Plex playlist position');
        const [entry] = entries.splice(from, 1);
        entries.splice(query.endingIndex, 0, entry);
        const after = entries[query.endingIndex - 1]?.playlistItemID;
        await plexMutation(
            apiClientProps,
            `/playlists/${encodeURIComponent(query.playlistId)}/items/${encodeURIComponent(query.trackId)}/move`,
            after ? { after } : {},
        );
    },
    refreshItems: async ({ apiClientProps, query }) => {
        for (const id of query.ids)
            await plexMutation(
                apiClientProps,
                `/library/metadata/${encodeURIComponent(id)}/refresh`,
            );
        return null;
    },
    removeFromPlaylist: async ({ apiClientProps, query }) => {
        await assertEditablePlaylist(apiClientProps, query.id);
        for (const id of query.songId)
            await plexMutation(
                apiClientProps,
                `/playlists/${encodeURIComponent(query.id)}/items/${encodeURIComponent(id)}`,
                {},
                'DELETE',
            );
        return null;
    },
    replacePlaylist,
    savePlayQueue: unsupported,
    scrobble: async ({ apiClientProps, query }) => {
        if (query.submission) {
            await plexMutation(
                apiClientProps,
                '/:/scrobble',
                { identifier: 'com.plexapp.plugins.library', key: query.id },
                'GET',
            );
            return null;
        }
        if (!query.event) return null;
        const duration = query.duration ?? (await metadata(apiClientProps, query.id)).duration ?? 0;
        const position = query.position ?? 0;
        if (
            !Number.isFinite(duration) ||
            duration < 0 ||
            !Number.isFinite(position) ||
            position < 0
        )
            throw new Error('Invalid Plex playback position or duration');
        await plexMutation(
            apiClientProps,
            '/:/timeline',
            {
                duration: Math.round(duration),
                identifier: 'com.plexapp.plugins.library',
                key: `/library/metadata/${encodeURIComponent(query.id)}`,
                ratingKey: query.id,
                state:
                    query.event === 'stop'
                        ? 'stopped'
                        : query.event === 'pause'
                          ? 'paused'
                          : 'playing',
                time: Math.round(position),
            },
            'GET',
        );
        return null;
    },
    search: async ({ apiClientProps, query }) => {
        const base = {
            musicFolderId: query.musicFolderId,
            searchTerm: query.query,
            sortOrder: SortOrder.ASC,
        };
        const [artists, albums, songs] = await Promise.all([
            artistList({
                apiClientProps,
                query: {
                    ...base,
                    limit: query.albumArtistLimit ?? 20,
                    sortBy: AlbumArtistListSort.NAME,
                    startIndex: query.albumArtistStartIndex ?? 0,
                },
            }),
            albumList({
                apiClientProps,
                query: {
                    ...base,
                    limit: query.albumLimit ?? 20,
                    sortBy: AlbumListSort.NAME,
                    startIndex: query.albumStartIndex ?? 0,
                },
            }),
            songList({
                apiClientProps,
                query: {
                    ...base,
                    limit: query.songLimit ?? 20,
                    sortBy: SongListSort.NAME,
                    startIndex: query.songStartIndex ?? 0,
                },
            }),
        ]);
        return { albumArtists: artists.items, albums: albums.items, songs: songs.items };
    },
    setPlaylistSongs: async ({ apiClientProps, body }) => {
        await assertEditablePlaylist(apiClientProps, body.id);
        const entries = await playlistItems(apiClientProps, body.id);
        const remaining = [...entries];
        // Match occurrences, not just track IDs: duplicates have distinct playlist entry IDs.
        // ponytail: quadratic matching; index occurrences if very large playlist edits become slow.
        const ordered = body.songIds.map((id) => {
            const index = remaining.findIndex((entry) => entry.ratingKey === id);
            return index < 0 ? undefined : remaining.splice(index, 1)[0];
        });
        if (!remaining.length && ordered.every((entry) => entry !== undefined)) {
            if (entries.some((entry) => !entry.playlistItemID))
                throw new Error('Plex playlist entry ID is missing');
            // A pure reorder must not append/delete tracks or change their occurrence IDs.
            for (const [index, entry] of ordered.entries()) {
                const from = entries.findIndex(
                    (item) => item.playlistItemID === entry!.playlistItemID,
                );
                if (from === index) continue;
                const after = entries[index - 1]?.playlistItemID;
                await plexMutation(
                    apiClientProps,
                    `/playlists/${encodeURIComponent(body.id)}/items/${encodeURIComponent(entry!.playlistItemID!)}/move`,
                    after ? { after } : {},
                );
                entries.splice(index, 0, entries.splice(from, 1)[0]);
            }
            return null;
        }
        await replacePlaylist({
            apiClientProps,
            body: { songId: body.songIds },
            query: { id: body.id },
        });
        return null;
    },
    setRating: async ({ apiClientProps, query }) => {
        if (!Number.isFinite(query.rating) || query.rating < 0 || query.rating > 5)
            throw new Error('Invalid Plex rating');
        for (const id of query.id)
            await plexMutation(apiClientProps, '/:/rate', {
                identifier: 'com.plexapp.plugins.library',
                key: id,
                rating: query.rating * 2,
            });
        return null;
    },
    startLibraryScan: async ({ apiClientProps }) => {
        for (const folder of await sections(apiClientProps))
            await plexMutation(
                apiClientProps,
                `/library/sections/${encodeURIComponent(folder.key)}/refresh`,
                {},
                'GET',
            );
        return null;
    },
    updateInternetRadioStation: unsupported,
    updatePlaylist: async ({ apiClientProps, body, query }) => {
        await assertEditablePlaylist(apiClientProps, query.id);
        await plexMutation(apiClientProps, `/playlists/${encodeURIComponent(query.id)}`, {
            summary: body.comment,
            title: body.name,
        });
        return null;
    },
};
