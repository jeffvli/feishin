import { queryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';
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
                    apiClientProps: { server: getServerById(args.serverId), signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.albumArtists.detail(args.serverId || '', args.query),
            ...args.options,
        });
    },
    albumArtistList: (args: QueryHookArgs<AlbumArtistListQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.getAlbumArtistList({
                    apiClientProps: { server: getServerById(args.serverId), signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.albumArtists.list(args.serverId || '', args.query),
            ...args.options,
        });
    },
    albumArtistListCount: (args: QueryHookArgs<ListCountQuery<AlbumArtistListQuery>>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.getAlbumArtistListCount({
                    apiClientProps: { server: getServerById(args.serverId), signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.albumArtists.count(
                args.serverId || '',
                Object.keys(args.query).length === 0 ? undefined : args.query,
            ),
            ...args.options,
        });
    },
    artistListCount: (args: QueryHookArgs<ListCountQuery<ArtistListQuery>>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.getArtistListCount({
                    apiClientProps: { server: getServerById(args.serverId), signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.albumArtists.count(
                args.serverId || '',
                Object.keys(args.query).length === 0 ? undefined : args.query,
            ),
            ...args.options,
        });
    },
    topSongs: (args: QueryHookArgs<TopSongListQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.getTopSongs({
                    apiClientProps: { server: getServerById(args.serverId), signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.albumArtists.topSongs(args.serverId || '', args.query),
            ...args.options,
        });
    },
};
