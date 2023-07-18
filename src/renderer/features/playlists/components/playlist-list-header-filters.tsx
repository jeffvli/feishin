import { ChangeEvent, MutableRefObject, useCallback, MouseEvent } from 'react';
import { IDatasource } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Flex, Stack, Group, Divider } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import { RiMoreFill, RiRefreshLine, RiSettings3Fill } from 'react-icons/ri';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { SortOrder, PlaylistListSort, PlaylistListQuery } from '/@/renderer/api/types';
import { DropdownMenu, Text, Button, Slider, MultiSelect, Switch } from '/@/renderer/components';
import { useContainerQuery } from '/@/renderer/hooks';
import {
    PlaylistListFilter,
    useCurrentServer,
    usePlaylistGridStore,
    usePlaylistListStore,
    usePlaylistStoreActions,
    useSetPlaylistFilters,
    useSetPlaylistStore,
    useSetPlaylistTable,
    useSetPlaylistTablePagination,
} from '/@/renderer/store';
import { ListDisplayType, TableColumn } from '/@/renderer/types';
import { PLAYLIST_TABLE_COLUMNS } from '/@/renderer/components/virtual-table';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { OrderToggleButton } from '/@/renderer/features/shared';

const FILTERS = {
    jellyfin: [
        { defaultOrder: SortOrder.DESC, name: 'Duration', value: PlaylistListSort.DURATION },
        { defaultOrder: SortOrder.ASC, name: 'Name', value: PlaylistListSort.NAME },
        { defaultOrder: SortOrder.DESC, name: 'Song Count', value: PlaylistListSort.SONG_COUNT },
    ],
    navidrome: [
        { defaultOrder: SortOrder.DESC, name: 'Duration', value: PlaylistListSort.DURATION },
        { defaultOrder: SortOrder.ASC, name: 'Name', value: PlaylistListSort.NAME },
        { defaultOrder: SortOrder.ASC, name: 'Owner', value: PlaylistListSort.OWNER },
        { defaultOrder: SortOrder.DESC, name: 'Public', value: PlaylistListSort.PUBLIC },
        { defaultOrder: SortOrder.DESC, name: 'Song Count', value: PlaylistListSort.SONG_COUNT },
        { defaultOrder: SortOrder.DESC, name: 'Updated At', value: PlaylistListSort.UPDATED_AT },
    ],
};

interface PlaylistListHeaderFiltersProps {
    gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const PlaylistListHeaderFilters = ({
    gridRef,
    tableRef,
}: PlaylistListHeaderFiltersProps) => {
    const queryClient = useQueryClient();
    const server = useCurrentServer();
    const page = usePlaylistListStore();
    const setPage = useSetPlaylistStore();
    const setFilter = useSetPlaylistFilters();
    const setTable = useSetPlaylistTable();
    const setPagination = useSetPlaylistTablePagination();
    const grid = usePlaylistGridStore();
    const { setGrid } = usePlaylistStoreActions();
    const { display } = usePlaylistListStore();
    const cq = useContainerQuery();

    const isGrid = display === ListDisplayType.CARD || display === ListDisplayType.POSTER;

    const sortByLabel =
        (server?.type &&
            (
                FILTERS[server.type as keyof typeof FILTERS] as { name: string; value: string }[]
            ).find((f) => f.value === page.filter.sortBy)?.name) ||
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
                const data = await fetch(0, 200, filters || page.filter);
                if (!data?.items) return;
                gridRef.current?.setItemData(data.items);
            } else {
                const dataSource: IDatasource = {
                    getRows: async (params) => {
                        const limit = params.endRow - params.startRow;
                        const startIndex = params.startRow;

                        const pageFilters = filters || page.filter;

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
                setPagination({ data: { currentPage: 0 } });
            }
        },
        [fetch, gridRef, isGrid, page.filter, queryClient, server, setPagination, tableRef],
    );

    const handleSetSortBy = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            if (!e.currentTarget?.value || !server?.type) return;

            const sortOrder = FILTERS[server.type as keyof typeof FILTERS].find(
                (f) => f.value === e.currentTarget.value,
            )?.defaultOrder;

            const updatedFilters = setFilter({
                sortBy: e.currentTarget.value as PlaylistListSort,
                sortOrder: sortOrder || SortOrder.ASC,
            });

