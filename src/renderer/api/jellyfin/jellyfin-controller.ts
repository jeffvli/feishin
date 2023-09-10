import {
    AuthenticationResponse,
    MusicFolderListArgs,
    MusicFolderListResponse,
    GenreListArgs,
    AlbumArtistDetailArgs,
    AlbumArtistListArgs,
    albumArtistListSortMap,
    sortOrderMap,
    ArtistListArgs,
    artistListSortMap,
    AlbumDetailArgs,
    AlbumListArgs,
    albumListSortMap,
    TopSongListArgs,
    SongListArgs,
    songListSortMap,
    AddToPlaylistArgs,
    RemoveFromPlaylistArgs,
    PlaylistDetailArgs,
    PlaylistSongListArgs,
    PlaylistListArgs,
    playlistListSortMap,
    CreatePlaylistArgs,
    CreatePlaylistResponse,
    UpdatePlaylistArgs,
    UpdatePlaylistResponse,
    DeletePlaylistArgs,
    FavoriteArgs,
    FavoriteResponse,
    ScrobbleArgs,
    ScrobbleResponse,
    GenreListResponse,
    AlbumArtistDetailResponse,
    AlbumArtistListResponse,
    AlbumDetailResponse,
    AlbumListResponse,
    SongListResponse,
    AddToPlaylistResponse,
    RemoveFromPlaylistResponse,
    PlaylistDetailResponse,
    PlaylistListResponse,
    SearchArgs,
    SearchResponse,
    RandomSongListResponse,
    RandomSongListArgs,
    LyricsArgs,
    LyricsResponse,
    genreListSortMap,
} from '/@/renderer/api/types';
import { jfApiClient } from '/@/renderer/api/jellyfin/jellyfin-api';
import { jfNormalize } from './jellyfin-normalize';
import { jfType } from '/@/renderer/api/jellyfin/jellyfin-types';
import packageJson from '../../../../package.json';
import { z } from 'zod';
import { JFSongListSort, JFSortOrder } from '/@/renderer/api/jellyfin.types';
import isElectron from 'is-electron';

const formatCommaDelimitedString = (value: string[]) => {
    return value.join(',');
};

function getHostname(): string {
    if (isElectron()) {
        return 'Desktop Client';
    }
    const agent = navigator.userAgent;
    switch (true) {
        case agent.toLowerCase().indexOf('edge') > -1:
            return 'Microsoft Edge';
        case agent.toLowerCase().indexOf('edg/') > -1:
            return 'Edge Chromium'; // Match also / to avoid matching for the older Edge
        case agent.toLowerCase().indexOf('opr') > -1:
            return 'Opera';
        case agent.toLowerCase().indexOf('chrome') > -1:
            return 'Chrome';
        case agent.toLowerCase().indexOf('trident') > -1:
            return 'Internet Explorer';
        case agent.toLowerCase().indexOf('firefox') > -1:
            return 'Firefox';
        case agent.toLowerCase().indexOf('safari') > -1:
            return 'Safari';
        default:
            return 'PC';
    }
}

