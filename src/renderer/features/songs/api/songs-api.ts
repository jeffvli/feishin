import { queryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { controller } from '/@/renderer/api/controller';
import { queryKeys } from '/@/renderer/api/query-keys';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import {
    ArtistRadioQuery,
    GetQueueQuery,
    ListCountQuery,
    RandomSongListQuery,
    SimilarSongsQuery,
    SongListQuery,
} from '/@/shared/types/domain-types';

export const songsQueries = {
    artistRadio: (args: QueryHookArgs<ArtistRadioQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.getArtistRadio({
                    apiClientProps: { serverId: args.serverId, signal },
                    query: {
                        artistId: args.query.artistId,
                        count: args.query.count ?? 20,
                    },
                });
            },
            queryKey: queryKeys.songs.artistRadio(args.serverId, args.query),
            ...args.options,
        });
    },
    getQueue: (args: QueryHookArgs<GetQueueQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.getPlayQueue({
                    apiClientProps: { serverId: args.serverId, signal },
                });
            },
            queryKey: queryKeys.player.fetch({ type: 'queue' }),
        });
    },
    list: (args: QueryHookArgs<SongListQuery>, imageSize?: number) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return controller.getSongList({
                    apiClientProps: { serverId: args.serverId, signal },
                    query: { ...args.query, imageSize },
                });
            },
            queryKey: queryKeys.songs.list(args.serverId, { ...args.query, imageSize }),
            ...args.options,
        });
    },
    listCount: (args: QueryHookArgs<ListCountQuery<SongListQuery>>) => {
        return queryOptions({
            gcTime: 1000 * 60 * 60 * 12,
            queryFn: ({ signal }) => {
                return api.controller.getSongListCount({
                    apiClientProps: { serverId: args.serverId, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.songs.count(
                args.serverId,
                Object.keys(args.query).length === 0 ? undefined : args.query,
            ),
            staleTime: 1000 * 60 * 60 * 12,
            ...args.options,
        });
    },
    random: (args: QueryHookArgs<RandomSongListQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.getRandomSongList({
                    apiClientProps: { serverId: args.serverId, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.songs.randomSongList(args.serverId, args.query),
            ...args.options,
        });
    },
    similar: (args: QueryHookArgs<SimilarSongsQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.getSimilarSongs({
                    apiClientProps: { serverId: args.serverId, signal },
                    query: {
                        count: args.query.count ?? 50,
                        songId: args.query.songId,
                    },
                });
            },
            queryKey: queryKeys.songs.similar(args.serverId, args.query),
            ...args.options,
        });
    },
};