            handleFilterChange(updatedFilters);
        },
        [handleFilterChange, server?.type, setFilter],
    );

    const handleToggleSortOrder = useCallback(() => {
        const newSortOrder =
            page.filter.sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;
        const updatedFilters = setFilter({ sortOrder: newSortOrder });
        handleFilterChange(updatedFilters);
    }, [page.filter.sortOrder, handleFilterChange, setFilter]);

    const handleSetViewType = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            if (!e.currentTarget?.value) return;
            const display = e.currentTarget.value as ListDisplayType;
            setPage({ list: { ...page, display: e.currentTarget.value as ListDisplayType } });

            if (display === ListDisplayType.TABLE) {
                tableRef.current?.api.paginationSetPageSize(
                    tableRef.current.props.infiniteInitialRowCount,
                );
                setPagination({ data: { currentPage: 0 } });
            } else if (display === ListDisplayType.TABLE_PAGINATED) {
                setPagination({ data: { currentPage: 0 } });
            }
        },
        [page, setPage, setPagination, tableRef],
    );

    const handleTableColumns = (values: TableColumn[]) => {
        const existingColumns = page.table.columns;

        if (values.length === 0) {
            return setTable({
                columns: [],
            });
        }

        // If adding a column
        if (values.length > existingColumns.length) {
            const newColumn = { column: values[values.length - 1], width: 100 };

            return setTable({ columns: [...existingColumns, newColumn] });
        }

        // If removing a column
        const removed = existingColumns.filter((column) => !values.includes(column.column));
        const newColumns = existingColumns.filter((column) => !removed.includes(column));

        return setTable({ columns: newColumns });
    };

    const handleAutoFitColumns = (e: ChangeEvent<HTMLInputElement>) => {
        setTable({ autoFit: e.currentTarget.checked });

        if (e.currentTarget.checked) {
            tableRef.current?.api.sizeColumnsToFit();
        }
    };

    const handleItemSize = (e: number) => {
        if (isGrid) {
            setGrid({ data: { itemsPerRow: e } });
        } else {
            setTable({ rowHeight: e });
        }
    };

    const handleRefresh = () => {
        queryClient.invalidateQueries(queryKeys.playlists.list(server?.id || '', page.filter));
        handleFilterChange(page.filter);
    };

    return (
        <Flex justify="space-between">
            <Group
                ref={cq.ref}
                spacing="sm"
                w="100%"
            >
                <DropdownMenu position="bottom-start">
                    <DropdownMenu.Target>
                        <Button
                            compact
                            fw="600"
                            size="md"
                            variant="subtle"
                        >
                            {sortByLabel}
                        </Button>
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        {FILTERS[server?.type as keyof typeof FILTERS].map((filter) => (
                            <DropdownMenu.Item
                                key={`filter-${filter.name}`}
                                $isActive={filter.value === page.filter.sortBy}
                                value={filter.value}
                                onClick={handleSetSortBy}
                            >
                                {filter.name}
                            </DropdownMenu.Item>
                        ))}
                    </DropdownMenu.Dropdown>
                </DropdownMenu>
                <Divider orientation="vertical" />
                <OrderToggleButton
                    sortOrder={page.filter.sortOrder}
                    onToggle={handleToggleSortOrder}
                />
                <Divider orientation="vertical" />
                <DropdownMenu position="bottom-start">
                    <DropdownMenu.Target>
                        <Button
                            compact
                            fw="600"
                            size="md"
                            variant="subtle"
                        >
                            <RiMoreFill size="1.3rem" />
                        </Button>
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        <DropdownMenu.Item
                            icon={<RiRefreshLine />}
                            onClick={handleRefresh}
                        >
                            Refresh
                        </DropdownMenu.Item>
                    </DropdownMenu.Dropdown>
                </DropdownMenu>
            </Group>
            <Group>
                <DropdownMenu position="bottom-end">
                    <DropdownMenu.Target>
                        <Button
                            compact
                            size="md"
                            variant="subtle"
                        >
                            <RiSettings3Fill size="1.3rem" />
                        </Button>
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        <DropdownMenu.Label>Display type</DropdownMenu.Label>
                        <DropdownMenu.Item
                            $isActive={page.display === ListDisplayType.CARD}
                            value={ListDisplayType.CARD}
                            onClick={handleSetViewType}
                        >
                            Card
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            $isActive={page.display === ListDisplayType.POSTER}
                            value={ListDisplayType.POSTER}
                            onClick={handleSetViewType}
                        >
                            Poster
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            $isActive={page.display === ListDisplayType.TABLE}
                            value={ListDisplayType.TABLE}
                            onClick={handleSetViewType}
                        >
                            Table
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            $isActive={page.display === ListDisplayType.TABLE_PAGINATED}
                            value={ListDisplayType.TABLE_PAGINATED}
                            onClick={handleSetViewType}
                        >
                            Table (paginated)
                        </DropdownMenu.Item>
                        <DropdownMenu.Divider />
                        <DropdownMenu.Label>
                            {isGrid ? 'Items per row' : 'Item size'}
                        </DropdownMenu.Label>
                        <DropdownMenu.Item closeMenuOnClick={false}>
                            <Slider
                                defaultValue={
                                    isGrid ? grid?.itemsPerRow || 0 : page.table.rowHeight
                                }
                                max={isGrid ? 14 : 100}
                                min={isGrid ? 2 : 25}
                                onChangeEnd={handleItemSize}
                            />
                        </DropdownMenu.Item>
                        {!isGrid && (
                            <>
                                <DropdownMenu.Label>Table Columns</DropdownMenu.Label>
                                <DropdownMenu.Item
                                    closeMenuOnClick={false}
                                    component="div"
                                    sx={{ cursor: 'default' }}
                                >
                                    <Stack>
                                        <MultiSelect
                                            clearable
                                            data={PLAYLIST_TABLE_COLUMNS}
                                            defaultValue={page.table?.columns.map(
                                                (column) => column.column,
                                            )}
                                            width={300}
                                            onChange={handleTableColumns}
                                        />
                                        <Group position="apart">
                                            <Text>Auto Fit Columns</Text>
                                            <Switch
                                                defaultChecked={page.table.autoFit}
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
