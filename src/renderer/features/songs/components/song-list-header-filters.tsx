import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { openModal } from '@mantine/modals';
import debounce from 'lodash/debounce';
import { MouseEvent, MutableRefObject, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import i18n from '/@/i18n/i18n';
import { queryKeys } from '/@/renderer/api/query-keys';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { SONG_TABLE_COLUMNS } from '/@/renderer/components/virtual-table';
import { useListContext } from '/@/renderer/context/list-context';
import { OrderToggleButton, useMusicFolders } from '/@/renderer/features/shared';
import { FilterButton } from '/@/renderer/features/shared/components/filter-button';
import { FolderButton } from '/@/renderer/features/shared/components/folder-button';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import { MoreButton } from '/@/renderer/features/shared/components/more-button';
import { RefreshButton } from '/@/renderer/features/shared/components/refresh-button';
import { JellyfinSongFilters } from '/@/renderer/features/songs/components/jellyfin-song-filters';
import { NavidromeSongFilters } from '/@/renderer/features/songs/components/navidrome-song-filters';
import { SubsonicSongFilters } from '/@/renderer/features/songs/components/subsonic-song-filter';
import { useContainerQuery } from '/@/renderer/hooks';
import { useListFilterRefresh } from '/@/renderer/hooks/use-list-filter-refresh';
import { queryClient } from '/@/renderer/lib/react-query';
import {
    PersistedTableColumn,
    SongListFilter,
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
    ServerType,
    SongListQuery,
    SongListSort,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ListDisplayType, Play } from '/@/shared/types/types';

const FILTERS = {
    jellyfin: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.album', { postProcess: 'titleCase' }),
            value: SongListSort.ALBUM,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.albumArtist', { postProcess: 'titleCase' }),
            value: SongListSort.ALBUM_ARTIST,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.artist', { postProcess: 'titleCase' }),
            value: SongListSort.ARTIST,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.duration', { postProcess: 'titleCase' }),
            value: SongListSort.DURATION,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.playCount', { postProcess: 'titleCase' }),
            value: SongListSort.PLAY_COUNT,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: SongListSort.NAME,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.random', { postProcess: 'titleCase' }),
            value: SongListSort.RANDOM,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.recentlyAdded', { postProcess: 'titleCase' }),
            value: SongListSort.RECENTLY_ADDED,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.recentlyPlayed', { postProcess: 'titleCase' }),
            value: SongListSort.RECENTLY_PLAYED,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.releaseDate', { postProcess: 'titleCase' }),
            value: SongListSort.RELEASE_DATE,
        },
    ],
    navidrome: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.album', { postProcess: 'titleCase' }),
            value: SongListSort.ALBUM,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.albumArtist', { postProcess: 'titleCase' }),
            value: SongListSort.ALBUM_ARTIST,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.artist', { postProcess: 'titleCase' }),
            value: SongListSort.ARTIST,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.bpm', { postProcess: 'titleCase' }),
            value: SongListSort.BPM,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('common.channel', { count: 2, postProcess: 'titleCase' }),
            value: SongListSort.CHANNELS,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.comment', { postProcess: 'titleCase' }),
            value: SongListSort.COMMENT,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.duration', { postProcess: 'titleCase' }),
            value: SongListSort.DURATION,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.isFavorited', { postProcess: 'titleCase' }),
            value: SongListSort.FAVORITED,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.genre', { postProcess: 'titleCase' }),
            value: SongListSort.GENRE,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: SongListSort.NAME,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.playCount', { postProcess: 'titleCase' }),
            value: SongListSort.PLAY_COUNT,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.random', { postProcess: 'titleCase' }),
            value: SongListSort.RANDOM,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.rating', { postProcess: 'titleCase' }),
            value: SongListSort.RATING,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyAdded', { postProcess: 'titleCase' }),
            value: SongListSort.RECENTLY_ADDED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyPlayed', { postProcess: 'titleCase' }),
            value: SongListSort.RECENTLY_PLAYED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.releaseYear', { postProcess: 'titleCase' }),
            value: SongListSort.YEAR,
        },
    ],
    subsonic: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: SongListSort.NAME,
        },
    ],
};

