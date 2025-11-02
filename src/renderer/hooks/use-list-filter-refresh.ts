import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { IDatasource } from '@ag-grid-community/core';
import { QueryKey, useQueryClient } from '@tanstack/react-query';
import orderBy from 'lodash/orderBy';
import { MutableRefObject, useCallback, useMemo } from 'react';

import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid/virtual-infinite-grid';
import { BasePaginatedResponse, LibraryItem, ServerListItem } from '/@/shared/types/domain-types';

export interface UseHandleListFilterChangeProps {
    isClientSideSort?: boolean;
    itemCount?: number;
    itemType: LibraryItem;
    server: null | ServerListItem;
}

const BLOCK_SIZE = 500;

export const useListFilterRefresh = ({
    isClientSideSort,
    itemCount,
    itemType,
    server,
}: UseHandleListFilterChangeProps) => {
    const queryClient = useQueryClient();

    const queryKeyFn: ((serverId: string, query: Record<any, any>) => QueryKey) | null =
        useMemo(() => {
            switch (itemType) {
                case LibraryItem.ALBUM:
                    return queryKeys.albums.list;
                case LibraryItem.ALBUM_ARTIST:
                    return queryKeys.albumArtists.list;
                case LibraryItem.ARTIST:
                    return queryKeys.artists.list;
                case LibraryItem.GENRE:
                    return queryKeys.genres.list;
                case LibraryItem.PLAYLIST:
                    return queryKeys.playlists.list;
                case LibraryItem.SONG:
                    return queryKeys.songs.list;
                default:
                    return null;
            }
        }, [itemType]);

    const queryFn: ((args: any) => Promise<BasePaginatedResponse<any> | null | undefined>) | null =
        useMemo(() => {
            switch (itemType) {
                case LibraryItem.ALBUM:
                    return api.controller.getAlbumList;
                case LibraryItem.ALBUM_ARTIST:
                    return api.controller.getAlbumArtistList;
                case LibraryItem.ARTIST:
                    return api.controller.getArtistList;
                case LibraryItem.GENRE:
                    return api.controller.getGenreList;
                case LibraryItem.PLAYLIST:
                    return api.controller.getPlaylistList;
                case LibraryItem.SONG:
                    return api.controller.getSongList;
                default:
                    return null;
            }
        }, [itemType]);

    const handleRefreshTable = useCallback(
        async (tableRef: MutableRefObject<AgGridReactType | null>, filter: any) => {
            if (!tableRef || !queryKeyFn || !queryFn) {
                return;
            }

            const dataSource: IDatasource = {
                getRows: async (params) => {
                    const limit = params.endRow - params.startRow;
                    const startIndex = params.startRow;

                    const query = { ...filter, limit, startIndex };

                    const queryKey = queryKeyFn(server?.id || '', query);

                    const results = await queryClient.fetchQuery({
                        queryFn: async ({ signal }) => {
                            return queryFn({
                                apiClientProps: {
                                    server,
                                    signal,
                                },
                                query,
                            });
                        },
                        queryKey,
                    });

                    if (isClientSideSort && results?.items) {
                        const sortedResults = orderBy(
                            results.items,
                            [(item) => String(item[filter.sortBy]).toLowerCase()],
                            filter.sortOrder === 'DESC' ? ['desc'] : ['asc'],
                        );

                        params.successCallback(
                            sortedResults || [],
                            results?.totalRecordCount || itemCount,
                        );
                        return;
                    }

                    if (results?.totalRecordCount === null) {
                        const hasMoreRows = results?.items?.length === BLOCK_SIZE;
                        const lastRowIndex = hasMoreRows
                            ? undefined
                            : (filter.offset || 0) + results.items.length;

                        params.successCallback(
                            results?.items || [],
                            hasMoreRows ? undefined : lastRowIndex,
                        );
                        return;
                    }

                    params.successCallback(results?.items || [], results?.totalRecordCount || 0);
                },

                rowCount: undefined,
            };

            tableRef.current?.api.setDatasource(dataSource);
            tableRef.current?.api.purgeInfiniteCache();
            tableRef.current?.api.ensureIndexVisible(0, 'top');
        },
        [isClientSideSort, itemCount, queryClient, queryFn, queryKeyFn, server],
    );

    const handleRefreshGrid = useCallback(
        async (gridRef: MutableRefObject<null | VirtualInfiniteGridRef>, filter: any) => {
            if (!gridRef || !queryKeyFn || !queryFn) {
                return;
            }

            gridRef.current?.scrollTo(0);
            gridRef.current?.resetLoadMoreItemsCache();

            const query = { ...filter, limit: 200, startIndex: 0 };

            const queryKey = queryKeyFn(server?.id || '', query);

            const res = await queryClient.fetchQuery({
                queryFn: async ({ signal }) => {
                    return queryFn({
                        apiClientProps: {
                            server,
                            signal,
                        },
                        query,
                    });
                },
                queryKey,
            });

            if (!res?.items) {
                return;
            }

            gridRef.current?.setItemData(res.items);
        },
        [queryClient, queryFn, queryKeyFn, server],
    );

    return {
        handleRefreshGrid,
        handleRefreshTable,
    };
};
