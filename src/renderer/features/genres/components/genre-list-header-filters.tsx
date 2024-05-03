import { ChangeEvent, MouseEvent, MutableRefObject, useCallback, useMemo } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Divider, Flex, Group, Stack } from '@mantine/core';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
    RiAlbumLine,
    RiFolder2Fill,
    RiMoreFill,
    RiMusic2Line,
    RiRefreshLine,
    RiSettings3Fill,
} from 'react-icons/ri';
import { queryKeys } from '/@/renderer/api/query-keys';
import { GenreListSort, LibraryItem, ServerType, SortOrder } from '/@/renderer/api/types';
import { Button, DropdownMenu, MultiSelect, Slider, Switch, Text } from '/@/renderer/components';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { GENRE_TABLE_COLUMNS } from '/@/renderer/components/virtual-table';
import { useListContext } from '/@/renderer/context/list-context';
import { OrderToggleButton, useMusicFolders } from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';
import { useListFilterRefresh } from '/@/renderer/hooks/use-list-filter-refresh';
import {
    GenreListFilter,
    GenreTarget,
    useCurrentServer,
    useGeneralSettings,
    useListStoreActions,
    useListStoreByKey,
    useSettingsStoreActions,
} from '/@/renderer/store';
import { ListDisplayType, TableColumn } from '/@/renderer/types';
import i18n from '/@/i18n/i18n';

const FILTERS = {
    jellyfin: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: GenreListSort.NAME,
        },
    ],
    navidrome: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: GenreListSort.NAME,
        },
    ],
};

interface GenreListHeaderFiltersProps {
    gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const GenreListHeaderFilters = ({ gridRef, tableRef }: GenreListHeaderFiltersProps) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { pageKey, customFilters } = useListContext();
    const server = useCurrentServer();
    const { setFilter, setTable, setGrid, setDisplayType } = useListStoreActions();
    const { display, filter, table, grid } = useListStoreByKey({ key: pageKey });
    const cq = useContainerQuery();
    const { genreTarget } = useGeneralSettings();
    const { setGenreBehavior } = useSettingsStoreActions();

    const { handleRefreshTable, handleRefreshGrid } = useListFilterRefresh({
        itemType: LibraryItem.GENRE,
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
        (filter: GenreListFilter) => {
            if (isGrid) {
                handleRefreshGrid(gridRef, {
                    ...filter,
                    ...customFilters,
                });
            } else {
                handleRefreshTable(tableRef, {
                    ...filter,
                    ...customFilters,
                });
            }
        },
        [customFilters, gridRef, handleRefreshGrid, handleRefreshTable, isGrid, tableRef],
    );

    const handleRefresh = useCallback(() => {
        queryClient.invalidateQueries(queryKeys.genres.list(server?.id || ''));
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
                    sortBy: e.currentTarget.value as GenreListSort,
                    sortOrder: sortOrder || SortOrder.ASC,
                },
                itemType: LibraryItem.GENRE,
                key: pageKey,
            }) as GenreListFilter;

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
                    itemType: LibraryItem.GENRE,
                    key: pageKey,
                }) as GenreListFilter;
            } else {
                updatedFilters = setFilter({
                    customFilters,
                    data: { musicFolderId: e.currentTarget.value },
                    itemType: LibraryItem.GENRE,
                    key: pageKey,
                }) as GenreListFilter;
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
            itemType: LibraryItem.GENRE,
            key: pageKey,
        }) as GenreListFilter;
        onFilterChange(updatedFilters);
    }, [customFilters, filter.sortOrder, onFilterChange, pageKey, setFilter]);

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

    const isFolderFilterApplied = useMemo(() => {
        return filter.musicFolderId !== undefined;
    }, [filter.musicFolderId]);

    const handleGenreToggle = useCallback(() => {
        const newState = genreTarget === GenreTarget.ALBUM ? GenreTarget.TRACK : GenreTarget.ALBUM;
        setGenreBehavior(newState);
    }, [genreTarget, setGenreBehavior]);

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
                    tooltip={{ label: t('common.refresh', { postProcess: 'titleCase' }) }}
                    variant="subtle"
                    onClick={handleRefresh}
                >
                    <RiRefreshLine size="1.3rem" />
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
                            icon={<RiRefreshLine />}
                            onClick={handleRefresh}
                        >
                            {t('common.refresh', { postProcess: 'titleCase' })}
                        </DropdownMenu.Item>
                    </DropdownMenu.Dropdown>
                    <Divider orientation="vertical" />
                    <Button
                        compact
                        size="md"
                        tooltip={{
                            label: t(
                                genreTarget === GenreTarget.ALBUM
                                    ? 'page.genreList.showAlbums'
                                    : 'page.genreList.showTracks',
                                { postProcess: 'sentenceCase' },
                            ),
                        }}
                        variant="subtle"
                        onClick={handleGenreToggle}
                    >
                        {genreTarget === GenreTarget.ALBUM ? <RiAlbumLine /> : <RiMusic2Line />}
                    </Button>
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
                            tooltip={{
                                label: t('common.configure', { postProcess: 'titleCase' }),
                            }}
                            variant="subtle"
                        >
                            <RiSettings3Fill size="1.3rem" />
                        </Button>
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        <DropdownMenu.Label>
                            {t('table.config.general.displayType', { postProcess: 'titleCase' })}
                        </DropdownMenu.Label>
                        <DropdownMenu.Item
                            $isActive={display === ListDisplayType.CARD}
                            value={ListDisplayType.CARD}
                            onClick={handleSetViewType}
                        >
                            {t('table.config.view.card', { postProcess: 'titleCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            $isActive={display === ListDisplayType.POSTER}
                            value={ListDisplayType.POSTER}
                            onClick={handleSetViewType}
                        >
                            {t('table.config.view.poster', { postProcess: 'titleCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            $isActive={display === ListDisplayType.TABLE}
                            value={ListDisplayType.TABLE}
                            onClick={handleSetViewType}
                        >
                            {t('table.config.view.table', { postProcess: 'titleCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Divider />
                        <DropdownMenu.Label>
                            {t('table.config.general.size', { postProcess: 'titleCase' })}
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
                                <DropdownMenu.Label>Item gap</DropdownMenu.Label>
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
                        {(display === ListDisplayType.TABLE ||
                            display === ListDisplayType.TABLE_PAGINATED) && (
                            <>
                                <DropdownMenu.Label>
                                    {t('table.config.general.tableColumns', {
                                        postProcess: 'titleCase',
                                    })}
                                </DropdownMenu.Label>
                                <DropdownMenu.Item
                                    closeMenuOnClick={false}
                                    component="div"
                                    sx={{ cursor: 'default' }}
                                >
                                    <Stack>
                                        <MultiSelect
                                            clearable
                                            data={GENRE_TABLE_COLUMNS}
                                            defaultValue={table?.columns.map(
                                                (column) => column.column,
                                            )}
                                            width={300}
                                            onChange={handleTableColumns}
                                        />
                                        <Group position="apart">
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
