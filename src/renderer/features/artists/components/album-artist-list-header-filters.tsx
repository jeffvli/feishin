import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { IDatasource } from '@ag-grid-community/core';
import { useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { MouseEvent, MutableRefObject, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import i18n from '/@/i18n/i18n';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ALBUMARTIST_TABLE_COLUMNS } from '/@/renderer/components/virtual-table';
import { useListContext } from '/@/renderer/context/list-context';
import { OrderToggleButton, useMusicFolders } from '/@/renderer/features/shared';
import { FolderButton } from '/@/renderer/features/shared/components/folder-button';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import { MoreButton } from '/@/renderer/features/shared/components/more-button';
import { RefreshButton } from '/@/renderer/features/shared/components/refresh-button';
import { useContainerQuery } from '/@/renderer/hooks';
import {
    AlbumArtistListFilter,
    PersistedTableColumn,
    useCurrentServer,
    useListStoreActions,
    useListStoreByKey,
} from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import {
    AlbumArtistListQuery,
    AlbumArtistListSort,
    LibraryItem,
    ServerType,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ListDisplayType } from '/@/shared/types/types';

const FILTERS = {
    jellyfin: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.album', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.ALBUM,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.duration', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.DURATION,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.NAME,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.random', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.RANDOM,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyAdded', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.RECENTLY_ADDED,
        },
        // { defaultOrder: SortOrder.DESC, name: 'Release Date', value: AlbumArtistListSort.RELEASE_DATE },
    ],
    navidrome: [
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.albumCount', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.ALBUM_COUNT,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.isFavorited', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.FAVORITED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.mostPlayed', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.PLAY_COUNT,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.NAME,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.rating', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.RATING,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.songCount', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.SONG_COUNT,
        },
    ],
    subsonic: [
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.albumCount', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.ALBUM_COUNT,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.isFavorited', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.FAVORITED,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.NAME,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.rating', { postProcess: 'titleCase' }),
            value: AlbumArtistListSort.RATING,
        },
    ],
};

interface AlbumArtistListHeaderFiltersProps {
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const AlbumArtistListHeaderFilters = ({
    gridRef,
    tableRef,
}: AlbumArtistListHeaderFiltersProps) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const server = useCurrentServer();
    const { pageKey } = useListContext();
    const { display, filter, grid, table } = useListStoreByKey<AlbumArtistListQuery>({
        key: pageKey,
    });
    const { setDisplayType, setFilter, setGrid, setTable, setTablePagination } =
        useListStoreActions();
    const cq = useContainerQuery();

    const isGrid = display === ListDisplayType.CARD || display === ListDisplayType.GRID;
    const musicFoldersQuery = useMusicFolders({ query: null, serverId: server?.id });

    const sortByLabel =
        (server?.type &&
            FILTERS[server.type as keyof typeof FILTERS].find((f) => f.value === filter.sortBy)
                ?.name) ||
        t('common.unknown', { postProcess: 'titleCase' });

    const handleItemSize = (e: number) => {
        if (display === ListDisplayType.TABLE || display === ListDisplayType.TABLE_PAGINATED) {
            setTable({ data: { rowHeight: e }, key: pageKey });
        } else {
            setGrid({ data: { itemSize: e }, key: pageKey });
        }
    };

    const handleItemGap = (e: number) => {
        setGrid({ data: { itemGap: e }, key: pageKey });
    };

    const debouncedHandleItemSize = debounce(handleItemSize, 20);

    const fetch = useCallback(
        async (startIndex: number, limit: number, filters: AlbumArtistListFilter) => {
            const queryKey = queryKeys.albumArtists.list(server?.id || '', {
                limit,
                startIndex,
                ...filters,
            });

            const albums = await queryClient.fetchQuery(
                queryKey,
                async ({ signal }) =>
                    api.controller.getAlbumArtistList({
                        apiClientProps: {
                            server,
                            signal,
                        },
                        query: {
                            limit,
                            startIndex,
                            ...filters,
                        },
                    }),
                { cacheTime: 1000 * 60 * 1 },
            );

            return albums;
        },
        [queryClient, server],
    );

