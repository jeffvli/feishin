import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useQueryClient } from '@tanstack/react-query';
import { ChangeEvent, MouseEvent, MutableRefObject, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
    RiAlbumLine,
    RiFolder2Fill,
    RiMoreFill,
    RiMusic2Line,
    RiRefreshLine,
    RiSettings3Fill,
} from 'react-icons/ri';

import i18n from '/@/i18n/i18n';
import { queryKeys } from '/@/renderer/api/query-keys';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { GENRE_TABLE_COLUMNS } from '/@/renderer/components/virtual-table';
import { useListContext } from '/@/renderer/context/list-context';
import { OrderToggleButton, useMusicFolders } from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';
import { useListFilterRefresh } from '/@/renderer/hooks/use-list-filter-refresh';
import {
    GenreListFilter,
    GenreTarget,
    PersistedTableColumn,
    useCurrentServer,
    useGeneralSettings,
    useListStoreActions,
    useListStoreByKey,
    useSettingsStoreActions,
} from '/@/renderer/store';
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
    GenreListQuery,
    GenreListSort,
    LibraryItem,
    ServerType,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ListDisplayType } from '/@/shared/types/types';

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
    subsonic: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: GenreListSort.NAME,
        },
    ],
};

interface GenreListHeaderFiltersProps {
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    itemCount: number | undefined;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const GenreListHeaderFilters = ({
    gridRef,
    itemCount,
    tableRef,
}: GenreListHeaderFiltersProps) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { customFilters, pageKey } = useListContext();
    const server = useCurrentServer();
    const { setDisplayType, setFilter, setGrid, setTable } = useListStoreActions();
    const { display, filter, grid, table } = useListStoreByKey<GenreListQuery>({ key: pageKey });
    const cq = useContainerQuery();
    const { genreTarget } = useGeneralSettings();
    const { setGenreBehavior } = useSettingsStoreActions();

    const { handleRefreshGrid, handleRefreshTable } = useListFilterRefresh({
        itemCount,
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

            let updatedFilters: GenreListFilter | null = null;
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
                gap="sm"
                ref={cq.ref}
                w="100%"
            >
                <DropdownMenu position="bottom-start">
                    <DropdownMenu.Target>
                        <Button
                            fw={600}
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
                {server?.type === ServerType.JELLYFIN && (
                    <>
                        <Divider orientation="vertical" />
                        <DropdownMenu position="bottom-start">
                            <DropdownMenu.Target>
                                <Button
                                    fw={600}
                                    size="compact-md"
                                    style={{
                                        svg: {
                                            fill: isFolderFilterApplied
                                                ? 'var(--theme-colors-primary-filled) !important'
                                                : undefined,
                                        },
                                    }}
                                    variant="subtle"
                                >
                                    <RiFolder2Fill />
                                </Button>
                            </DropdownMenu.Target>
                            <DropdownMenu.Dropdown>
                                {musicFoldersQuery.data?.items.map((folder) => (
                                    <DropdownMenu.Item
                                        isActive={filter.musicFolderId === folder.id}
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
                            size="compact-md"
                            variant="subtle"
                        >
                            <RiMoreFill size={15} />
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
                    <Divider orientation="vertical" />
                    <Button
                        onClick={handleGenreToggle}
                        size="compact-md"
                        tooltip={{
                            label: t(
                                genreTarget === GenreTarget.ALBUM
                                    ? 'page.genreList.showAlbums'
                                    : 'page.genreList.showTracks',
                                { postProcess: 'sentenceCase' },
                            ),
                        }}
                        variant="subtle"
                    >
                        {genreTarget === GenreTarget.ALBUM ? <RiAlbumLine /> : <RiMusic2Line />}
                    </Button>
                </DropdownMenu>
            </Group>
            <Group
                gap="sm"
                wrap="nowrap"
            >
                <DropdownMenu
                    position="bottom-end"
                    width={425}
                >
                    <DropdownMenu.Target>
                        <Button
                            size="compact-md"
                            tooltip={{
                                label: t('common.configure', { postProcess: 'titleCase' }),
                            }}
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
                                    style={{ cursor: 'default' }}
                                >
                                    <Stack>
                                        <MultiSelect
                                            clearable
                                            data={GENRE_TABLE_COLUMNS}
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