interface SongListHeaderFiltersProps {
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    itemCount?: number;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const SongListHeaderFilters = ({
    gridRef,
    itemCount,
    tableRef,
}: SongListHeaderFiltersProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const { customFilters, handlePlay, pageKey } = useListContext();
    const { display, filter, grid, table } = useListStoreByKey<SongListQuery>({
        filter: customFilters,
        key: pageKey,
    });

    const { setDisplayType, setFilter, setGrid, setTable, setTablePagination } =
        useListStoreActions();

    const { handleRefreshGrid, handleRefreshTable } = useListFilterRefresh({
        itemCount,
        itemType: LibraryItem.SONG,
        server,
    });

    const cq = useContainerQuery();

    const musicFoldersQuery = useMusicFolders({ query: null, serverId: server?.id });

    const sortByLabel =
        (server?.type &&
            (
                FILTERS[server.type as keyof typeof FILTERS] as { name: string; value: string }[]
            ).find((f) => f.value === filter.sortBy)?.name) ||
        'Unknown';

    const isGrid = display === ListDisplayType.CARD || display === ListDisplayType.GRID;

    const handleSetSortBy = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            if (!e.currentTarget?.value || !server?.type) return;
            const sortOrder = FILTERS[server.type as keyof typeof FILTERS].find(
                (f) => f.value === e.currentTarget.value,
            )?.defaultOrder;

            const updatedFilters = setFilter({
                customFilters,
                data: {
                    sortBy: e.currentTarget.value as SongListSort,
                    sortOrder: sortOrder || SortOrder.ASC,
                },
                itemType: LibraryItem.SONG,
                key: pageKey,
            }) as SongListFilter;

            if (isGrid) {
                handleRefreshGrid(gridRef, updatedFilters);
            } else {
                handleRefreshTable(tableRef, updatedFilters);
            }
        },
        [
            customFilters,
            gridRef,
            handleRefreshGrid,
            handleRefreshTable,
            isGrid,
            pageKey,
            server?.type,
            setFilter,
            tableRef,
        ],
    );

    const handleSetMusicFolder = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            if (!e.currentTarget?.value) return;

            let updatedFilters: null | SongListFilter = null;
            if (e.currentTarget.value === String(filter.musicFolderId)) {
                updatedFilters = setFilter({
                    customFilters,
                    data: { musicFolderId: undefined },
                    itemType: LibraryItem.SONG,
                    key: pageKey,
                }) as SongListFilter;
            } else {
                updatedFilters = setFilter({
                    customFilters,
                    data: { musicFolderId: e.currentTarget.value },
                    itemType: LibraryItem.SONG,
                    key: pageKey,
                }) as SongListFilter;
            }

            if (isGrid) {
                handleRefreshGrid(gridRef, updatedFilters);
            } else {
                handleRefreshTable(tableRef, updatedFilters);
            }
        },
        [
            filter.musicFolderId,
            isGrid,
            setFilter,
            customFilters,
            pageKey,
            handleRefreshGrid,
            gridRef,
            handleRefreshTable,
            tableRef,
        ],
    );

    const handleToggleSortOrder = useCallback(() => {
        const newSortOrder = filter.sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;
        const updatedFilters = setFilter({
            customFilters,
            data: { sortOrder: newSortOrder },
            itemType: LibraryItem.SONG,
            key: pageKey,
        }) as SongListFilter;

        if (isGrid) {
            handleRefreshGrid(gridRef, updatedFilters);
        } else {
            handleRefreshTable(tableRef, updatedFilters);
        }
    }, [
        customFilters,
        filter.sortOrder,
        gridRef,
        handleRefreshGrid,
        handleRefreshTable,
        isGrid,
        pageKey,
        setFilter,
        tableRef,
    ]);

    const handleSetViewType = useCallback(
        (displayType: ListDisplayType) => {
            setDisplayType({
                data: displayType,
                key: pageKey,
            });

            if (display === ListDisplayType.TABLE) {
                tableRef.current?.api.paginationSetPageSize(
                    tableRef.current.props.infiniteInitialRowCount,
                );
                setTablePagination({ data: { currentPage: 0 }, key: pageKey });
            } else if (display === ListDisplayType.TABLE_PAGINATED) {
                setTablePagination({ data: { currentPage: 0 }, key: pageKey });
            }
        },
        [display, pageKey, setDisplayType, setTablePagination, tableRef],
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
        queryClient.invalidateQueries(queryKeys.songs.list(server?.id || ''));
        if (isGrid) {
            handleRefreshGrid(gridRef, filter);
        } else {
            handleRefreshTable(tableRef, filter);
        }
    };

    const onFilterChange = (filter: SongListFilter) => {
        if (isGrid) {
            handleRefreshGrid(gridRef, {
                ...filter,
            });
        } else {
            handleRefreshTable(tableRef, {
                ...filter,
            });
        }
    };

    const handleOpenFiltersModal = () => {
        let FilterComponent;

        switch (server?.type) {
            case ServerType.JELLYFIN:
                FilterComponent = JellyfinSongFilters;
                break;
            case ServerType.NAVIDROME:
                FilterComponent = NavidromeSongFilters;
                break;
            case ServerType.SUBSONIC:
                FilterComponent = SubsonicSongFilters;
                break;
        }

        if (!FilterComponent) {
            return;
        }

        openModal({
            children: (
                <FilterComponent
                    customFilters={customFilters}
                    onFilterChange={onFilterChange}
                    pageKey={pageKey}
                    serverId={server?.id}
                />
            ),
            title: 'Song Filters',
        });
    };

    const isFilterApplied = useMemo(() => {
        const isNavidromeFilterApplied =
            server?.type === ServerType.NAVIDROME &&
            filter._custom?.navidrome &&
            Object.values(filter?._custom?.navidrome).some((value) => value !== undefined);

        const isJellyfinFilterApplied =
            server?.type === ServerType.JELLYFIN &&
            filter?._custom?.jellyfin &&
            Object.values(filter?._custom?.jellyfin)
                .filter((value) => value !== 'Audio') // Don't account for includeItemTypes: Audio
                .some((value) => value !== undefined);

        const isGenericFilterApplied = filter?.favorite || filter?.genreIds?.length;

        return isNavidromeFilterApplied || isJellyfinFilterApplied || isGenericFilterApplied;
    }, [
        filter._custom?.jellyfin,
        filter._custom?.navidrome,
        filter?.favorite,
        filter?.genreIds?.length,
        server?.type,
    ]);

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
                {server?.type !== ServerType.SUBSONIC && (
                    <OrderToggleButton
                        onToggle={handleToggleSortOrder}
                        sortOrder={filter.sortOrder}
                    />
                )}
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
                <FilterButton
                    isActive={!!isFilterApplied}
                    onClick={handleOpenFiltersModal}
                />
                <RefreshButton onClick={handleRefresh} />
                <DropdownMenu position="bottom-start">
                    <DropdownMenu.Target>
                        <MoreButton />
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        <DropdownMenu.Item
                            leftSection={<Icon icon="mediaPlay" />}
                            onClick={() => handlePlay?.({ playType: Play.NOW })}
                        >
                            {t('player.play', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            leftSection={<Icon icon="mediaShuffle" />}
                            onClick={() => handlePlay?.({ playType: Play.SHUFFLE })}
                        >
                            {t('player.shuffle', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            leftSection={<Icon icon="mediaPlayLast" />}
                            onClick={() => handlePlay?.({ playType: Play.LAST })}
                        >
                            {t('player.addLast', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            leftSection={<Icon icon="mediaPlayNext" />}
                            onClick={() => handlePlay?.({ playType: Play.NEXT })}
                        >
                            {t('player.addNext', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Divider />
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
                gap="sm"
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
                    tableColumnsData={SONG_TABLE_COLUMNS}
                />
            </Group>
        </Flex>
    );
};
