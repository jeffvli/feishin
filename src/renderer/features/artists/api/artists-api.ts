import { queryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import {
    AlbumArtistDetailQuery,
    AlbumArtistListQuery,
    ArtistListQuery,
    ListCountQuery,
    TopSongListQuery,
} from '/@/shared/types/domain-types';

export const artistsQueries = {
    albumArtistDetail: (args: QueryHookArgs<AlbumArtistDetailQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.getAlbumArtistDetail({
                    apiClientProps: { serverId: args.serverId, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.albumArtists.detail(args.serverId, args.query),
            ...args.options,
        });
    },
    albumArtistList: (args: QueryHookArgs<AlbumArtistListQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.getAlbumArtistList({
                    apiClientProps: { serverId: args.serverId, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.albumArtists.list(args.serverId, args.query),
            ...args.options,
        });
    },
    albumArtistListCount: (args: QueryHookArgs<ListCountQuery<AlbumArtistListQuery>>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.getAlbumArtistListCount({
                    apiClientProps: { serverId: args.serverId, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.albumArtists.count(
                args.serverId,
                Object.keys(args.query).length === 0 ? undefined : args.query,
            ),
            ...args.options,
        });
    },
    artistList: (args: QueryHookArgs<ArtistListQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.getArtistList({
                    apiClientProps: { serverId: args.serverId, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.artists.list(args.serverId, args.query),
            ...args.options,
        });
    },
    artistListCount: (args: QueryHookArgs<ListCountQuery<ArtistListQuery>>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller
                    .getArtistList({
                        apiClientProps: { serverId: args.serverId, signal },
                        query: { ...args.query, limit: 1, startIndex: 0 },
                    })
                    .then((result) => result?.totalRecordCount ?? 0);
            },
            queryKey: queryKeys.artists.count(
                args.serverId,
                Object.keys(args.query).length === 0 ? undefined : args.query,
            ),
            ...args.options,
        });
    },
    topSongs: (args: QueryHookArgs<TopSongListQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.getTopSongs({
                    apiClientProps: { serverId: args.serverId, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.albumArtists.topSongs(args.serverId, args.query),
            ...args.options,
        });
    },
};