    const handleFilterChange = useCallback(
        async (filters: AlbumArtistListFilter) => {
            if (display === ListDisplayType.TABLE || display === ListDisplayType.TABLE_PAGINATED) {
                const dataSource: IDatasource = {
                    getRows: async (params) => {
                        const limit = params.endRow - params.startRow;
                        const startIndex = params.startRow;

                        const queryKey = queryKeys.albumArtists.list(server?.id || '', {
                            limit,
                            startIndex,
                            ...filters,
                        });

                        const albumArtistsRes = await queryClient.fetchQuery(
                            queryKey,
                            async ({ signal }) =>
                                api.controller.getAlbumArtistList({
                                    apiClientProps: {
                                        server,
                                        signal,
                                    },
                                    query: {
                                        limit,
                                        startIndex,
                                        ...filters,
                                    },
                                }),
                            { cacheTime: 1000 * 60 * 1 },
                        );

                        params.successCallback(
                            albumArtistsRes?.items || [],
                            albumArtistsRes?.totalRecordCount || 0,
                        );
                    },
                    rowCount: undefined,
                };
                tableRef.current?.api.setDatasource(dataSource);
                tableRef.current?.api.purgeInfiniteCache();
                tableRef.current?.api.ensureIndexVisible(0, 'top');

                if (display === ListDisplayType.TABLE_PAGINATED) {
                    setTablePagination({ data: { currentPage: 0 }, key: pageKey });
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
        [display, tableRef, server, queryClient, setTablePagination, pageKey, gridRef, fetch],
    );

    const handleSetSortBy = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            if (!e.currentTarget?.value || !server?.type) return;

            const sortOrder = FILTERS[server.type as keyof typeof FILTERS].find(
                (f) => f.value === e.currentTarget.value,
            )?.defaultOrder;

            const updatedFilters = setFilter({
                data: {
                    sortBy: e.currentTarget.value as AlbumArtistListSort,
                    sortOrder: sortOrder || SortOrder.ASC,
                },
                itemType: LibraryItem.ALBUM_ARTIST,
                key: pageKey,
            }) as AlbumArtistListFilter;

            handleFilterChange(updatedFilters);
        },
        [handleFilterChange, pageKey, server?.type, setFilter],
    );

    const handleSetMusicFolder = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            if (!e.currentTarget?.value) return;

            let updatedFilters: AlbumArtistListFilter | null = null;
            if (e.currentTarget.value === String(filter.musicFolderId)) {
                updatedFilters = setFilter({
                    data: { musicFolderId: undefined },
                    itemType: LibraryItem.ALBUM_ARTIST,
                    key: pageKey,
                }) as AlbumArtistListFilter;
            } else {
                updatedFilters = setFilter({
                    data: { musicFolderId: e.currentTarget.value },
                    itemType: LibraryItem.ALBUM_ARTIST,
                    key: pageKey,
                }) as AlbumArtistListFilter;
            }

            handleFilterChange(updatedFilters);
        },
        [filter.musicFolderId, handleFilterChange, setFilter, pageKey],
    );

    const handleToggleSortOrder = useCallback(() => {
        const newSortOrder = filter.sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;
        const updatedFilters = setFilter({
            data: { sortOrder: newSortOrder },
            itemType: LibraryItem.ALBUM_ARTIST,
            key: pageKey,
        }) as AlbumArtistListFilter;
        handleFilterChange(updatedFilters);
    }, [filter.sortOrder, handleFilterChange, pageKey, setFilter]);

    const handleSetViewType = useCallback(
        (displayType: ListDisplayType) => {
            setDisplayType({ data: displayType, key: pageKey });
        },
        [pageKey, setDisplayType],
    );

    const handleTableColumns = (values: string[]) => {
        const existingColumns = table.columns;

        if (values.length === 0) {
            return setTable({
                data: {
                    columns: [],
                },
                key: pageKey,
            });
        }

        // If adding a column
        if (values.length > existingColumns.length) {
            const newColumn = {
                column: values[values.length - 1],
                width: 100,
            } as PersistedTableColumn;

            setTable({ data: { columns: [...existingColumns, newColumn] }, key: pageKey });
        } else {
            // If removing a column
            const removed = existingColumns.filter((column) => !values.includes(column.column));
            const newColumns = existingColumns.filter((column) => !removed.includes(column));

            setTable({ data: { columns: newColumns }, key: pageKey });
        }

        return tableRef.current?.api.sizeColumnsToFit();
    };

    const handleAutoFitColumns = (autoFitColumns: boolean) => {
        setTable({ data: { autoFit: autoFitColumns }, key: pageKey });

        if (autoFitColumns) {
            tableRef.current?.api.sizeColumnsToFit();
        }
    };

    const handleRefresh = useCallback(() => {
        queryClient.invalidateQueries(queryKeys.albumArtists.list(server?.id || ''));
        handleFilterChange(filter);
    }, [filter, handleFilterChange, queryClient, server?.id]);

    const isFolderFilterApplied = useMemo(() => {
        return filter.musicFolderId !== undefined;
    }, [filter.musicFolderId]);

    return (
        <Flex justify="space-between">
            <Group
                gap="sm"
                ref={cq.ref}
                w="100%"
            >
                <DropdownMenu position="bottom-start">
                    <DropdownMenu.Target>
                        <Button variant="subtle">{sortByLabel}</Button>
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        {FILTERS[server?.type as keyof typeof FILTERS].map((f) => (
                            <DropdownMenu.Item
                                isSelected={f.value === filter.sortBy}
                                key={`filter-${f.name}`}
                                onClick={handleSetSortBy}
                                value={f.value}
                            >
                                {f.name}
                            </DropdownMenu.Item>
                        ))}
                    </DropdownMenu.Dropdown>
                </DropdownMenu>
                <Divider orientation="vertical" />
                <OrderToggleButton
                    onToggle={handleToggleSortOrder}
                    sortOrder={filter.sortOrder}
                />
                {server?.type === ServerType.JELLYFIN && (
                    <>
                        <DropdownMenu position="bottom-start">
                            <DropdownMenu.Target>
                                <FolderButton isActive={!!isFolderFilterApplied} />
                            </DropdownMenu.Target>
                            <DropdownMenu.Dropdown>
                                {musicFoldersQuery.data?.items.map((folder) => (
                                    <DropdownMenu.Item
                                        isSelected={filter.musicFolderId === folder.id}
                                        key={`musicFolder-${folder.id}`}
                                        onClick={handleSetMusicFolder}
                                        value={folder.id}
                                    >
                                        {folder.name}
                                    </DropdownMenu.Item>
                                ))}
                            </DropdownMenu.Dropdown>
                        </DropdownMenu>
                    </>
                )}
                <RefreshButton onClick={handleRefresh} />
                <DropdownMenu position="bottom-start">
                    <DropdownMenu.Target>
                        <MoreButton />
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        <DropdownMenu.Item
                            leftSection={<Icon icon="refresh" />}
                            onClick={handleRefresh}
                        >
                            {t('common.refresh', {
                                postProcess: 'titleCase',
                            })}
                        </DropdownMenu.Item>
                    </DropdownMenu.Dropdown>
                </DropdownMenu>
            </Group>
            <Group
                gap="sm"
                wrap="nowrap"
            >
                <ListConfigMenu
                    autoFitColumns={table.autoFit}
                    disabledViewTypes={[ListDisplayType.LIST]}
                    displayType={display}
                    itemGap={grid?.itemGap || 0}
                    itemSize={isGrid ? grid?.itemSize || 0 : table.rowHeight}
                    onChangeAutoFitColumns={handleAutoFitColumns}
                    onChangeDisplayType={handleSetViewType}
                    onChangeItemGap={handleItemGap}
                    onChangeItemSize={debouncedHandleItemSize}
                    onChangeTableColumns={handleTableColumns}
                    tableColumns={table?.columns.map((column) => column.column)}
                    tableColumnsData={ALBUMARTIST_TABLE_COLUMNS}
                />
            </Group>
        </Flex>
    );
};
