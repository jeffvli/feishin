import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { IDatasource } from '@ag-grid-community/core';
import { closeAllModals, openModal } from '@mantine/modals';
import { useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { MouseEvent, MutableRefObject, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import i18n from '/@/i18n/i18n';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { PLAYLIST_TABLE_COLUMNS } from '/@/renderer/components/virtual-table';
import { useListContext } from '/@/renderer/context/list-context';
import { CreatePlaylistForm } from '/@/renderer/features/playlists/components/create-playlist-form';
import { OrderToggleButton } from '/@/renderer/features/shared';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import { MoreButton } from '/@/renderer/features/shared/components/more-button';
import { RefreshButton } from '/@/renderer/features/shared/components/refresh-button';
import { useContainerQuery } from '/@/renderer/hooks';
import {
    PersistedTableColumn,
    PlaylistListFilter,
    useCurrentServer,
    useListStoreActions,
} from '/@/renderer/store';
import { useListStoreByKey } from '/@/renderer/store/list.store';
import { Button } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import {
    LibraryItem,
    PlaylistListQuery,
    PlaylistListSort,
    ServerType,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ListDisplayType } from '/@/shared/types/types';

const FILTERS = {
    jellyfin: [
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.duration', { postProcess: 'titleCase' }),
            value: PlaylistListSort.DURATION,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: PlaylistListSort.NAME,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.songCount', { postProcess: 'titleCase' }),
            value: PlaylistListSort.SONG_COUNT,
        },
    ],
    navidrome: [
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.duration', { postProcess: 'titleCase' }),
            value: PlaylistListSort.DURATION,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: PlaylistListSort.NAME,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.owner', { postProcess: 'titleCase' }),
            value: PlaylistListSort.OWNER,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.isPublic', { postProcess: 'titleCase' }),
            value: PlaylistListSort.PUBLIC,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.songCount', { postProcess: 'titleCase' }),
            value: PlaylistListSort.SONG_COUNT,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyUpdated', { postProcess: 'titleCase' }),
            value: PlaylistListSort.UPDATED_AT,
        },
    ],
    subsonic: [
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.duration', { postProcess: 'titleCase' }),
            value: PlaylistListSort.DURATION,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: PlaylistListSort.NAME,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.owner', { postProcess: 'titleCase' }),
            value: PlaylistListSort.OWNER,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.isPublic', { postProcess: 'titleCase' }),
            value: PlaylistListSort.PUBLIC,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.songCount', { postProcess: 'titleCase' }),
            value: PlaylistListSort.SONG_COUNT,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyUpdated', { postProcess: 'titleCase' }),
            value: PlaylistListSort.UPDATED_AT,
        },
    ],
};

