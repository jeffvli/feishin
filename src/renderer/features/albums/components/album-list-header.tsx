import type { ChangeEvent, MutableRefObject } from 'react';
import { useCallback } from 'react';
import { IDatasource } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Flex, Group, Stack } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { api } from '/@/renderer/api';
import { controller } from '/@/renderer/api/controller';
import { queryKeys } from '/@/renderer/api/query-keys';
import { AlbumListQuery, LibraryItem } from '/@/renderer/api/types';
import { PageHeader, SearchInput } from '/@/renderer/components';
import { FilterBar, LibraryHeaderBar } from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';
import {
    AlbumListFilter,
    useAlbumListFilter,
    useAlbumListStore,
    useCurrentServer,
    useListStoreActions,
} from '/@/renderer/store';
import { ListDisplayType, Play } from '/@/renderer/types';
import { AlbumListHeaderFilters } from '/@/renderer/features/albums/components/album-list-header-filters';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { useAlbumListContext } from '/@/renderer/features/albums/context/album-list-context';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';

interface AlbumListHeaderProps {
    customFilters?: Partial<AlbumListFilter>;
    gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
    title?: string;
}

export const AlbumListHeader = ({
    itemCount,
    gridRef,
    tableRef,
    title,
    customFilters,
}: AlbumListHeaderProps) => {
    const queryClient = useQueryClient();
    const server = useCurrentServer();
    const { setFilter, setTablePagination } = useListStoreActions();
    const cq = useContainerQuery();
    const { id, pageKey } = useAlbumListContext();
    const { display } = useAlbumListStore({ id, key: pageKey });
    const filter = useAlbumListFilter({ id, key: pageKey });

    const fetch = useCallback(
        async (skip: number, take: number, filters: AlbumListFilter) => {
            const query: AlbumListQuery = {
                limit: take,
                startIndex: skip,
                ...filters,
                ...customFilters,
                _custom: {
                    jellyfin: {
                        ...filters._custom?.jellyfin,
                        ...customFilters?._custom?.jellyfin,
                    },
                    navidrome: {
                        ...filters._custom?.navidrome,
                        ...customFilters?._custom?.navidrome,
                    },
                },
            };

            const queryKey = queryKeys.albums.list(server?.id || '', query);

            const albums = await queryClient.fetchQuery(
                queryKey,
                async ({ signal }) =>
                    controller.getAlbumList({
                        apiClientProps: {
                            server,
                            signal,
                        },
                        query,
                    }),
                { cacheTime: 1000 * 60 * 1 },
            );

            return albums;
        },
        [customFilters, queryClient, server],
    );

    const handleFilterChange = useCallback(
        async (filters: AlbumListFilter) => {
            if (display === ListDisplayType.TABLE || display === ListDisplayType.TABLE_PAGINATED) {
                const dataSource: IDatasource = {
                    getRows: async (params) => {
                        const limit = params.endRow - params.startRow;
                        const startIndex = params.startRow;

                        const query: AlbumListQuery = {
                            limit,
                            startIndex,
                            ...filters,
                            ...customFilters,
                            _custom: {
                                jellyfin: {
                                    ...filters._custom?.jellyfin,
                                    ...customFilters?._custom?.jellyfin,
                                },
                                navidrome: {
                                    ...filters._custom?.navidrome,
                                    ...customFilters?._custom?.navidrome,
                                },
                            },
                        };

                        const queryKey = queryKeys.albums.list(server?.id || '', query);

                        const albumsRes = await queryClient.fetchQuery(
                            queryKey,
                            async ({ signal }) =>
                                api.controller.getAlbumList({
                                    apiClientProps: {
                                        server,
                                        signal,
                                    },
                                    query,
                                }),
                            { cacheTime: 1000 * 60 * 1 },
                        );

                        params.successCallback(
                            albumsRes?.items || [],
                            albumsRes?.totalRecordCount || 0,
                        );
                    },
                    rowCount: undefined,
                };
                tableRef.current?.api.setDatasource(dataSource);
                tableRef.current?.api.purgeInfiniteCache();
                tableRef.current?.api.ensureIndexVisible(0, 'top');

                if (display === ListDisplayType.TABLE_PAGINATED) {
                    setTablePagination({ data: { currentPage: 0 }, key: 'album' });
                }
            } else {
                gridRef.current?.scrollTo(0);
                gridRef.current?.resetLoadMoreItemsCache();

                // Refetching within the virtualized grid may be inconsistent due to it refetching
                // using an outdated set of filters. To avoid this, we fetch using the updated filters
                // and then set the grid's data here.
                const data = await fetch(0, 200, filters);

                if (!data?.items) return;
                gridRef.current?.setItemData(data.items);
            }
        },
        [display, tableRef, customFilters, server, queryClient, setTablePagination, gridRef, fetch],
    );

    const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {
        const previousSearchTerm = filter.searchTerm;
        const searchTerm = e.target.value === '' ? undefined : e.target.value;
        const updatedFilters = setFilter({
            data: { searchTerm },
            itemType: LibraryItem.ALBUM,
            key: 'album',
        }) as AlbumListFilter;
        if (previousSearchTerm !== searchTerm) handleFilterChange(updatedFilters);
    }, 500);

    const handlePlayQueueAdd = usePlayQueueAdd();
    const playButtonBehavior = usePlayButtonBehavior();

    const handlePlay = async (playType: Play) => {
        if (!itemCount || itemCount === 0) return;

        const query = {
            startIndex: 0,
            ...filter,
            ...customFilters,
            _custom: {
                jellyfin: {
                    ...filter._custom?.jellyfin,
                    ...customFilters?._custom?.jellyfin,
                },
                navidrome: {
                    ...filter._custom?.navidrome,
                    ...customFilters?._custom?.navidrome,
                },
            },
        };
        const queryKey = queryKeys.albums.list(server?.id || '', query);

        const albumListRes = await queryClient.fetchQuery({
            queryFn: ({ signal }) =>
                api.controller.getAlbumList({ apiClientProps: { server, signal }, query }),
            queryKey,
        });

        const albumIds = albumListRes?.items?.map((item) => item.id) || [];

        handlePlayQueueAdd?.({
            byItemType: {
                id: albumIds,
                type: LibraryItem.ALBUM,
            },
            playType,
        });
    };

    return (
        <Stack
            ref={cq.ref}
            spacing={0}
        >
            <PageHeader backgroundColor="var(--titlebar-bg)">
                <Flex
                    justify="space-between"
                    w="100%"
                >
                    <LibraryHeaderBar>
                        <LibraryHeaderBar.PlayButton
                            onClick={() => handlePlay(playButtonBehavior)}
                        />
                        <LibraryHeaderBar.Title>{title || 'Albums'}</LibraryHeaderBar.Title>
                        <LibraryHeaderBar.Badge
                            isLoading={itemCount === null || itemCount === undefined}
                        >
                            {itemCount}
                        </LibraryHeaderBar.Badge>
                    </LibraryHeaderBar>
                    <Group>
                        <SearchInput
                            defaultValue={filter.searchTerm}
                            openedWidth={cq.isMd ? 250 : cq.isSm ? 200 : 150}
                            onChange={handleSearch}
                        />
                    </Group>
                </Flex>
            </PageHeader>
            <FilterBar>
                <AlbumListHeaderFilters
                    customFilters={customFilters}
                    gridRef={gridRef}
                    itemCount={itemCount}
                    tableRef={tableRef}
                />
            </FilterBar>
        </Stack>
    );
};
