import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { IDatasource } from '@ag-grid-community/core';
import { useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, MouseEvent, MutableRefObject, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RiMoreFill, RiRefreshLine, RiSettings3Fill } from 'react-icons/ri';

import i18n from '/@/i18n/i18n';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { PLAYLIST_TABLE_COLUMNS } from '/@/renderer/components/virtual-table';
import { useListContext } from '/@/renderer/context/list-context';
import { OrderToggleButton } from '/@/renderer/features/shared';
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
import { MultiSelect } from '/@/shared/components/multi-select/multi-select';
import { Slider } from '/@/shared/components/slider/slider';
import { Stack } from '/@/shared/components/stack/stack';
import { Switch } from '/@/shared/components/switch/switch';
import { Text } from '/@/shared/components/text/text';
import {
    LibraryItem,
    PlaylistListQuery,
    PlaylistListSort,
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

    const isGrid = display === ListDisplayType.CARD || display === ListDisplayType.POSTER;

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
        (e: MouseEvent<HTMLButtonElement>) => {
            if (!e.currentTarget?.value) return;
            setDisplayType({ data: e.currentTarget.value as ListDisplayType, key: pageKey });
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

    const handleAutoFitColumns = (e: ChangeEvent<HTMLInputElement>) => {
        setTable({ data: { autoFit: e.currentTarget.checked }, key: pageKey });

        if (e.currentTarget.checked) {
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

    const handleItemGap = (e: number) => {
        setGrid({ data: { itemGap: e }, key: pageKey });
    };

    const handleRefresh = () => {
        queryClient.invalidateQueries(queryKeys.playlists.list(server?.id || '', filter));
        handleFilterChange(filter);
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
                        <Button
                            fw="600"
                            size="compact-md"
                            variant="subtle"
                        >
                            {sortByLabel}
                        </Button>
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        {FILTERS[server?.type as keyof typeof FILTERS].map((f) => (
                            <DropdownMenu.Item
                                isActive={f.value === filter.sortBy}
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
                <Divider orientation="vertical" />
                <Button
                    onClick={handleRefresh}
                    size="compact-md"
                    tooltip={{ label: t('common.refresh', { postProcess: 'titleCase' }) }}
                    variant="subtle"
                >
                    <RiRefreshLine />
                </Button>
                <Divider orientation="vertical" />
                <DropdownMenu position="bottom-start">
                    <DropdownMenu.Target>
                        <Button
                            fw="600"
                            size="compact-md"
                            variant="subtle"
                        >
                            <RiMoreFill />
                        </Button>
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        <DropdownMenu.Item
                            leftSection={<RiRefreshLine />}
                            onClick={handleRefresh}
                        >
                            {t('common.refresh', { postProcess: 'titleCase' })}
                        </DropdownMenu.Item>
                    </DropdownMenu.Dropdown>
                </DropdownMenu>
            </Group>
            <Group>
                <DropdownMenu
                    position="bottom-end"
                    width={425}
                >
                    <DropdownMenu.Target>
                        <Button
                            size="compact-md"
                            variant="subtle"
                        >
                            <RiSettings3Fill />
                        </Button>
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        <DropdownMenu.Label>
                            {t('table.config.general.displayType', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Label>
                        <DropdownMenu.Item
                            isActive={display === ListDisplayType.CARD}
                            onClick={handleSetViewType}
                            value={ListDisplayType.CARD}
                        >
                            {t('table.config.view.card', { postProcess: 'titleCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            isActive={display === ListDisplayType.POSTER}
                            onClick={handleSetViewType}
                            value={ListDisplayType.POSTER}
                        >
                            {t('table.config.view.poster', { postProcess: 'titleCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            isActive={display === ListDisplayType.TABLE}
                            onClick={handleSetViewType}
                            value={ListDisplayType.TABLE}
                        >
                            {t('table.config.view.table', { postProcess: 'titleCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Divider />
                        <DropdownMenu.Label>
                            {t('table.config.general.itemSize', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Label>
                        <DropdownMenu.Item closeMenuOnClick={false}>
                            <Slider
                                defaultValue={isGrid ? grid?.itemSize || 0 : table.rowHeight}
                                max={isGrid ? 300 : 100}
                                min={isGrid ? 100 : 25}
                                onChangeEnd={handleItemSize}
                            />
                        </DropdownMenu.Item>
                        {isGrid && (
                            <>
                                <DropdownMenu.Label>
                                    {t('table.config.general.itemGap', {
                                        postProcess: 'sentenceCase',
                                    })}
                                </DropdownMenu.Label>
                                <DropdownMenu.Item closeMenuOnClick={false}>
                                    <Slider
                                        defaultValue={grid?.itemGap || 0}
                                        max={30}
                                        min={0}
                                        onChangeEnd={handleItemGap}
                                    />
                                </DropdownMenu.Item>
                            </>
                        )}
                        {!isGrid && (
                            <>
                                <DropdownMenu.Label>
                                    {t('table.config.generaltableColumns', {
                                        postProcess: 'titleCase',
                                    })}
                                </DropdownMenu.Label>
                                <DropdownMenu.Item
                                    closeMenuOnClick={false}
                                    component="div"
                                    style={{ cursor: 'default' }}
                                >
                                    <Stack>
                                        <MultiSelect
                                            clearable
                                            data={PLAYLIST_TABLE_COLUMNS}
                                            defaultValue={table?.columns.map(
                                                (column) => column.column,
                                            )}
                                            onChange={handleTableColumns}
                                            width={300}
                                        />
                                        <Group justify="space-between">
                                            <Text>
                                                {t('table.config.general.autoFitColumns', {
                                                    postProcess: 'titleCase',
                                                })}
                                            </Text>
                                            <Switch
                                                defaultChecked={table.autoFit}
                                                onChange={handleAutoFitColumns}
                                            />
                                        </Group>
                                    </Stack>
                                </DropdownMenu.Item>
                            </>
                        )}
                    </DropdownMenu.Dropdown>
                </DropdownMenu>
            </Group>
        </Flex>
    );
};
