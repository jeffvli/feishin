import { MutableRefObject, useCallback, useMemo } from 'react';
import { IDatasource } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { QueryKey, useQueryClient } from '@tanstack/react-query';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { BasePaginatedResponse, LibraryItem, ServerListItem } from '/@/renderer/api/types';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import orderBy from 'lodash/orderBy';

export interface UseHandleListFilterChangeProps {
    isClientSideSort?: boolean;
    itemType: LibraryItem;
    server: ServerListItem | null;
}

export const useListFilterRefresh = ({
    server,
    itemType,
    isClientSideSort,
}: UseHandleListFilterChangeProps) => {
    const queryClient = useQueryClient();

    const queryKeyFn: ((serverId: string, query: Record<any, any>) => QueryKey) | null =
        useMemo(() => {
            if (itemType === LibraryItem.ALBUM) {
                return queryKeys.albums.list;
            }
            if (itemType === LibraryItem.ALBUM_ARTIST) {
                return queryKeys.albumArtists.list;
            }
            if (itemType === LibraryItem.PLAYLIST) {
                return queryKeys.playlists.list;
            }
            if (itemType === LibraryItem.SONG) {
                return queryKeys.songs.list;
            }
            if (itemType === LibraryItem.GENRE) {
                return queryKeys.genres.list;
            }

            return null;
        }, [itemType]);

    const queryFn: ((args: any) => Promise<BasePaginatedResponse<any> | null | undefined>) | null =
        useMemo(() => {
            if (itemType === LibraryItem.ALBUM) {
                return api.controller.getAlbumList;
            }
            if (itemType === LibraryItem.ALBUM_ARTIST) {
                return api.controller.getAlbumArtistList;
            }
            if (itemType === LibraryItem.PLAYLIST) {
                return api.controller.getPlaylistList;
            }
            if (itemType === LibraryItem.SONG) {
                return api.controller.getSongList;
            }
            if (itemType === LibraryItem.GENRE) {
                return api.controller.getGenreList;
            }

            return null;
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

                    if (isClientSideSort && res?.items) {
                        const sortedResults = orderBy(
                            res.items,
                            [(item) => String(item[filter.sortBy]).toLowerCase()],
                            filter.sortOrder === 'DESC' ? ['desc'] : ['asc'],
                        );

                        params.successCallback(sortedResults || [], res?.totalRecordCount || 0);
                        return;
                    }

                    params.successCallback(res?.items || [], res?.totalRecordCount || 0);
                },

                rowCount: undefined,
            };

            tableRef.current?.api.setDatasource(dataSource);
            tableRef.current?.api.purgeInfiniteCache();
            tableRef.current?.api.ensureIndexVisible(0, 'top');
        },
        [isClientSideSort, queryClient, queryFn, queryKeyFn, server],
    );

    const handleRefreshGrid = useCallback(
        async (gridRef: MutableRefObject<VirtualInfiniteGridRef | null>, filter: any) => {
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
