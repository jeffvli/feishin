import {
    albumArtistListSortMap,
    sortOrderMap,
    albumListSortMap,
    songListSortMap,
    playlistListSortMap,
    genreListSortMap,
    Song,
    Played,
    ControllerEndpoint,
} from '/@/renderer/api/types';
import { jfApiClient } from '/@/renderer/api/jellyfin/jellyfin-api';
import { jfNormalize } from './jellyfin-normalize';
import { jfType } from '/@/renderer/api/jellyfin/jellyfin-types';
import { z } from 'zod';
import { JFSongListSort, JFSortOrder } from '/@/renderer/api/jellyfin.types';
import { ServerFeature } from '/@/renderer/api/features-types';
import { VersionInfo, getFeatures } from '/@/renderer/api/utils';
import chunk from 'lodash/chunk';

const formatCommaDelimitedString = (value: string[]) => {
    return value.join(',');
};

// Limit the query to 50 at a time to be *extremely* conservative on the
// length of the full URL, since the ids are part of the query string and
// not the POST body
const MAX_ITEMS_PER_PLAYLIST_ADD = 50;

const VERSION_INFO: VersionInfo = [
    [
        '10.9.0',
        {
            [ServerFeature.LYRICS_SINGLE_STRUCTURED]: [1],
            [ServerFeature.PUBLIC_PLAYLIST]: [1],
        },
    ],
];

