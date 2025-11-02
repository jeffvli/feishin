import { queryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { controller } from '/@/renderer/api/controller';
import { queryKeys } from '/@/renderer/api/query-keys';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { getServerById } from '/@/renderer/store';
import { ListCountQuery, SimilarSongsQuery, SongListQuery } from '/@/shared/types/domain-types';

export const songsQueries = {
    list: (args: QueryHookArgs<SongListQuery>, imageSize?: number) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                const server = getServerById(args.serverId);
                if (!server) throw new Error('Server not found');
                return controller.getSongList({
                    apiClientProps: { server, signal },
                    query: { ...args.query, imageSize },
                });
            },
            queryKey: queryKeys.songs.list(args.serverId || '', { ...args.query, imageSize }),
            ...args.options,
        });
    },
    listCount: (args: QueryHookArgs<ListCountQuery<SongListQuery>>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                const server = getServerById(args.serverId);
                if (!server) throw new Error('Server not found');
                return api.controller.getSongListCount({
                    apiClientProps: { server, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.songs.count(
                args.serverId || '',
                Object.keys(args.query).length === 0 ? undefined : args.query,
            ),
            ...args.options,
        });
    },
    similar: (args: QueryHookArgs<SimilarSongsQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                const server = getServerById(args.serverId);
                if (!server) throw new Error('Server not found');
                return api.controller.getSimilarSongs({
                    apiClientProps: { server, signal },
                    query: {
                        albumArtistIds: args.query.albumArtistIds,
                        count: args.query.count ?? 50,
                        songId: args.query.songId,
                    },
                });
            },
            queryKey: queryKeys.songs.similar(args.serverId || '', args.query),
            ...args.options,
        });
    },
};
