import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Divider, Flex, Group, Stack } from '@mantine/core';
import { openModal } from '@mantine/modals';
import { useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, MouseEvent, MutableRefObject, useCallback, useMemo } from 'react';
import {
    RiAddBoxFill,
    RiAddCircleFill,
    RiFilterFill,
    RiFolder2Fill,
    RiMoreFill,
    RiPlayFill,
    RiRefreshLine,
    RiSettings3Fill,
} from 'react-icons/ri';
import { queryKeys } from '/@/renderer/api/query-keys';
import { AlbumListSort, LibraryItem, SortOrder } from '/@/renderer/api/types';
import { Button, DropdownMenu, MultiSelect, Slider, Switch, Text } from '/@/renderer/components';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ALBUM_TABLE_COLUMNS } from '/@/renderer/components/virtual-table';
import { useListContext } from '/@/renderer/context/list-context';
import { JellyfinAlbumFilters } from '/@/renderer/features/albums/components/jellyfin-album-filters';
import { NavidromeAlbumFilters } from '/@/renderer/features/albums/components/navidrome-album-filters';
import { OrderToggleButton, useMusicFolders } from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';
import { useListFilterRefresh } from '/@/renderer/hooks/use-list-filter-refresh';
import {
    AlbumListFilter,
    useCurrentServer,
    useListStoreActions,
    useListStoreByKey,
} from '/@/renderer/store';
import { ListDisplayType, Play, ServerType, TableColumn } from '/@/renderer/types';

const FILTERS = {
    jellyfin: [
        { defaultOrder: SortOrder.ASC, name: 'Album Artist', value: AlbumListSort.ALBUM_ARTIST },
        {
            defaultOrder: SortOrder.DESC,
            name: 'Community Rating',
            value: AlbumListSort.COMMUNITY_RATING,
        },
        { defaultOrder: SortOrder.DESC, name: 'Critic Rating', value: AlbumListSort.CRITIC_RATING },
        { defaultOrder: SortOrder.ASC, name: 'Name', value: AlbumListSort.NAME },
        { defaultOrder: SortOrder.ASC, name: 'Random', value: AlbumListSort.RANDOM },
        {
            defaultOrder: SortOrder.DESC,
            name: 'Recently Added',
            value: AlbumListSort.RECENTLY_ADDED,
        },
        { defaultOrder: SortOrder.DESC, name: 'Release Date', value: AlbumListSort.RELEASE_DATE },
    ],
    navidrome: [
        { defaultOrder: SortOrder.ASC, name: 'Album Artist', value: AlbumListSort.ALBUM_ARTIST },
        { defaultOrder: SortOrder.ASC, name: 'Artist', value: AlbumListSort.ARTIST },
        { defaultOrder: SortOrder.DESC, name: 'Duration', value: AlbumListSort.DURATION },
        { defaultOrder: SortOrder.DESC, name: 'Most Played', value: AlbumListSort.PLAY_COUNT },
        { defaultOrder: SortOrder.ASC, name: 'Name', value: AlbumListSort.NAME },
        { defaultOrder: SortOrder.ASC, name: 'Random', value: AlbumListSort.RANDOM },
        { defaultOrder: SortOrder.DESC, name: 'Rating', value: AlbumListSort.RATING },
        {
            defaultOrder: SortOrder.DESC,
            name: 'Recently Added',
            value: AlbumListSort.RECENTLY_ADDED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: 'Recently Played',
            value: AlbumListSort.RECENTLY_PLAYED,
        },
        { defaultOrder: SortOrder.DESC, name: 'Song Count', value: AlbumListSort.SONG_COUNT },
        { defaultOrder: SortOrder.DESC, name: 'Favorited', value: AlbumListSort.FAVORITED },
        { defaultOrder: SortOrder.DESC, name: 'Year', value: AlbumListSort.YEAR },
    ],
};

