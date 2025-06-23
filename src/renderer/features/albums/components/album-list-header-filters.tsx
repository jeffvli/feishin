import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { openModal } from '@mantine/modals';
import { useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { MouseEvent, MutableRefObject, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import i18n from '/@/i18n/i18n';
import { queryKeys } from '/@/renderer/api/query-keys';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { ALBUM_TABLE_COLUMNS } from '/@/renderer/components/virtual-table';
import { useListContext } from '/@/renderer/context/list-context';
import { JellyfinAlbumFilters } from '/@/renderer/features/albums/components/jellyfin-album-filters';
import { NavidromeAlbumFilters } from '/@/renderer/features/albums/components/navidrome-album-filters';
import { SubsonicAlbumFilters } from '/@/renderer/features/albums/components/subsonic-album-filters';
import { OrderToggleButton, useMusicFolders } from '/@/renderer/features/shared';
import { FilterButton } from '/@/renderer/features/shared/components/filter-button';
import { FolderButton } from '/@/renderer/features/shared/components/folder-button';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import { MoreButton } from '/@/renderer/features/shared/components/more-button';
import { RefreshButton } from '/@/renderer/features/shared/components/refresh-button';
import { useContainerQuery } from '/@/renderer/hooks';
import { useListFilterRefresh } from '/@/renderer/hooks/use-list-filter-refresh';
import {
    AlbumListFilter,
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
    AlbumListQuery,
    AlbumListSort,
    LibraryItem,
    ServerType,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ListDisplayType, Play, TableColumn } from '/@/shared/types/types';

const FILTERS = {
    jellyfin: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.albumArtist', { postProcess: 'titleCase' }),
            value: AlbumListSort.ALBUM_ARTIST,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.communityRating', { postProcess: 'titleCase' }),
            value: AlbumListSort.COMMUNITY_RATING,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.criticRating', { postProcess: 'titleCase' }),
            value: AlbumListSort.CRITIC_RATING,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: AlbumListSort.NAME,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.playCount', { postProcess: 'titleCase' }),
            value: AlbumListSort.PLAY_COUNT,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.random', { postProcess: 'titleCase' }),
            value: AlbumListSort.RANDOM,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyAdded', { postProcess: 'titleCase' }),
            value: AlbumListSort.RECENTLY_ADDED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.releaseDate', { postProcess: 'titleCase' }),
            value: AlbumListSort.RELEASE_DATE,
        },
    ],
    navidrome: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.albumArtist', { postProcess: 'titleCase' }),
            value: AlbumListSort.ALBUM_ARTIST,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.artist', { postProcess: 'titleCase' }),
            value: AlbumListSort.ARTIST,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.duration', { postProcess: 'titleCase' }),
            value: AlbumListSort.DURATION,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.mostPlayed', { postProcess: 'titleCase' }),
            value: AlbumListSort.PLAY_COUNT,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: AlbumListSort.NAME,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.random', { postProcess: 'titleCase' }),
            value: AlbumListSort.RANDOM,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.rating', { postProcess: 'titleCase' }),
            value: AlbumListSort.RATING,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyAdded', { postProcess: 'titleCase' }),
            value: AlbumListSort.RECENTLY_ADDED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyPlayed', { postProcess: 'titleCase' }),
            value: AlbumListSort.RECENTLY_PLAYED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.songCount', { postProcess: 'titleCase' }),
            value: AlbumListSort.SONG_COUNT,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.favorited', { postProcess: 'titleCase' }),
            value: AlbumListSort.FAVORITED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.releaseYear', { postProcess: 'titleCase' }),
            value: AlbumListSort.YEAR,
        },
    ],
    subsonic: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.albumArtist', { postProcess: 'titleCase' }),
            value: AlbumListSort.ALBUM_ARTIST,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.mostPlayed', { postProcess: 'titleCase' }),
            value: AlbumListSort.PLAY_COUNT,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.name', { postProcess: 'titleCase' }),
            value: AlbumListSort.NAME,
        },
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.random', { postProcess: 'titleCase' }),
            value: AlbumListSort.RANDOM,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyAdded', { postProcess: 'titleCase' }),
            value: AlbumListSort.RECENTLY_ADDED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.recentlyPlayed', { postProcess: 'titleCase' }),
            value: AlbumListSort.RECENTLY_PLAYED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.favorited', { postProcess: 'titleCase' }),
            value: AlbumListSort.FAVORITED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: i18n.t('filter.releaseYear', { postProcess: 'titleCase' }),
            value: AlbumListSort.YEAR,
        },
    ],
};