interface PlaylistListHeaderFiltersProps {
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const PlaylistListHeaderFilters = ({
    gridRef,
    tableRef,
}: PlaylistListHeaderFiltersProps) => {
    const { t } = useTranslation();
    const { pageKey } = useListContext();
    const queryClient = useQueryClient();
    const server = useCurrentServer();
    const { setDisplayType, setFilter, setGrid, setTable, setTablePagination } =
        useListStoreActions();
    const { display, filter, grid, table } = useListStoreByKey<PlaylistListQuery>({ key: pageKey });
    const cq = useContainerQuery();

    const isGrid = display === ListDisplayType.CARD || display === ListDisplayType.GRID;

    const sortByLabel =
        (server?.type &&
            (
                FILTERS[server.type as keyof typeof FILTERS] as { name: string; value: string }[]
            ).find((f) => f.value === filter.sortBy)?.name) ||
        'Unknown';

    const fetch = useCallback(
        async (skip: number, take: number, filters: PlaylistListFilter) => {
            const query: PlaylistListQuery = {
                _custom: {
                    jellyfin: {
                        ...filters._custom?.jellyfin,
                    },
                    navidrome: {
                        ...filters._custom?.navidrome,
                    },
                },
                limit: take,
                startIndex: skip,
                ...filters,
            };

            const queryKey = queryKeys.playlists.list(server?.id || '', query);

            const playlists = await queryClient.fetchQuery(queryKey, async ({ signal }) =>
                api.controller.getPlaylistList({
                    apiClientProps: {
                        server,
                        signal,
                    },
                    query,
                }),
            );

            return playlists;
        },
        [queryClient, server],
    );

    const handleFilterChange = useCallback(
        async (filters?: PlaylistListFilter) => {
            if (isGrid) {
                gridRef.current?.scrollTo(0);
                gridRef.current?.resetLoadMoreItemsCache();
                const data = await fetch(0, 200, filters || filter);
                if (!data?.items) return;
                gridRef.current?.setItemData(data.items);
            } else {
                const dataSource: IDatasource = {
                    getRows: async (params) => {
                        const limit = params.endRow - params.startRow;
                        const startIndex = params.startRow;

                        const pageFilters = filters || filter;

                        const queryKey = queryKeys.playlists.list(server?.id || '', {
                            limit,
                            startIndex,
                            ...pageFilters,
                        });

                        const playlistsRes = await queryClient.fetchQuery(
                            queryKey,
                            async ({ signal }) =>
                                api.controller.getPlaylistList({
                                    apiClientProps: {
                                        server,
                                        signal,
                                    },
                                    query: {
                                        limit,
                                        startIndex,
                                        ...pageFilters,
                                    },
                                }),
                        );

                        params.successCallback(
                            playlistsRes?.items || [],
                            playlistsRes?.totalRecordCount || 0,
                        );
                    },
                    rowCount: undefined,
                };
                tableRef.current?.api.setDatasource(dataSource);
                tableRef.current?.api.purgeInfiniteCache();
                tableRef.current?.api.ensureIndexVisible(0, 'top');
                setTablePagination({ data: { currentPage: 0 }, key: pageKey });
            }
        },
        [
            isGrid,
            gridRef,
            fetch,
            filter,
            tableRef,
            setTablePagination,
            pageKey,
            server,
            queryClient,
        ],
    );

    const handleSetSortBy = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            if (!e.currentTarget?.value || !server?.type) return;

            const sortOrder = FILTERS[server.type as keyof typeof FILTERS].find(
                (f) => f.value === e.currentTarget.value,
            )?.defaultOrder;

            const updatedFilters = setFilter({
                data: {
                    sortBy: e.currentTarget.value as PlaylistListSort,
                    sortOrder: sortOrder || SortOrder.ASC,
                },
                itemType: LibraryItem.PLAYLIST,
                key: pageKey,
            }) as PlaylistListFilter;

            handleFilterChange(updatedFilters);
        },
        [handleFilterChange, pageKey, server?.type, setFilter],
    );

    const handleToggleSortOrder = useCallback(() => {
        const newSortOrder = filter.sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;
        const updatedFilters = setFilter({
            data: { sortOrder: newSortOrder },
            itemType: LibraryItem.PLAYLIST,
            key: pageKey,
        }) as PlaylistListFilter;
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
                data: { columns: [] },
                key: pageKey,
            });
        }

        // If adding a column
        if (values.length > existingColumns.length) {
            const newColumn = {
                column: values[values.length - 1],
                width: 100,
            } as PersistedTableColumn;

            return setTable({ data: { columns: [...existingColumns, newColumn] }, key: pageKey });
        }

        // If removing a column
        const removed = existingColumns.filter((column) => !values.includes(column.column));
        const newColumns = existingColumns.filter((column) => !removed.includes(column));

        return setTable({ data: { columns: newColumns }, key: pageKey });
    };

    const handleAutoFitColumns = (autoFitColumns: boolean) => {
        setTable({ data: { autoFit: autoFitColumns }, key: pageKey });

        if (autoFitColumns) {
            tableRef.current?.api.sizeColumnsToFit();
        }
    };

    const handleItemSize = (e: number) => {
        if (isGrid) {
            setGrid({ data: { itemSize: e }, key: pageKey });
        } else {
            setTable({ data: { rowHeight: e }, key: pageKey });
        }
    };

    const debouncedHandleItemSize = debounce(handleItemSize, 20);

    const handleItemGap = (e: number) => {
        setGrid({ data: { itemGap: e }, key: pageKey });
    };

    const handleRefresh = () => {
        queryClient.invalidateQueries(queryKeys.playlists.list(server?.id || '', filter));
        handleFilterChange(filter);
    };

    const handleCreatePlaylistModal = () => {
        openModal({
            children: <CreatePlaylistForm onCancel={() => closeAllModals()} />,
            onClose: () => {
                tableRef?.current?.api?.purgeInfiniteCache();
            },
            size: server?.type === ServerType?.NAVIDROME ? 'lg' : 'sm',
            title: t('form.createPlaylist.title', { postProcess: 'sentenceCase' }),
        });
    };

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
                            {t('common.refresh', { postProcess: 'titleCase' })}
                        </DropdownMenu.Item>
                    </DropdownMenu.Dropdown>
                </DropdownMenu>
            </Group>
            <Group
                gap="xs"
                wrap="nowrap"
            >
                <Button
                    onClick={handleCreatePlaylistModal}
                    variant="subtle"
                >
                    {t('action.createPlaylist', { postProcess: 'sentenceCase' })}
                </Button>
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
                    tableColumnsData={PLAYLIST_TABLE_COLUMNS}
                />
            </Group>
        </Flex>
    );
};
