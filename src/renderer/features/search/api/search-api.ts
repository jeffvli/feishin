import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import { SearchQuery, SearchResponse } from '/@/shared/types/domain-types';

const SEARCH_PAGE_SIZE = 4;

export const searchQueries = {
    search: (args: QueryHookArgs<SearchQuery>) => {
        return queryOptions({
            queryFn: ({ signal }) => {
                return api.controller.search({
                    apiClientProps: { serverId: args.serverId, signal },
                    query: args.query,
                });
            },
            queryKey: queryKeys.search.list(args.serverId, args.query),
            ...args.options,
        });
    },
    searchAlbumArtistsInfinite: (args: {
        enabled?: boolean;
        searchTerm: string;
        serverId: string | undefined;
    }) => {
        const { enabled = true, searchTerm, serverId } = args;
        return infiniteQueryOptions({
            enabled: Boolean(serverId && searchTerm && enabled),
            getNextPageParam: (lastPage: SearchResponse, allPages: SearchResponse[]) => {
                const len = lastPage.albumArtists.length;
                if (len < SEARCH_PAGE_SIZE) return undefined;
                return allPages.length * SEARCH_PAGE_SIZE;
            },
            initialPageParam: 0,
            queryFn: ({ pageParam, signal }) => {
                if (!serverId) throw new Error('serverId required');
                const startIndex = (pageParam ?? 0) as number;
                return api.controller.search({
                    apiClientProps: { serverId, signal },
                    query: {
                        albumArtistLimit: SEARCH_PAGE_SIZE,
                        albumArtistStartIndex: startIndex,
                        albumLimit: 0,
                        albumStartIndex: 0,
                        query: searchTerm,
                        songLimit: 0,
                        songStartIndex: 0,
                    },
                });
            },
            queryKey: queryKeys.search.infiniteList(serverId ?? '', 'albumArtists', searchTerm),
        });
    },
    searchAlbumsInfinite: (args: {
        enabled?: boolean;
        searchTerm: string;
        serverId: string | undefined;
    }) => {
        const { enabled = true, searchTerm, serverId } = args;
        return infiniteQueryOptions({
            enabled: Boolean(serverId && searchTerm && enabled),
            getNextPageParam: (lastPage: SearchResponse, allPages: SearchResponse[]) => {
                const len = lastPage.albums.length;
                if (len < SEARCH_PAGE_SIZE) return undefined;
                return allPages.length * SEARCH_PAGE_SIZE;
            },
            initialPageParam: 0,
            queryFn: ({ pageParam, signal }) => {
                if (!serverId) throw new Error('serverId required');
                const startIndex = (pageParam ?? 0) as number;
                return api.controller.search({
                    apiClientProps: { serverId, signal },
                    query: {
                        albumArtistLimit: 0,
                        albumArtistStartIndex: 0,
                        albumLimit: SEARCH_PAGE_SIZE,
                        albumStartIndex: startIndex,
                        query: searchTerm,
                        songLimit: 0,
                        songStartIndex: 0,
                    },
                });
            },
            queryKey: queryKeys.search.infiniteList(serverId ?? '', 'albums', searchTerm),
        });
    },
    searchSongsInfinite: (args: {
        enabled?: boolean;
        searchTerm: string;
        serverId: string | undefined;
    }) => {
        const { enabled = true, searchTerm, serverId } = args;
        return infiniteQueryOptions({
            enabled: Boolean(serverId && searchTerm && enabled),
            getNextPageParam: (lastPage: SearchResponse, allPages: SearchResponse[]) => {
                const len = lastPage.songs.length;
                if (len < SEARCH_PAGE_SIZE) return undefined;
                return allPages.length * SEARCH_PAGE_SIZE;
            },
            initialPageParam: 0,
            queryFn: ({ pageParam, signal }) => {
                if (!serverId) throw new Error('serverId required');
                const startIndex = (pageParam ?? 0) as number;
                return api.controller.search({
                    apiClientProps: { serverId, signal },
                    query: {
                        albumArtistLimit: 0,
                        albumArtistStartIndex: 0,
                        albumLimit: 0,
                        albumStartIndex: 0,
                        query: searchTerm,
                        songLimit: SEARCH_PAGE_SIZE,
                        songStartIndex: startIndex,
                    },
                });
            },
            queryKey: queryKeys.search.infiniteList(serverId ?? '', 'songs', searchTerm),
        });
    },
};