export const JellyfinController: ControllerEndpoint = {
    addToPlaylist: async (args) => {
        const { query, body, apiClientProps } = args;

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const chunks = chunk(body.songId, MAX_ITEMS_PER_PLAYLIST_ADD);

        for (const chunk of chunks) {
            const res = await jfApiClient(apiClientProps).addToPlaylist({
                body: null,
                params: {
                    id: query.id,
                },
                query: {
                    Ids: chunk.join(','),
                    UserId: apiClientProps.server?.userId,
                },
            });

            if (res.status !== 204) {
                throw new Error('Failed to add to playlist');
            }
        }

        return null;
    },
    authenticate: async (url, body) => {
        const cleanServerUrl = url.replace(/\/$/, '');

        const res = await jfApiClient({ server: null, url: cleanServerUrl }).authenticate({
            body: {
                Pw: body.password,
                Username: body.username,
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
    },
    createFavorite: async (args) => {
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
    },
    createPlaylist: async (args) => {
        const { body, apiClientProps } = args;

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const res = await jfApiClient(apiClientProps).createPlaylist({
            body: {
                IsPublic: body.public,
                MediaType: 'Audio',
                Name: body.name,
                UserId: apiClientProps.server.userId,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to create playlist');
        }

        return {
            id: res.body.Id,
        };
    },
    deleteFavorite: async (args) => {
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
    },
    deletePlaylist: async (args) => {
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
    },
    getAlbumArtistDetail: async (args) => {
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
    },
    getAlbumArtistList: async (args) => {
        const { query, apiClientProps } = args;

        const res = await jfApiClient(apiClientProps).getAlbumArtistList({
            query: {
                Fields: 'Genres, DateCreated, ExternalUrls, Overview',
                ImageTypeLimit: 1,
                Limit: query.limit,
                ParentId: query.musicFolderId,
                Recursive: true,
                SearchTerm: query.searchTerm,
                SortBy: albumArtistListSortMap.jellyfin[query.sortBy] || 'SortName,Name',
                SortOrder: sortOrderMap.jellyfin[query.sortOrder],
                StartIndex: query.startIndex,
                UserId: apiClientProps.server?.userId || undefined,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get album artist list');
        }

        return {
            items: res.body.Items.map((item) =>
                jfNormalize.albumArtist(item, apiClientProps.server),
            ),
            startIndex: query.startIndex,
            totalRecordCount: res.body.TotalRecordCount,
        };
    },
    getAlbumArtistListCount: async ({ apiClientProps, query }) =>
        JellyfinController.getAlbumArtistList({
            apiClientProps,
            query: { ...query, limit: 1, startIndex: 0 },
        }).then((result) => result!.totalRecordCount!),
    getAlbumDetail: async (args) => {
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

        return jfNormalize.album(
            { ...res.body, Songs: songsRes.body.Items },
            apiClientProps.server,
        );
    },
    getAlbumList: async (args) => {
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

        const yearsFilter = yearsGroup.length ? yearsGroup.join(',') : undefined;

        const res = await jfApiClient(apiClientProps).getAlbumList({
            params: {
                userId: apiClientProps.server?.userId,
            },
            query: {
                AlbumArtistIds: query.artistIds
                    ? formatCommaDelimitedString(query.artistIds)
                    : undefined,
                ContributingArtistIds: query.compilation ? query.artistIds?.[0] : undefined,
                GenreIds: query.genres ? query.genres.join(',') : undefined,
                IncludeItemTypes: 'MusicAlbum',
                IsFavorite: query.favorite,
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
    },
    getAlbumListCount: async ({ apiClientProps, query }) =>
        JellyfinController.getAlbumList({
            apiClientProps,
            query: { ...query, limit: 1, startIndex: 0 },
        }).then((result) => result!.totalRecordCount!),
    getDownloadUrl: (args) => {
        const { apiClientProps, query } = args;

        return `${apiClientProps.server?.url}/items/${query.id}/download?api_key=${apiClientProps.server?.credential}`;
    },
    getGenreList: async (args) => {
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
    },
    getLyrics: async (args) => {
        const { query, apiClientProps } = args;

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const res = await jfApiClient(apiClientProps).getSongLyrics({
            params: {
                id: query.songId,
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get lyrics');
        }

        if (res.body.Lyrics.length > 0 && res.body.Lyrics[0].Start === undefined) {
            return res.body.Lyrics.map((lyric) => lyric.Text).join('\n');
        }

        return res.body.Lyrics.map((lyric) => [lyric.Start! / 1e4, lyric.Text]);
    },
    getMusicFolderList: async (args) => {
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
    },
    getPlaylistDetail: async (args) => {
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
    },
    getPlaylistList: async (args) => {
        const { query, apiClientProps } = args;

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const res = await jfApiClient(apiClientProps).getPlaylistList({
            params: {
                userId: apiClientProps.server?.userId,
            },
            query: {
                Fields: 'ChildCount, Genres, DateCreated, ParentId, Overview',
                IncludeItemTypes: 'Playlist',
                Limit: query.limit,
                Recursive: true,
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
    },
    getPlaylistListCount: async ({ apiClientProps, query }) =>
        JellyfinController.getPlaylistList({
            apiClientProps,
            query: { ...query, limit: 1, startIndex: 0 },
        }).then((result) => result!.totalRecordCount!),
    getPlaylistSongList: async (args) => {
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
                StartIndex: query.startIndex,
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
    },
    getRandomSongList: async (args) => {
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
                IsPlayed:
                    query.played === Played.Never
                        ? false
                        : query.played === Played.Played
                          ? true
                          : undefined,
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
    },
    getServerInfo: async (args) => {
        const { apiClientProps } = args;

        const res = await jfApiClient(apiClientProps).getServerInfo();

        if (res.status !== 200) {
            throw new Error('Failed to get server info');
        }

        const features = getFeatures(VERSION_INFO, res.body.Version);

        return {
            features,
            id: apiClientProps.server?.id,
            version: res.body.Version,
        };
    },
    getSimilarSongs: async (args) => {
        const { apiClientProps, query } = args;

        // Prefer getSimilarSongs, where possible. Fallback to InstantMix
        // where no similar songs were found.
        const res = await jfApiClient(apiClientProps).getSimilarSongs({
            params: {
                itemId: query.songId,
            },
            query: {
                Fields: 'Genres, DateCreated, MediaSources, ParentId',
                Limit: query.count,
                UserId: apiClientProps.server?.userId || undefined,
            },
        });

        if (res.status === 200 && res.body.Items.length) {
            const results = res.body.Items.reduce<Song[]>((acc, song) => {
                if (song.Id !== query.songId) {
                    acc.push(jfNormalize.song(song, apiClientProps.server, ''));
                }

                return acc;
            }, []);

            if (results.length > 0) {
                return results;
            }
        }

        const mix = await jfApiClient(apiClientProps).getInstantMix({
            params: {
                itemId: query.songId,
            },
            query: {
                Fields: 'Genres, DateCreated, MediaSources, ParentId',
                Limit: query.count,
                UserId: apiClientProps.server?.userId || undefined,
            },
        });

        if (mix.status !== 200) {
            throw new Error('Failed to get similar songs');
        }

        return mix.body.Items.reduce<Song[]>((acc, song) => {
            if (song.Id !== query.songId) {
                acc.push(jfNormalize.song(song, apiClientProps.server, ''));
            }

            return acc;
        }, []);
    },
    getSongDetail: async (args) => {
        const { query, apiClientProps } = args;

        const res = await jfApiClient(apiClientProps).getSongDetail({
            params: {
                id: query.id,
                userId: apiClientProps.server?.userId ?? '',
            },
        });

        if (res.status !== 200) {
            throw new Error('Failed to get song detail');
        }

        return jfNormalize.song(res.body, apiClientProps.server, '');
    },
    getSongList: async (args) => {
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
        const albumIdsFilter = query.albumIds
            ? formatCommaDelimitedString(query.albumIds)
            : undefined;
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
                GenreIds: query.genreIds?.join(','),
                IncludeItemTypes: 'Audio',
                IsFavorite: query.favorite,
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

        let items: z.infer<typeof jfType._response.song>[];

        // Jellyfin Bodge because of code from https://github.com/jellyfin/jellyfin/blob/c566ccb63bf61f9c36743ddb2108a57c65a2519b/Emby.Server.Implementations/Data/SqliteItemRepository.cs#L3622
        // If the Album ID filter is passed, Jellyfin will search for
        //  1. the matching album id
        //  2. An album with the name of the album.
        // It is this second condition causing issues,
        if (query.albumIds) {
            const albumIdSet = new Set(query.albumIds);
            items = res.body.Items.filter((item) => albumIdSet.has(item.AlbumId!));

            if (items.length < res.body.Items.length) {
                res.body.TotalRecordCount -= res.body.Items.length - items.length;
            }
        } else {
            items = res.body.Items;
        }

        return {
            items: items.map((item) =>
                jfNormalize.song(item, apiClientProps.server, '', query.imageSize),
            ),
            startIndex: query.startIndex,
            totalRecordCount: res.body.TotalRecordCount,
        };
    },
    getSongListCount: async ({ apiClientProps, query }) =>
        JellyfinController.getSongList({
            apiClientProps,
            query: { ...query, limit: 1, startIndex: 0 },
        }).then((result) => result!.totalRecordCount!),
    getTopSongs: async (args) => {
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
                SortBy: 'PlayCount,SortName',
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
    },
    getTranscodingUrl: (args) => {
        const { base, format, bitrate } = args.query;
        let url = base.replace('transcodingProtocol=hls', 'transcodingProtocol=http');
        if (format) {
            url = url.replace('audioCodec=aac', `audioCodec=${format}`);
            url = url.replace('transcodingContainer=ts', `transcodingContainer=${format}`);
        }
        if (bitrate !== undefined) {
            url += `&maxStreamingBitrate=${bitrate * 1000}`;
        }

        return url;
    },
    movePlaylistItem: async (args) => {
        const { apiClientProps, query } = args;

        const res = await jfApiClient(apiClientProps).movePlaylistItem({
            body: null,
            params: {
                itemId: query.trackId,
                newIdx: query.endingIndex.toString(),
                playlistId: query.playlistId,
            },
        });

        if (res.status !== 204) {
            throw new Error('Failed to move item in playlist');
        }
    },
    removeFromPlaylist: async (args) => {
        const { query, apiClientProps } = args;

        const chunks = chunk(query.songId, MAX_ITEMS_PER_PLAYLIST_ADD);

        for (const chunk of chunks) {
            const res = await jfApiClient(apiClientProps).removeFromPlaylist({
                body: null,
                params: {
                    id: query.id,
                },
                query: {
                    EntryIds: chunk.join(','),
                },
            });

            if (res.status !== 204) {
                throw new Error('Failed to remove from playlist');
            }
        }

        return null;
    },
    scrobble: async (args) => {
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
    },
    search: async (args) => {
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
    },
    updatePlaylist: async (args) => {
        const { query, body, apiClientProps } = args;

        if (!apiClientProps.server?.userId) {
            throw new Error('No userId found');
        }

        const res = await jfApiClient(apiClientProps).updatePlaylist({
            body: {
                Genres: body.genres?.map((item) => ({ Id: item.id, Name: item.name })) || [],
                IsPublic: body.public,
                MediaType: 'Audio',
                Name: body.name,
                PremiereDate: null,
                ProviderIds: {},
                Tags: [],
                UserId: apiClientProps.server?.userId, // Required
            },
            params: {
                id: query.id,
            },
        });

        if (res.status !== 204) {
            throw new Error('Failed to update playlist');
        }

        return null;
    },
};

// const getArtistList = async (args: ArtistListArgs): Promise<AlbumArtistListResponse> => {
//     const { query, apiClientProps } = args;

//     const res = await jfApiClient(apiClientProps).getAlbumArtistList({
//         query: {
//             Limit: query.limit,
//             ParentId: query.musicFolderId,
//             Recursive: true,
//             SortBy: artistListSortMap.jellyfin[query.sortBy] || 'SortName,Name',
//             SortOrder: sortOrderMap.jellyfin[query.sortOrder],
//             StartIndex: query.startIndex,
//         },
//     });

//     if (res.status !== 200) {
//         throw new Error('Failed to get artist list');
//     }

//     return {
//         items: res.body.Items.map((item) => jfNormalize.albumArtist(item, apiClientProps.server)),
//         startIndex: query.startIndex,
//         totalRecordCount: res.body.TotalRecordCount,
//     };
// };
