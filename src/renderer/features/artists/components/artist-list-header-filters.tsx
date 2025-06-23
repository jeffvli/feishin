import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { IDatasource } from '@ag-grid-community/core';
import { useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { MouseEvent, MutableRefObject, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import i18n from '/@/i18n/i18n';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ALBUMARTIST_TABLE_COLUMNS } from '/@/renderer/components/virtual-table';
import { useListContext } from '/@/renderer/context/list-context';
import { useRoles } from '/@/renderer/features/artists/queries/roles-query';
import { OrderToggleButton, useMusicFolders } from '/@/renderer/features/shared';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import { MoreButton } from '/@/renderer/features/shared/components/more-button';
import { RefreshButton } from '/@/renderer/features/shared/components/refresh-button';
import { useContainerQuery } from '/@/renderer/hooks';
import {
    ArtistListFilter,
    PersistedTableColumn,
    useCurrentServer,
    useListStoreActions,
    useListStoreByKey,
} from '/@/renderer/store';
import { ActionIcon } from '/@/shared/components/action-icon/action-icon';
import { Button } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { Select } from '/@/shared/components/select/select';
import {
    ArtistListQuery,
    ArtistListSort,
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
            value: ArtistListSort.ALBUM,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.duration', { postProcess: 'titleCase' }),
            value: ArtistListSort.DURATION,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: ArtistListSort.NAME,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.random', { postProcess: 'titleCase' }),
            value: ArtistListSort.RANDOM,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyAdded', { postProcess: 'titleCase' }),
            value: ArtistListSort.RECENTLY_ADDED,
        },
    ],
    navidrome: [
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.albumCount', { postProcess: 'titleCase' }),
            value: ArtistListSort.ALBUM_COUNT,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.isFavorited', { postProcess: 'titleCase' }),
            value: ArtistListSort.FAVORITED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.mostPlayed', { postProcess: 'titleCase' }),
            value: ArtistListSort.PLAY_COUNT,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: ArtistListSort.NAME,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.rating', { postProcess: 'titleCase' }),
            value: ArtistListSort.RATING,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.songCount', { postProcess: 'titleCase' }),
            value: ArtistListSort.SONG_COUNT,
        },
    ],
    subsonic: [
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.albumCount', { postProcess: 'titleCase' }),
            value: ArtistListSort.ALBUM_COUNT,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.isFavorited', { postProcess: 'titleCase' }),
            value: ArtistListSort.FAVORITED,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: ArtistListSort.NAME,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.rating', { postProcess: 'titleCase' }),
            value: ArtistListSort.RATING,
        },
    ],
};

interface ArtistListHeaderFiltersProps {
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const ArtistListHeaderFilters = ({ gridRef, tableRef }: ArtistListHeaderFiltersProps) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const server = useCurrentServer();
    const { pageKey } = useListContext();
    const { display, filter, grid, table } = useListStoreByKey<ArtistListQuery>({
        key: pageKey,
    });
    const { setDisplayType, setFilter, setGrid, setTable, setTablePagination } =
        useListStoreActions();
    const cq = useContainerQuery();
    const roles = useRoles({
        options: {
            cacheTime: 1000 * 60 * 60 * 2,
            staleTime: 1000 * 60 * 60 * 2,
        },
        query: {},
        serverId: server?.id,
    });

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
        async (startIndex: number, limit: number, filters: ArtistListFilter) => {
            const queryKey = queryKeys.artists.list(server?.id || '', {
                limit,
                startIndex,
                ...filters,
            });

            const albums = await queryClient.fetchQuery(
                queryKey,
                async ({ signal }) =>
                    api.controller.getArtistList({
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
        async (filters: ArtistListFilter) => {
            if (display === ListDisplayType.TABLE || display === ListDisplayType.TABLE_PAGINATED) {
                const dataSource: IDatasource = {
                    getRows: async (params) => {
                        const limit = params.endRow - params.startRow;
                        const startIndex = params.startRow;

                        const queryKey = queryKeys.artists.list(server?.id || '', {
                            limit,
                            startIndex,
                            ...filters,
                        });

                        const artistsRes = await queryClient.fetchQuery(
                            queryKey,
                            async ({ signal }) =>
                                api.controller.getArtistList({
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
                            artistsRes?.items || [],
                            artistsRes?.totalRecordCount || 0,
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
                    sortBy: e.currentTarget.value as ArtistListSort,
                    sortOrder: sortOrder || SortOrder.ASC,
                },
                itemType: LibraryItem.ARTIST,
                key: pageKey,
            }) as ArtistListFilter;

            handleFilterChange(updatedFilters);
        },
        [handleFilterChange, pageKey, server?.type, setFilter],
    );

    const handleSetMusicFolder = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            if (!e.currentTarget?.value) return;

            let updatedFilters: ArtistListFilter | null = null;
            if (e.currentTarget.value === String(filter.musicFolderId)) {
                updatedFilters = setFilter({
                    data: { musicFolderId: undefined },
                    itemType: LibraryItem.ARTIST,
                    key: pageKey,
                }) as ArtistListFilter;
            } else {
                updatedFilters = setFilter({
                    data: { musicFolderId: e.currentTarget.value },
                    itemType: LibraryItem.ARTIST,
                    key: pageKey,
                }) as ArtistListFilter;
            }

            handleFilterChange(updatedFilters);
        },
        [filter.musicFolderId, handleFilterChange, setFilter, pageKey],
    );

    const handleToggleSortOrder = useCallback(() => {
        const newSortOrder = filter.sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;
        const updatedFilters = setFilter({
            data: { sortOrder: newSortOrder },
            itemType: LibraryItem.ARTIST,
            key: pageKey,
        }) as ArtistListFilter;
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
        queryClient.invalidateQueries(queryKeys.artists.list(server?.id || ''));
        handleFilterChange(filter);
    }, [filter, handleFilterChange, queryClient, server?.id]);

    const handleSetRole = useCallback(
        (e: null | string) => {
            const updatedFilters = setFilter({
                data: {
                    role: e || '',
                },
                itemType: LibraryItem.ARTIST,
                key: pageKey,
            }) as ArtistListFilter;
            handleFilterChange(updatedFilters);
        },
        [handleFilterChange, pageKey, setFilter],
    );

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
                        <Divider orientation="vertical" />
                        <DropdownMenu position="bottom-start">
                            <DropdownMenu.Target>
                                <ActionIcon
                                    icon="folder"
                                    variant="subtle"
                                />
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
                {roles.data?.length && (
                    <>
                        <Select
                            data={roles.data}
                            onChange={handleSetRole}
                            value={filter.role}
                        />
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
                gap="xs"
                wrap="nowrap"
            >
                <ListConfigMenu
                    autoFitColumns={table.autoFit}
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