interface AlbumListHeaderFiltersProps {
    gridRef: MutableRefObject<null | VirtualInfiniteGridRef>;
    itemCount: number | undefined;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const AlbumListHeaderFilters = ({
    gridRef,
    itemCount,
    tableRef,
}: AlbumListHeaderFiltersProps) => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { customFilters, handlePlay, pageKey } = useListContext();
    const server = useCurrentServer();
    const { setDisplayType, setFilter, setGrid, setTable } = useListStoreActions();
    const { display, filter, grid, table } = useListStoreByKey<AlbumListQuery>({
        filter: customFilters,
        key: pageKey,
    });
    const cq = useContainerQuery();

    const { handleRefreshGrid, handleRefreshTable } = useListFilterRefresh({
        itemCount,
        itemType: LibraryItem.ALBUM,
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
        (filter: AlbumListFilter) => {
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

    const handleOpenFiltersModal = () => {
        let FilterComponent;

        switch (server?.type) {
            case ServerType.JELLYFIN:
                FilterComponent = JellyfinAlbumFilters;
                break;
            case ServerType.NAVIDROME:
                FilterComponent = NavidromeAlbumFilters;
                break;
            case ServerType.SUBSONIC:
                FilterComponent = SubsonicAlbumFilters;
                break;
            default:
                break;
        }

        if (!FilterComponent) {
            return;
        }

        openModal({
            children: (
                <FilterComponent
                    customFilters={customFilters}
                    disableArtistFilter={!!customFilters}
                    onFilterChange={onFilterChange}
                    pageKey={pageKey}
                    serverId={server?.id}
                />
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

            let updatedFilters: AlbumListFilter | null = null;
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
            const newColumn = { column: values[values.length - 1] as TableColumn, width: 100 };

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

    const isFilterApplied = useMemo(() => {
        const isNavidromeFilterApplied =
            server?.type === ServerType.NAVIDROME &&
            filter?._custom?.navidrome &&
            Object.values(filter?._custom?.navidrome).some((value) => value !== undefined);

        const isJellyfinFilterApplied =
            server?.type === ServerType.JELLYFIN &&
            filter?._custom?.jellyfin &&
            Object.values(filter?._custom?.jellyfin).some((value) => value !== undefined);

        const isSubsonicFilterApplied =
            server?.type === ServerType.SUBSONIC &&
            (filter.maxYear || filter.minYear || filter.favorite);

        return (
            isNavidromeFilterApplied ||
            isJellyfinFilterApplied ||
            isSubsonicFilterApplied ||
            filter.genres?.length
        );
    }, [
        filter?._custom?.jellyfin,
        filter?._custom?.navidrome,
        filter.favorite,
        filter.genres?.length,
        filter.maxYear,
        filter.minYear,
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
                <OrderToggleButton
                    onToggle={handleToggleSortOrder}
                    sortOrder={filter.sortOrder}
                />
                {server?.type === ServerType.JELLYFIN && (
                    <>
                        <Divider orientation="vertical" />
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
                            {t('common.refresh', { postProcess: 'sentenceCase' })}
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
                    tableColumnsData={ALBUM_TABLE_COLUMNS}
                />
            </Group>
        </Flex>
    );
};
