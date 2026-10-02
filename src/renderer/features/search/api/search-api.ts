import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { QueryHookArgs } from '/@/renderer/lib/react-query';
import {
    SearchQuery,
    SearchResponse,
    SongListResponse,
    SongListSort,
    SortOrder,
} from '/@/shared/types/domain-types';

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
        pageSize?: number;
        searchTerm: string;
        serverId: string | undefined;
    }) => {
        const { enabled = true, pageSize = SEARCH_PAGE_SIZE, searchTerm, serverId } = args;
        return infiniteQueryOptions({
            enabled: Boolean(serverId && searchTerm && enabled),
            getNextPageParam: (lastPage: SearchResponse, allPages: SearchResponse[]) => {
                const len = lastPage.albumArtists.length;
                if (len < pageSize) return undefined;
                return allPages.length * pageSize;
            },
            initialPageParam: 0,
            queryFn: ({ pageParam, signal }) => {
                if (!serverId) throw new Error('serverId required');
                const startIndex = (pageParam ?? 0) as number;
                return api.controller.search({
                    apiClientProps: { serverId, signal },
                    query: {
                        albumArtistLimit: pageSize,
                        albumArtistStartIndex: startIndex,
                        albumLimit: 0,
                        albumStartIndex: 0,
                        query: searchTerm,
                        songLimit: 0,
                        songStartIndex: 0,
                    },
                });
            },
            queryKey: queryKeys.search.infiniteList(
                serverId ?? '',
                'albumArtists',
                searchTerm,
                pageSize,
            ),
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
    searchArtistSongsInfinite: (args: {
        artistIds: string[];
        enabled?: boolean;
        pageSize?: number;
        searchTerm: string;
        serverId: string | undefined;
    }) => {
        const {
            artistIds,
            enabled = true,
            pageSize = SEARCH_PAGE_SIZE,
            searchTerm,
            serverId,
        } = args;
        return infiniteQueryOptions({
            enabled: Boolean(serverId && artistIds.length > 0 && enabled),
            getNextPageParam: (lastPage: SongListResponse, allPages: SongListResponse[]) => {
                const loadedCount = allPages.reduce((total, page) => total + page.items.length, 0);
                if (
                    lastPage.items.length < pageSize ||
                    (lastPage.totalRecordCount !== null && loadedCount >= lastPage.totalRecordCount)
                ) {
                    return undefined;
                }
                return loadedCount;
            },
            initialPageParam: 0,
            queryFn: ({ pageParam, signal }) => {
                if (!serverId) throw new Error('serverId required');
                return api.controller.getSongList({
                    apiClientProps: { serverId, signal },
                    query: {
                        artistIds,
                        limit: pageSize,
                        sortBy: SongListSort.NAME,
                        sortOrder: SortOrder.ASC,
                        startIndex: (pageParam ?? 0) as number,
                    },
                });
            },
            queryKey: queryKeys.search.infiniteList(
                serverId ?? '',
                `artistSongs:${artistIds.join(',')}`,
                searchTerm,
                pageSize,
            ),
        });
    },
    searchSongsInfinite: (args: {
        enabled?: boolean;
        pageSize?: number;
        searchTerm: string;
        serverId: string | undefined;
    }) => {
        const { enabled = true, pageSize = SEARCH_PAGE_SIZE, searchTerm, serverId } = args;
        return infiniteQueryOptions({
            enabled: Boolean(serverId && searchTerm && enabled),
            getNextPageParam: (lastPage: SearchResponse, allPages: SearchResponse[]) => {
                const len = lastPage.songs.length;
                if (len < pageSize) return undefined;
                return allPages.length * pageSize;
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
                        songLimit: pageSize,
                        songStartIndex: startIndex,
                    },
                });
            },
            queryKey: queryKeys.search.infiniteList(serverId ?? '', 'songs', searchTerm, pageSize),
        });
    },
};
