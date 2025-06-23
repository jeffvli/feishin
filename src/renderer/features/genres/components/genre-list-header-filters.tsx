import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { MouseEvent, MutableRefObject, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import i18n from '/@/i18n/i18n';
import { queryKeys } from '/@/renderer/api/query-keys';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { GENRE_TABLE_COLUMNS } from '/@/renderer/components/virtual-table';
import { useListContext } from '/@/renderer/context/list-context';
import { OrderToggleButton, useMusicFolders } from '/@/renderer/features/shared';
import { FolderButton } from '/@/renderer/features/shared/components/folder-button';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import { MoreButton } from '/@/renderer/features/shared/components/more-button';
import { RefreshButton } from '/@/renderer/features/shared/components/refresh-button';
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
import { Icon } from '/@/shared/components/icon/icon';
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

    const isGrid = display === ListDisplayType.CARD || display === ListDisplayType.GRID;

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

    const debouncedHandleItemSize = debounce(handleItemSize, 20);

    const handleItemGap = (e: number) => {
        setGrid({ data: { itemGap: e }, key: pageKey });
    };

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
                                <FolderButton
                                    isActive={isFolderFilterApplied}
                                    onClick={handleSetMusicFolder}
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
                    <Button
                        onClick={handleGenreToggle}
                        size="compact-md"
                        tooltip={{
                            label: t(
                                genreTarget === GenreTarget.ALBUM
                                    ? 'page.genreList.showTracks'
                                    : 'page.genreList.showAlbums',
                                { postProcess: 'sentenceCase' },
                            ),
                        }}
                        variant="subtle"
                    >
                        {genreTarget === GenreTarget.ALBUM ? (
                            <Icon icon="itemAlbum" />
                        ) : (
                            <Icon icon="itemSong" />
                        )}
                    </Button>
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
                    tableColumnsData={GENRE_TABLE_COLUMNS}
                />
            </Group>
        </Flex>
    );
};