const authenticate = async (
    url: string,
    body: {
        password: string;
        username: string;
    },
): Promise<AuthenticationResponse> => {
    const cleanServerUrl = url.replace(/\/$/, '');

    const res = await jfApiClient({ server: null, url: cleanServerUrl }).authenticate({
        body: {
            Pw: body.password,
            Username: body.username,
        },
        headers: {
            'x-emby-authorization': `MediaBrowser Client="Feishin", Device="${getHostname()}", DeviceId="Feishin", Version="${
                packageJson.version
            }"`,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to authenticate');
    }

    return {
        credential: res.body.AccessToken,
        userId: res.body.User.Id,
        username: res.body.User.Name,
    };
};

const getMusicFolderList = async (args: MusicFolderListArgs): Promise<MusicFolderListResponse> => {
    const { apiClientProps } = args;
    const userId = apiClientProps.server?.userId;

    if (!userId) throw new Error('No userId found');

    const res = await jfApiClient(apiClientProps).getMusicFolderList({
        params: {
            userId,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to get genre list');
    }

    const musicFolders = res.body.Items.filter(
        (folder) => folder.CollectionType === jfType._enum.collection.MUSIC,
    );

    return {
        items: musicFolders.map(jfNormalize.musicFolder),
        startIndex: 0,
        totalRecordCount: musicFolders?.length || 0,
    };
};

const getGenreList = async (args: GenreListArgs): Promise<GenreListResponse> => {
    const { apiClientProps, query } = args;

    if (!apiClientProps.server?.userId) {
        throw new Error('No userId found');
    }

    const res = await jfApiClient(apiClientProps).getGenreList({
        query: {
            Fields: 'ItemCounts',
            ParentId: query?.musicFolderId,
            Recursive: true,
            SearchTerm: query?.searchTerm,
            SortBy: genreListSortMap.jellyfin[query.sortBy] || 'SortName',
            SortOrder: sortOrderMap.jellyfin[query.sortOrder],
            StartIndex: query.startIndex,
            UserId: apiClientProps.server?.userId,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to get genre list');
    }

    return {
        items: res.body.Items.map((item) => jfNormalize.genre(item, apiClientProps.server)),
        startIndex: query.startIndex || 0,
        totalRecordCount: res.body?.TotalRecordCount || 0,
    };
};

const getAlbumArtistDetail = async (
    args: AlbumArtistDetailArgs,
): Promise<AlbumArtistDetailResponse> => {
    const { query, apiClientProps } = args;

    if (!apiClientProps.server?.userId) {
        throw new Error('No userId found');
    }

    const res = await jfApiClient(apiClientProps).getAlbumArtistDetail({
        params: {
            id: query.id,
            userId: apiClientProps.server?.userId,
        },
        query: {
            Fields: 'Genres, Overview',
        },
    });

    const similarArtistsRes = await jfApiClient(apiClientProps).getSimilarArtistList({
        params: {
            id: query.id,
        },
        query: {
            Limit: 10,
        },
    });

    if (res.status !== 200 || similarArtistsRes.status !== 200) {
        throw new Error('Failed to get album artist detail');
    }

    return jfNormalize.albumArtist(
        { ...res.body, similarArtists: similarArtistsRes.body },
        apiClientProps.server,
    );
};

const getAlbumArtistList = async (args: AlbumArtistListArgs): Promise<AlbumArtistListResponse> => {
    const { query, apiClientProps } = args;

    const res = await jfApiClient(apiClientProps).getAlbumArtistList({
        query: {
            Fields: 'Genres, DateCreated, ExternalUrls, Overview',
            ImageTypeLimit: 1,
            Limit: query.limit,
            ParentId: query.musicFolderId,
            Recursive: true,
            SearchTerm: query.searchTerm,
            SortBy: albumArtistListSortMap.jellyfin[query.sortBy] || 'Name,SortName',
            SortOrder: sortOrderMap.jellyfin[query.sortOrder],
            StartIndex: query.startIndex,
            UserId: apiClientProps.server?.userId || undefined,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to get album artist list');
    }

    return {
        items: res.body.Items.map((item) => jfNormalize.albumArtist(item, apiClientProps.server)),
        startIndex: query.startIndex,
        totalRecordCount: res.body.TotalRecordCount,
    };
};

const getArtistList = async (args: ArtistListArgs): Promise<AlbumArtistListResponse> => {
    const { query, apiClientProps } = args;

    const res = await jfApiClient(apiClientProps).getAlbumArtistList({
        query: {
            Limit: query.limit,
            ParentId: query.musicFolderId,
            Recursive: true,
            SortBy: artistListSortMap.jellyfin[query.sortBy] || 'Name,SortName',
            SortOrder: sortOrderMap.jellyfin[query.sortOrder],
            StartIndex: query.startIndex,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to get artist list');
    }

    return {
        items: res.body.Items.map((item) => jfNormalize.albumArtist(item, apiClientProps.server)),
        startIndex: query.startIndex,
        totalRecordCount: res.body.TotalRecordCount,
    };
};

const getAlbumDetail = async (args: AlbumDetailArgs): Promise<AlbumDetailResponse> => {
    const { query, apiClientProps } = args;

    if (!apiClientProps.server?.userId) {
        throw new Error('No userId found');
    }

    const res = await jfApiClient(apiClientProps).getAlbumDetail({
        params: {
            id: query.id,
            userId: apiClientProps.server.userId,
        },
        query: {
            Fields: 'Genres, DateCreated, ChildCount',
        },
    });

    const songsRes = await jfApiClient(apiClientProps).getSongList({
        params: {
            userId: apiClientProps.server.userId,
        },
        query: {
            Fields: 'Genres, DateCreated, MediaSources, ParentId',
            IncludeItemTypes: 'Audio',
            ParentId: query.id,
            SortBy: 'ParentIndexNumber,IndexNumber,SortName',
        },
    });

    if (res.status !== 200 || songsRes.status !== 200) {
        throw new Error('Failed to get album detail');
    }

    return jfNormalize.album({ ...res.body, Songs: songsRes.body.Items }, apiClientProps.server);
};

const getAlbumList = async (args: AlbumListArgs): Promise<AlbumListResponse> => {
    const { query, apiClientProps } = args;

    if (!apiClientProps.server?.userId) {
        throw new Error('No userId found');
    }

    const yearsGroup = [];
    if (query._custom?.jellyfin?.minYear && query._custom?.jellyfin?.maxYear) {
        for (
            let i = Number(query._custom?.jellyfin?.minYear);
            i <= Number(query._custom?.jellyfin?.maxYear);
            i += 1
        ) {
            yearsGroup.push(String(i));
        }
    }

    const yearsFilter = yearsGroup.length ? yearsGroup.join(',') : undefined;

    const res = await jfApiClient(apiClientProps).getAlbumList({
        params: {
            userId: apiClientProps.server?.userId,
        },
        query: {
            AlbumArtistIds: query.artistIds
                ? formatCommaDelimitedString(query.artistIds)
                : undefined,
            IncludeItemTypes: 'MusicAlbum',
            Limit: query.limit,
            ParentId: query.musicFolderId,
            Recursive: true,
            SearchTerm: query.searchTerm,
            SortBy: albumListSortMap.jellyfin[query.sortBy] || 'SortName',
            SortOrder: sortOrderMap.jellyfin[query.sortOrder],
            StartIndex: query.startIndex,
            ...query._custom?.jellyfin,
            Years: yearsFilter,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to get album list');
    }

    return {
        items: res.body.Items.map((item) => jfNormalize.album(item, apiClientProps.server)),
        startIndex: query.startIndex,
        totalRecordCount: res.body.TotalRecordCount,
    };
};

const getTopSongList = async (args: TopSongListArgs): Promise<SongListResponse> => {
    const { apiClientProps, query } = args;

    if (!apiClientProps.server?.userId) {
        throw new Error('No userId found');
    }

    const res = await jfApiClient(apiClientProps).getTopSongsList({
        params: {
            userId: apiClientProps.server?.userId,
        },
        query: {
            ArtistIds: query.artistId,
            Fields: 'Genres, DateCreated, MediaSources, ParentId',
            IncludeItemTypes: 'Audio',
            Limit: query.limit,
            Recursive: true,
            SortBy: 'CommunityRating,SortName',
            SortOrder: 'Descending',
            UserId: apiClientProps.server?.userId,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to get top song list');
    }

    return {
        items: res.body.Items.map((item) => jfNormalize.song(item, apiClientProps.server, '')),
        startIndex: 0,
        totalRecordCount: res.body.TotalRecordCount,
    };
};

const getSongList = async (args: SongListArgs): Promise<SongListResponse> => {
    const { query, apiClientProps } = args;

    if (!apiClientProps.server?.userId) {
        throw new Error('No userId found');
    }

    const yearsGroup = [];
    if (query._custom?.jellyfin?.minYear && query._custom?.jellyfin?.maxYear) {
        for (
            let i = Number(query._custom?.jellyfin?.minYear);
            i <= Number(query._custom?.jellyfin?.maxYear);
            i += 1
        ) {
            yearsGroup.push(String(i));
        }
    }

    const yearsFilter = yearsGroup.length ? formatCommaDelimitedString(yearsGroup) : undefined;
    const albumIdsFilter = query.albumIds ? formatCommaDelimitedString(query.albumIds) : undefined;
    const artistIdsFilter = query.artistIds
        ? formatCommaDelimitedString(query.artistIds)
        : undefined;

    const res = await jfApiClient(apiClientProps).getSongList({
        params: {
            userId: apiClientProps.server?.userId,
        },
        query: {
            AlbumIds: albumIdsFilter,
            ArtistIds: artistIdsFilter,
            Fields: 'Genres, DateCreated, MediaSources, ParentId',
            IncludeItemTypes: 'Audio',
            Limit: query.limit,
            ParentId: query.musicFolderId,
            Recursive: true,
            SearchTerm: query.searchTerm,
            SortBy: songListSortMap.jellyfin[query.sortBy] || 'Album,SortName',
            SortOrder: sortOrderMap.jellyfin[query.sortOrder],
            StartIndex: query.startIndex,
            ...query._custom?.jellyfin,
            Years: yearsFilter,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to get song list');
    }

    return {
        items: res.body.Items.map((item) => jfNormalize.song(item, apiClientProps.server, '')),
        startIndex: query.startIndex,
        totalRecordCount: res.body.TotalRecordCount,
    };
};

const addToPlaylist = async (args: AddToPlaylistArgs): Promise<AddToPlaylistResponse> => {
    const { query, body, apiClientProps } = args;

    if (!apiClientProps.server?.userId) {
        throw new Error('No userId found');
    }

    const res = await jfApiClient(apiClientProps).addToPlaylist({
        body: null,
        params: {
            id: query.id,
        },
        query: {
            Ids: body.songId,
            UserId: apiClientProps.server?.userId,
        },
    });

    if (res.status !== 204) {
        throw new Error('Failed to add to playlist');
    }

    return null;
};

const removeFromPlaylist = async (
    args: RemoveFromPlaylistArgs,
): Promise<RemoveFromPlaylistResponse> => {
    const { query, apiClientProps } = args;

    const res = await jfApiClient(apiClientProps).removeFromPlaylist({
        body: null,
        params: {
            id: query.id,
        },
        query: {
            EntryIds: query.songId,
        },
    });

    if (res.status !== 204) {
        throw new Error('Failed to remove from playlist');
    }

    return null;
};

const getPlaylistDetail = async (args: PlaylistDetailArgs): Promise<PlaylistDetailResponse> => {
    const { query, apiClientProps } = args;

    if (!apiClientProps.server?.userId) {
        throw new Error('No userId found');
    }

    const res = await jfApiClient(apiClientProps).getPlaylistDetail({
        params: {
            id: query.id,
            userId: apiClientProps.server?.userId,
        },
        query: {
            Fields: 'Genres, DateCreated, MediaSources, ChildCount, ParentId',
            Ids: query.id,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to get playlist detail');
    }

    return jfNormalize.playlist(res.body, apiClientProps.server);
};

const getPlaylistSongList = async (args: PlaylistSongListArgs): Promise<SongListResponse> => {
    const { query, apiClientProps } = args;

    if (!apiClientProps.server?.userId) {
        throw new Error('No userId found');
    }

    const res = await jfApiClient(apiClientProps).getPlaylistSongList({
        params: {
            id: query.id,
        },
        query: {
            Fields: 'Genres, DateCreated, MediaSources, UserData, ParentId',
            IncludeItemTypes: 'Audio',
            Limit: query.limit,
            SortBy: query.sortBy ? songListSortMap.jellyfin[query.sortBy] : undefined,
            SortOrder: query.sortOrder ? sortOrderMap.jellyfin[query.sortOrder] : undefined,
            StartIndex: 0,
            UserId: apiClientProps.server?.userId,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to get playlist song list');
    }

    return {
        items: res.body.Items.map((item) => jfNormalize.song(item, apiClientProps.server, '')),
        startIndex: query.startIndex,
        totalRecordCount: res.body.TotalRecordCount,
    };
};

const getPlaylistList = async (args: PlaylistListArgs): Promise<PlaylistListResponse> => {
    const { query, apiClientProps } = args;

    if (!apiClientProps.server?.userId) {
        throw new Error('No userId found');
    }

    const musicFoldersRes = await jfApiClient(apiClientProps).getMusicFolderList({
        params: {
            userId: apiClientProps.server?.userId,
        },
    });

    if (musicFoldersRes.status !== 200) {
        throw new Error('Failed playlist folder');
    }

    const playlistFolder = musicFoldersRes.body.Items.filter(
        (folder) => folder.CollectionType === jfType._enum.collection.PLAYLISTS,
    )?.[0];

    const res = await jfApiClient(apiClientProps).getPlaylistList({
        params: {
            userId: apiClientProps.server?.userId,
        },
        query: {
            Fields: 'ChildCount, Genres, DateCreated, ParentId, Overview',
            IncludeItemTypes: 'Playlist',
            Limit: query.limit,
            ParentId: playlistFolder?.Id,
            SearchTerm: query.searchTerm,
            SortBy: playlistListSortMap.jellyfin[query.sortBy],
            SortOrder: sortOrderMap.jellyfin[query.sortOrder],
            StartIndex: query.startIndex,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to get playlist list');
    }

    return {
        items: res.body.Items.map((item) => jfNormalize.playlist(item, apiClientProps.server)),
        startIndex: 0,
        totalRecordCount: res.body.TotalRecordCount,
    };
};

const createPlaylist = async (args: CreatePlaylistArgs): Promise<CreatePlaylistResponse> => {
    const { body, apiClientProps } = args;

    if (!apiClientProps.server?.userId) {
        throw new Error('No userId found');
    }

    const res = await jfApiClient(apiClientProps).createPlaylist({
        body: {
            MediaType: 'Audio',
            Name: body.name,
            Overview: body.comment || '',
            UserId: apiClientProps.server.userId,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to create playlist');
    }

    return {
        id: res.body.Id,
    };
};

const updatePlaylist = async (args: UpdatePlaylistArgs): Promise<UpdatePlaylistResponse> => {
    const { query, body, apiClientProps } = args;

    if (!apiClientProps.server?.userId) {
        throw new Error('No userId found');
    }

    const res = await jfApiClient(apiClientProps).updatePlaylist({
        body: {
            Genres: body.genres?.map((item) => ({ Id: item.id, Name: item.name })) || [],
            MediaType: 'Audio',
            Name: body.name,
            Overview: body.comment || '',
            PremiereDate: null,
            ProviderIds: {},
            Tags: [],
            UserId: apiClientProps.server?.userId, // Required
        },
        params: {
            id: query.id,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to update playlist');
    }

    return null;
};

const deletePlaylist = async (args: DeletePlaylistArgs): Promise<null> => {
    const { query, apiClientProps } = args;

    const res = await jfApiClient(apiClientProps).deletePlaylist({
        body: null,
        params: {
            id: query.id,
        },
    });

    if (res.status !== 204) {
        throw new Error('Failed to delete playlist');
    }

    return null;
};

const createFavorite = async (args: FavoriteArgs): Promise<FavoriteResponse> => {
    const { query, apiClientProps } = args;

    if (!apiClientProps.server?.userId) {
        throw new Error('No userId found');
    }

    for (const id of query.id) {
        await jfApiClient(apiClientProps).createFavorite({
            body: {},
            params: {
                id,
                userId: apiClientProps.server?.userId,
            },
        });
    }

    return null;
};

const deleteFavorite = async (args: FavoriteArgs): Promise<FavoriteResponse> => {
    const { query, apiClientProps } = args;

    if (!apiClientProps.server?.userId) {
        throw new Error('No userId found');
    }

    for (const id of query.id) {
        await jfApiClient(apiClientProps).removeFavorite({
            body: {},
            params: {
                id,
                userId: apiClientProps.server?.userId,
            },
        });
    }

    return null;
};

const scrobble = async (args: ScrobbleArgs): Promise<ScrobbleResponse> => {
    const { query, apiClientProps } = args;

    const position = query.position && Math.round(query.position);

    if (query.submission) {
        // Checked by jellyfin-plugin-lastfm for whether or not to send the "finished" scrobble (uses PositionTicks)
        jfApiClient(apiClientProps).scrobbleStopped({
            body: {
                IsPaused: true,
                ItemId: query.id,
                PositionTicks: position,
            },
        });

        return null;
    }

    if (query.event === 'start') {
        jfApiClient(apiClientProps).scrobblePlaying({
            body: {
                ItemId: query.id,
                PositionTicks: position,
            },
        });

        return null;
    }

    if (query.event === 'pause') {
        jfApiClient(apiClientProps).scrobbleProgress({
            body: {
                EventName: query.event,
                IsPaused: true,
                ItemId: query.id,
                PositionTicks: position,
            },
        });

        return null;
    }

    if (query.event === 'unpause') {
        jfApiClient(apiClientProps).scrobbleProgress({
            body: {
                EventName: query.event,
                IsPaused: false,
                ItemId: query.id,
                PositionTicks: position,
            },
        });

        return null;
    }

    jfApiClient(apiClientProps).scrobbleProgress({
        body: {
            ItemId: query.id,
            PositionTicks: position,
        },
    });

    return null;
};

const search = async (args: SearchArgs): Promise<SearchResponse> => {
    const { query, apiClientProps } = args;

    if (!apiClientProps.server?.userId) {
        throw new Error('No userId found');
    }

    let albums: z.infer<typeof jfType._response.albumList>['Items'] = [];
    let albumArtists: z.infer<typeof jfType._response.albumArtistList>['Items'] = [];
    let songs: z.infer<typeof jfType._response.songList>['Items'] = [];

    if (query.albumLimit) {
        const res = await jfApiClient(apiClientProps).getAlbumList({
            params: {
                userId: apiClientProps.server?.userId,
            },
            query: {
                EnableTotalRecordCount: true,
                ImageTypeLimit: 1,
                IncludeItemTypes: 'MusicAlbum',
                Limit: query.albumLimit,
                Recursive: true,
                SearchTerm: query.query,
                SortBy: 'SortName',
                SortOrder: 'Ascending',
                StartIndex: query.albumStartIndex || 0,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get album list');
        }

        albums = res.body.Items;
    }

    if (query.albumArtistLimit) {
        const res = await jfApiClient(apiClientProps).getAlbumArtistList({
            query: {
                EnableTotalRecordCount: true,
                Fields: 'Genres, DateCreated, ExternalUrls, Overview',
                ImageTypeLimit: 1,
                IncludeArtists: true,
                Limit: query.albumArtistLimit,
                Recursive: true,
                SearchTerm: query.query,
                StartIndex: query.albumArtistStartIndex || 0,
                UserId: apiClientProps.server?.userId,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get album artist list');
        }

        albumArtists = res.body.Items;
    }

    if (query.songLimit) {
        const res = await jfApiClient(apiClientProps).getSongList({
            params: {
                userId: apiClientProps.server?.userId,
            },
            query: {
                EnableTotalRecordCount: true,
                Fields: 'Genres, DateCreated, MediaSources, ParentId',
                IncludeItemTypes: 'Audio',
                Limit: query.songLimit,
                Recursive: true,
                SearchTerm: query.query,
                SortBy: 'Album,SortName',
                SortOrder: 'Ascending',
                StartIndex: query.songStartIndex || 0,
                UserId: apiClientProps.server?.userId,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get song list');
        }

        songs = res.body.Items;
    }

    return {
        albumArtists: albumArtists.map((item) =>
            jfNormalize.albumArtist(item, apiClientProps.server),
        ),
        albums: albums.map((item) => jfNormalize.album(item, apiClientProps.server)),
        songs: songs.map((item) => jfNormalize.song(item, apiClientProps.server, '')),
    };
};

const getRandomSongList = async (args: RandomSongListArgs): Promise<RandomSongListResponse> => {
    const { query, apiClientProps } = args;

    if (!apiClientProps.server?.userId) {
        throw new Error('No userId found');
    }

    const yearsGroup = [];
    if (query.minYear && query.maxYear) {
        for (let i = Number(query.minYear); i <= Number(query.maxYear); i += 1) {
            yearsGroup.push(String(i));
        }
    }

    const yearsFilter = yearsGroup.length ? formatCommaDelimitedString(yearsGroup) : undefined;

    const res = await jfApiClient(apiClientProps).getSongList({
        params: {
            userId: apiClientProps.server?.userId,
        },
        query: {
            Fields: 'Genres, DateCreated, MediaSources, ParentId',
            GenreIds: query.genre ? query.genre : undefined,
            IncludeItemTypes: 'Audio',
            Limit: query.limit,
            ParentId: query.musicFolderId,
            Recursive: true,
            SortBy: JFSongListSort.RANDOM,
            SortOrder: JFSortOrder.ASC,
            StartIndex: 0,
            Years: yearsFilter,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to get random songs');
    }

    return {
        items: res.body.Items.map((item) => jfNormalize.song(item, apiClientProps.server, '')),
        startIndex: 0,
        totalRecordCount: res.body.Items.length || 0,
    };
};

const getLyrics = async (args: LyricsArgs): Promise<LyricsResponse> => {
    const { query, apiClientProps } = args;

    if (!apiClientProps.server?.userId) {
        throw new Error('No userId found');
    }

    const res = await jfApiClient(apiClientProps).getSongLyrics({
        params: {
            id: query.songId,
            userId: apiClientProps.server?.userId,
        },
    });

    if (res.status !== 200) {
        throw new Error('Failed to get lyrics');
    }

    if (res.body.Lyrics.length > 0 && res.body.Lyrics[0].Start === undefined) {
        return res.body.Lyrics[0].Text;
    }

    return res.body.Lyrics.map((lyric) => [lyric.Start! / 1e4, lyric.Text]);
};

export const jfController = {
    addToPlaylist,
    authenticate,
    createFavorite,
    createPlaylist,
    deleteFavorite,
    deletePlaylist,
    getAlbumArtistDetail,
    getAlbumArtistList,
    getAlbumDetail,
    getAlbumList,
    getArtistList,
    getGenreList,
    getLyrics,
    getMusicFolderList,
    getPlaylistDetail,
    getPlaylistList,
    getPlaylistSongList,
    getRandomSongList,
    getSongList,
    getTopSongList,
    removeFromPlaylist,
    scrobble,
    search,
    updatePlaylist,
};