interface AlbumListHeaderFiltersProps {
    gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const AlbumListHeaderFilters = ({ gridRef, tableRef }: AlbumListHeaderFiltersProps) => {
    const queryClient = useQueryClient();
    const { pageKey, customFilters, handlePlay } = useListContext();
    const server = useCurrentServer();
    const { setFilter, setTable, setGrid, setDisplayType } = useListStoreActions();
    const { display, filter, table, grid } = useListStoreByKey({ key: pageKey });
    const cq = useContainerQuery();

    const { handleRefreshTable, handleRefreshGrid } = useListFilterRefresh({
        itemType: LibraryItem.ALBUM,
        server,
    });

    const musicFoldersQuery = useMusicFolders({ query: null, serverId: server?.id });

    const sortByLabel =
        (server?.type &&
            FILTERS[server.type as keyof typeof FILTERS].find((f) => f.value === filter.sortBy)
                ?.name) ||
        'Unknown';

    const isGrid = display === ListDisplayType.CARD || display === ListDisplayType.POSTER;

    const onFilterChange = useCallback(
        (filter: AlbumListFilter) => {
            if (isGrid) {
                handleRefreshGrid(gridRef, filter);
            }

            handleRefreshTable(tableRef, filter);
        },
        [gridRef, handleRefreshGrid, handleRefreshTable, isGrid, tableRef],
    );

    const handleOpenFiltersModal = () => {
        openModal({
            children: (
                <>
                    {server?.type === ServerType.NAVIDROME ? (
                        <NavidromeAlbumFilters
                            customFilters={customFilters}
                            disableArtistFilter={!!customFilters}
                            pageKey={pageKey}
                            serverId={server?.id}
                            onFilterChange={onFilterChange}
                        />
                    ) : (
                        <JellyfinAlbumFilters
                            customFilters={customFilters}
                            disableArtistFilter={!!customFilters}
                            pageKey={pageKey}
                            serverId={server?.id}
                            onFilterChange={onFilterChange}
                        />
                    )}
                </>
            ),
            title: 'Album Filters',
        });
    };

    const handleRefresh = useCallback(() => {
        queryClient.invalidateQueries(queryKeys.albums.list(server?.id || ''));
        onFilterChange(filter);
    }, [filter, onFilterChange, queryClient, server?.id]);

    const handleSetSortBy = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            if (!e.currentTarget?.value || !server?.type) return;

            const sortOrder = FILTERS[server.type as keyof typeof FILTERS].find(
                (f) => f.value === e.currentTarget.value,
            )?.defaultOrder;

            const updatedFilters = setFilter({
                customFilters,
                data: {
                    sortBy: e.currentTarget.value as AlbumListSort,
                    sortOrder: sortOrder || SortOrder.ASC,
                },
                itemType: LibraryItem.ALBUM,
                key: pageKey,
            }) as AlbumListFilter;

            onFilterChange(updatedFilters);
        },
        [customFilters, onFilterChange, pageKey, server?.type, setFilter],
    );

    const handleSetMusicFolder = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            if (!e.currentTarget?.value) return;

            let updatedFilters = null;
            if (e.currentTarget.value === String(filter.musicFolderId)) {
                updatedFilters = setFilter({
                    customFilters,
                    data: { musicFolderId: undefined },
                    itemType: LibraryItem.ALBUM,
                    key: pageKey,
                }) as AlbumListFilter;
            } else {
                updatedFilters = setFilter({
                    customFilters,
                    data: { musicFolderId: e.currentTarget.value },
                    itemType: LibraryItem.ALBUM,
                    key: pageKey,
                }) as AlbumListFilter;
            }

            onFilterChange(updatedFilters);
        },
        [filter.musicFolderId, onFilterChange, setFilter, customFilters, pageKey],
    );

    const handleToggleSortOrder = useCallback(() => {
        const newSortOrder = filter.sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;
        const updatedFilters = setFilter({
            customFilters,
            data: { sortOrder: newSortOrder },
            itemType: LibraryItem.ALBUM,
            key: pageKey,
        }) as AlbumListFilter;
        onFilterChange(updatedFilters);
    }, [customFilters, filter.sortOrder, onFilterChange, pageKey, setFilter]);

    const handleItemSize = (e: number) => {
        if (isGrid) {
            setGrid({ data: { itemsPerRow: e }, key: pageKey });
        } else {
            setTable({ data: { rowHeight: e }, key: pageKey });
        }
    };

    const handleSetViewType = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            if (!e.currentTarget?.value) return;
            setDisplayType({ data: e.currentTarget.value as ListDisplayType, key: pageKey });
        },
        [pageKey, setDisplayType],
    );

    const handleTableColumns = (values: TableColumn[]) => {
        const existingColumns = table.columns;

        if (values.length === 0) {
            return setTable({
                data: { columns: [] },
                key: pageKey,
            });
        }

        // If adding a column
        if (values.length > existingColumns.length) {
            const newColumn = { column: values[values.length - 1], width: 100 };

            setTable({ data: { columns: [...existingColumns, newColumn] }, key: pageKey });
        } else {
            // If removing a column
            const removed = existingColumns.filter((column) => !values.includes(column.column));
            const newColumns = existingColumns.filter((column) => !removed.includes(column));

            setTable({ data: { columns: newColumns }, key: pageKey });
        }

        return tableRef.current?.api.sizeColumnsToFit();
    };

    const handleAutoFitColumns = (e: ChangeEvent<HTMLInputElement>) => {
        setTable({ data: { autoFit: e.currentTarget.checked }, key: pageKey });

        if (e.currentTarget.checked) {
            tableRef.current?.api.sizeColumnsToFit();
        }
    };

    const isFilterApplied = useMemo(() => {
        const isNavidromeFilterApplied =
            server?.type === ServerType.NAVIDROME &&
            filter?._custom?.navidrome &&
            Object.values(filter?._custom?.navidrome).some((value) => value !== undefined);

        const isJellyfinFilterApplied =
            server?.type === ServerType.JELLYFIN &&
            filter?._custom?.jellyfin &&
            Object.values(filter?._custom?.jellyfin).some((value) => value !== undefined);

        return isNavidromeFilterApplied || isJellyfinFilterApplied;
    }, [filter?._custom?.jellyfin, filter?._custom?.navidrome, server?.type]);

    const isFolderFilterApplied = useMemo(() => {
        return filter.musicFolderId !== undefined;
    }, [filter.musicFolderId]);

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
                            fw={600}
                            size="md"
                            variant="subtle"
                        >
                            {sortByLabel}
                        </Button>
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        {FILTERS[server?.type as keyof typeof FILTERS].map((f) => (
                            <DropdownMenu.Item
                                key={`filter-${f.name}`}
                                $isActive={f.value === filter.sortBy}
                                value={f.value}
                                onClick={handleSetSortBy}
                            >
                                {f.name}
                            </DropdownMenu.Item>
                        ))}
                    </DropdownMenu.Dropdown>
                </DropdownMenu>
                <Divider orientation="vertical" />
                <OrderToggleButton
                    sortOrder={filter.sortOrder}
                    onToggle={handleToggleSortOrder}
                />
                {server?.type === ServerType.JELLYFIN && (
                    <>
                        <Divider orientation="vertical" />
                        <DropdownMenu position="bottom-start">
                            <DropdownMenu.Target>
                                <Button
                                    compact
                                    fw={600}
                                    size="md"
                                    sx={{
                                        svg: {
                                            fill: isFolderFilterApplied
                                                ? 'var(--primary-color) !important'
                                                : undefined,
                                        },
                                    }}
                                    variant="subtle"
                                >
                                    <RiFolder2Fill size="1.3rem" />
                                </Button>
                            </DropdownMenu.Target>
                            <DropdownMenu.Dropdown>
                                {musicFoldersQuery.data?.items.map((folder) => (
                                    <DropdownMenu.Item
                                        key={`musicFolder-${folder.id}`}
                                        $isActive={filter.musicFolderId === folder.id}
                                        value={folder.id}
                                        onClick={handleSetMusicFolder}
                                    >
                                        {folder.name}
                                    </DropdownMenu.Item>
                                ))}
                            </DropdownMenu.Dropdown>
                        </DropdownMenu>
                    </>
                )}
                <Divider orientation="vertical" />
                <Button
                    compact
                    size="md"
                    sx={{
                        svg: {
                            fill: isFilterApplied ? 'var(--primary-color) !important' : undefined,
                        },
                    }}
                    tooltip={{ label: 'Filters' }}
                    variant="subtle"
                    onClick={handleOpenFiltersModal}
                >
                    <RiFilterFill size="1.3rem" />
                </Button>
                <Divider orientation="vertical" />
                <DropdownMenu position="bottom-start">
                    <DropdownMenu.Target>
                        <Button
                            compact
                            size="md"
                            variant="subtle"
                        >
                            <RiMoreFill size={15} />
                        </Button>
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        <DropdownMenu.Item
                            icon={<RiPlayFill />}
                            onClick={() => handlePlay?.({ playType: Play.NOW })}
                        >
                            Play
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            icon={<RiAddBoxFill />}
                            onClick={() => handlePlay?.({ playType: Play.LAST })}
                        >
                            Add to queue
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            icon={<RiAddCircleFill />}
                            onClick={() => handlePlay?.({ playType: Play.NEXT })}
                        >
                            Add to queue next
                        </DropdownMenu.Item>
                        <DropdownMenu.Divider />
                        <DropdownMenu.Item
                            icon={<RiRefreshLine />}
                            onClick={handleRefresh}
                        >
                            Refresh
                        </DropdownMenu.Item>
                    </DropdownMenu.Dropdown>
                </DropdownMenu>
            </Group>
            <Group
                noWrap
                spacing="sm"
            >
                <DropdownMenu
                    position="bottom-end"
                    width={425}
                >
                    <DropdownMenu.Target>
                        <Button
                            compact
                            size="md"
                            tooltip={{ label: 'Configure' }}
                            variant="subtle"
                        >
                            <RiSettings3Fill size="1.3rem" />
                        </Button>
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        <DropdownMenu.Label>Display type</DropdownMenu.Label>
                        <DropdownMenu.Item
                            $isActive={display === ListDisplayType.CARD}
                            value={ListDisplayType.CARD}
                            onClick={handleSetViewType}
                        >
                            Card
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            $isActive={display === ListDisplayType.POSTER}
                            value={ListDisplayType.POSTER}
                            onClick={handleSetViewType}
                        >
                            Poster
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            $isActive={display === ListDisplayType.TABLE}
                            value={ListDisplayType.TABLE}
                            onClick={handleSetViewType}
                        >
                            Table
                        </DropdownMenu.Item>
                        {/* <DropdownMenu.Item
                            $isActive={display === ListDisplayType.TABLE_PAGINATED}
                            value={ListDisplayType.TABLE_PAGINATED}
                            onClick={handleSetViewType}
                        >
                            Table (paginated)
                        </DropdownMenu.Item> */}
                        <DropdownMenu.Divider />
                        <DropdownMenu.Label>
                            {isGrid ? 'Items per row' : 'Item size'}
                        </DropdownMenu.Label>
                        <DropdownMenu.Item closeMenuOnClick={false}>
                            <Slider
                                defaultValue={isGrid ? grid?.itemsPerRow || 0 : table.rowHeight}
                                max={isGrid ? 14 : 100}
                                min={isGrid ? 2 : 25}
                                onChangeEnd={handleItemSize}
                            />
                        </DropdownMenu.Item>
                        {(display === ListDisplayType.TABLE ||
                            display === ListDisplayType.TABLE_PAGINATED) && (
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
                                            data={ALBUM_TABLE_COLUMNS}
                                            defaultValue={table?.columns.map(
                                                (column) => column.column,
                                            )}
                                            width={300}
                                            onChange={handleTableColumns}
                                        />
                                        <Group position="apart">
                                            <Text>Auto Fit Columns</Text>
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
