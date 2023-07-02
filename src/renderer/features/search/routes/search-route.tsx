import { useCallback, useId, useRef } from 'react';
import { SearchContent } from '/@/renderer/features/search/components/search-content';
import { SearchHeader } from '/@/renderer/features/search/components/search-header';
import { AnimatedPage } from '/@/renderer/features/shared';
import { IDatasource } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { useCurrentServer } from '/@/renderer/store';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { LibraryItem, SearchQuery } from '/@/renderer/api/types';
import { useLocation, useParams } from 'react-router';

const SearchRoute = () => {
    const { state: locationState } = useLocation();
    const localNavigationId = useId();
    const navigationId = locationState?.navigationId || localNavigationId;
    const { itemType } = useParams() as { itemType: string };
    const tableRef = useRef<AgGridReactType | null>(null);
    const server = useCurrentServer();
    const queryClient = useQueryClient();

    const getDatasource = useCallback(
        (searchQuery: string, itemType: LibraryItem) => {
            let dataSource: IDatasource | undefined;

            switch (itemType) {
                case LibraryItem.ALBUM:
                    dataSource = {
                        getRows: async (params) => {
                            const limit = params.endRow - params.startRow;
                            const startIndex = params.startRow;

                            const query: SearchQuery = {
                                albumArtistLimit: 0,
                                albumArtistStartIndex: 0,
                                albumLimit: limit,
                                albumStartIndex: startIndex,
                                query: searchQuery || ' ',
                                songLimit: 0,
                                songStartIndex: 0,
                            };

                            const queryKey = queryKeys.search.list(server?.id || '', query);

                            const res = await queryClient.fetchQuery(
                                queryKey,
                                async ({ signal }) =>
                                    api.controller.search({
                                        apiClientProps: {
                                            server,
                                            signal,
                                        },
                                        query,
                                    }),
                                { cacheTime: 1000 * 60 },
                            );

                            if (!res) return;

                            const items = res.albums || [];
                            const numOfItems = items.length;

                            let lastRow = -1;
                            if (numOfItems < limit) {
                                lastRow = startIndex + numOfItems;
                            }

                            params.successCallback(items, lastRow);
                        },
                    };
                    break;
                case LibraryItem.ALBUM_ARTIST:
                    dataSource = {
                        getRows: async (params) => {
                            const limit = params.endRow - params.startRow;
                            const startIndex = params.startRow;

                            const query: SearchQuery = {
                                albumArtistLimit: limit,
                                albumArtistStartIndex: startIndex,
                                albumLimit: 0,
                                albumStartIndex: 0,
                                query: searchQuery || ' ',
                                songLimit: 0,
                                songStartIndex: 0,
                            };

                            const queryKey = queryKeys.search.list(server?.id || '', query);

                            const res = await queryClient.fetchQuery(
                                queryKey,
                                async ({ signal }) =>
                                    api.controller.search({
                                        apiClientProps: {
                                            server,
                                            signal,
                                        },
                                        query,
                                    }),
                                { cacheTime: 1000 * 60 },
                            );

                            if (!res) return;

                            const items = res.albumArtists || [];
                            const numOfItems = items.length;

                            let lastRow = -1;
                            if (numOfItems < limit) {
                                lastRow = startIndex + numOfItems;
                            }

                            params.successCallback(items, lastRow);
                        },
                    };
                    break;
                case LibraryItem.SONG:
                    dataSource = {
                        getRows: async (params) => {
                            const limit = params.endRow - params.startRow;
                            const startIndex = params.startRow;

                            const query: SearchQuery = {
                                albumArtistLimit: 0,
                                albumArtistStartIndex: 0,
                                albumLimit: 0,
                                albumStartIndex: 0,
                                query: searchQuery || ' ',
                                songLimit: limit,
                                songStartIndex: startIndex,
                            };

                            const queryKey = queryKeys.search.list(server?.id || '', query);

                            const res = await queryClient.fetchQuery(
                                queryKey,
                                async ({ signal }) =>
                                    api.controller.search({
                                        apiClientProps: {
                                            server,
                                            signal,
                                        },
                                        query,
                                    }),
                                { cacheTime: 1000 * 60 },
                            );

                            if (!res) return;

                            const items = res.songs || [];
                            const numOfItems = items.length;

                            let lastRow = -1;
                            if (numOfItems < limit) {
                                lastRow = startIndex + numOfItems;
                            }

                            params.successCallback(items, lastRow);
                        },
                    };
                    break;
            }

            return dataSource;
        },
        [queryClient, server],
    );

    return (
        <AnimatedPage key={`search-${navigationId}`}>
            <SearchHeader
                getDatasource={getDatasource}
                navigationId={navigationId}
                tableRef={tableRef}
            />
            <SearchContent
                key={`page-${itemType}`}
                getDatasource={getDatasource}
                tableRef={tableRef}
            />
        </AnimatedPage>
    );
};

export default SearchRoute;
