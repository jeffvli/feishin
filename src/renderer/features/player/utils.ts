import { QueryClient } from '@tanstack/react-query';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import {
    PlaylistSongListQuery,
    SongDetailQuery,
    SongListQuery,
    SongListResponse,
    SongListSort,
    SortOrder,
    ServerListItem,
} from '/@/renderer/api/types';

export const getPlaylistSongsById = async (args: {
    id: string;
    query?: Partial<PlaylistSongListQuery>;
    queryClient: QueryClient;
    server: ServerListItem;
}) => {
    const { id, queryClient, server, query } = args;

    const queryFilter: PlaylistSongListQuery = {
        id,
        sortBy: SongListSort.ID,
        sortOrder: SortOrder.ASC,
        startIndex: 0,
        ...query,
    };

    const queryKey = queryKeys.playlists.songList(server?.id, id, queryFilter);

    const res = await queryClient.fetchQuery(
        queryKey,
        async ({ signal }) =>
            api.controller.getPlaylistSongList({
                apiClientProps: {
                    server,
                    signal,
                },
                query: queryFilter,
            }),
        {
            cacheTime: 1000 * 60,
            staleTime: 1000 * 60,
        },
    );

    return res;
};

export const getAlbumSongsById = async (args: {
    id: string[];
    orderByIds?: boolean;
    query?: Partial<SongListQuery>;
    queryClient: QueryClient;
    server: ServerListItem;
}) => {
    const { id, queryClient, server, query } = args;

    const queryFilter: SongListQuery = {
        albumIds: id,
        sortBy: SongListSort.ALBUM,
        sortOrder: SortOrder.ASC,
        startIndex: 0,
        ...query,
    };

    const queryKey = queryKeys.songs.list(server?.id, queryFilter);

    const res = await queryClient.fetchQuery(
        queryKey,
        async ({ signal }) =>
            api.controller.getSongList({
                apiClientProps: {
                    server,
                    signal,
                },
                query: queryFilter,
            }),
        {
            cacheTime: 1000 * 60,
            staleTime: 1000 * 60,
        },
    );

    return res;
};

export const getGenreSongsById = async (args: {
    id: string[];
    orderByIds?: boolean;
    query?: Partial<SongListQuery>;
    queryClient: QueryClient;
    server: ServerListItem | null;
}) => {
    const { id, queryClient, server, query } = args;

    const data: SongListResponse = {
        items: [],
        startIndex: 0,
        totalRecordCount: 0,
    };
    for (const genreId of id) {
        const queryFilter: SongListQuery = {
            genreIds: [genreId],
            sortBy: SongListSort.GENRE,
            sortOrder: SortOrder.ASC,
            startIndex: 0,
            ...query,
        };

        const queryKey = queryKeys.songs.list(server?.id, queryFilter);

        const res = await queryClient.fetchQuery(
            queryKey,
            async ({ signal }) =>
                api.controller.getSongList({
                    apiClientProps: {
                        server,
                        signal,
                    },
                    query: queryFilter,
                }),
            {
                cacheTime: 1000 * 60,
                staleTime: 1000 * 60,
            },
        );

        data.items.push(...res!.items);
        if (data.totalRecordCount) {
            data.totalRecordCount += res!.totalRecordCount || 0;
        }
    }

    return data;
};

export const getAlbumArtistSongsById = async (args: {
    id: string[];
    orderByIds?: boolean;
    query?: Partial<SongListQuery>;
    queryClient: QueryClient;
    server: ServerListItem;
}) => {
    const { id, queryClient, server, query } = args;

    const queryFilter: SongListQuery = {
        artistIds: id || [],
        sortBy: SongListSort.ALBUM_ARTIST,
        sortOrder: SortOrder.ASC,
        startIndex: 0,
        ...query,
    };

    const queryKey = queryKeys.songs.list(server?.id, queryFilter);

    const res = await queryClient.fetchQuery(
        queryKey,
        async ({ signal }) =>
            api.controller.getSongList({
                apiClientProps: {
                    server,
                    signal,
                },
                query: queryFilter,
            }),
        {
            cacheTime: 1000 * 60,
            staleTime: 1000 * 60,
        },
    );

    return res;
};

export const getSongsByQuery = async (args: {
    query?: Partial<SongListQuery>;
    queryClient: QueryClient;
    server: ServerListItem;
}) => {
    const { queryClient, server, query } = args;

    const queryFilter: SongListQuery = {
        sortBy: SongListSort.ALBUM,
        sortOrder: SortOrder.ASC,
        startIndex: 0,
        ...query,
    };

    const queryKey = queryKeys.songs.list(server?.id, queryFilter);

    const res = await queryClient.fetchQuery(
        queryKey,
        async ({ signal }) => {
            return api.controller.getSongList({
                apiClientProps: {
                    server,
                    signal,
                },
                query: queryFilter,
            });
        },
        {
            cacheTime: 1000 * 60,
            staleTime: 1000 * 60,
        },
    );

    return res;
};

export const getSongById = async (args: {
    id: string;
    queryClient: QueryClient;
    server: ServerListItem;
}): Promise<SongListResponse> => {
    const { id, queryClient, server } = args;

    const queryFilter: SongDetailQuery = { id };

    const queryKey = queryKeys.songs.detail(server?.id, queryFilter);

    const res = await queryClient.fetchQuery(
        queryKey,
        async ({ signal }) =>
            api.controller.getSongDetail({
                apiClientProps: {
                    server,
                    signal,
                },
                query: queryFilter,
            }),
        {
            cacheTime: 1000 * 60,
            staleTime: 1000 * 60,
        },
    );

    if (!res) throw new Error('Song not found');

    return {
        items: [res],
        startIndex: 0,
        totalRecordCount: 1,
    };
};
