import { ChangeEvent, MouseEvent, MutableRefObject, useCallback, useMemo } from 'react';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Divider, Flex, Group, Stack } from '@mantine/core';
import { openModal } from '@mantine/modals';
import { useTranslation } from 'react-i18next';
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
import { useListStoreByKey } from '../../../store/list.store';
import { queryKeys } from '/@/renderer/api/query-keys';
import { LibraryItem, ServerType, SongListSort, SortOrder } from '/@/renderer/api/types';
import { Button, DropdownMenu, MultiSelect, Slider, Switch, Text } from '/@/renderer/components';
import { VirtualInfiniteGridRef } from '/@/renderer/components/virtual-grid';
import { SONG_TABLE_COLUMNS } from '/@/renderer/components/virtual-table';
import { useListContext } from '/@/renderer/context/list-context';
import { OrderToggleButton, useMusicFolders } from '/@/renderer/features/shared';
import { JellyfinSongFilters } from '/@/renderer/features/songs/components/jellyfin-song-filters';
import { NavidromeSongFilters } from '/@/renderer/features/songs/components/navidrome-song-filters';
import { useContainerQuery } from '/@/renderer/hooks';
import { useListFilterRefresh } from '/@/renderer/hooks/use-list-filter-refresh';
import { queryClient } from '/@/renderer/lib/react-query';
import { SongListFilter, useCurrentServer, useListStoreActions } from '/@/renderer/store';
import { ListDisplayType, Play, TableColumn } from '/@/renderer/types';
import i18n from '/@/i18n/i18n';

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
};

interface SongListHeaderFiltersProps {
    gridRef: MutableRefObject<VirtualInfiniteGridRef | null>;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const SongListHeaderFilters = ({ gridRef, tableRef }: SongListHeaderFiltersProps) => {
    const { t } = useTranslation();
    const server = useCurrentServer();
    const { pageKey, handlePlay, customFilters } = useListContext();
    const { display, table, filter, grid } = useListStoreByKey({
        filter: customFilters,
        key: pageKey,
    });
    const { setFilter, setGrid, setTable, setTablePagination, setDisplayType } =
        useListStoreActions();

    const { handleRefreshTable, handleRefreshGrid } = useListFilterRefresh({
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

    const isGrid = display === ListDisplayType.CARD || display === ListDisplayType.POSTER;

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

            let updatedFilters = null;
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
        (e: MouseEvent<HTMLButtonElement>) => {
            if (!e.currentTarget?.value) return;
            const display = e.currentTarget.value as ListDisplayType;
            setDisplayType({
                data: e.currentTarget.value as ListDisplayType,
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
        [pageKey, setDisplayType, setTablePagination, tableRef],
    );

    const handleTableColumns = (values: TableColumn[]) => {
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
            const newColumn = { column: values[values.length - 1], width: 100 };

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
        openModal({
            children: (
                <>
                    {server?.type === ServerType.NAVIDROME ? (
                        <NavidromeSongFilters
                            customFilters={customFilters}
                            pageKey={pageKey}
                            serverId={server?.id}
                            onFilterChange={onFilterChange}
                        />
                    ) : (
                        <JellyfinSongFilters
                            customFilters={customFilters}
                            pageKey={pageKey}
                            serverId={server?.id}
                            onFilterChange={onFilterChange}
                        />
                    )}
                </>
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
                            fw="600"
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
                                    fw="600"
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
                    tooltip={{ label: t('common.filters', { postProcess: 'titleCase' }) }}
                    variant="subtle"
                    onClick={handleOpenFiltersModal}
                >
                    <RiFilterFill size="1.3rem" />
                </Button>
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
                            fw="600"
                            size="md"
                            variant="subtle"
                        >
                            <RiMoreFill size="1.3rem" />
                        </Button>
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        <DropdownMenu.Item
                            icon={<RiPlayFill />}
                            onClick={() => handlePlay?.({ playType: Play.NOW })}
                        >
                            {t('player.play', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            icon={<RiAddBoxFill />}
                            onClick={() => handlePlay?.({ playType: Play.LAST })}
                        >
                            {t('player.addLast', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            icon={<RiAddCircleFill />}
                            onClick={() => handlePlay?.({ playType: Play.NEXT })}
                        >
                            {t('player.addNext', { postProcess: 'sentenceCase' })}
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
                            variant="subtle"
                        >
                            <RiSettings3Fill size="1.3rem" />
                        </Button>
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        <DropdownMenu.Label>
                            {t('table.config.general.displayType', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Label>
                        <DropdownMenu.Item
                            $isActive={display === ListDisplayType.CARD}
                            value={ListDisplayType.CARD}
                            onClick={handleSetViewType}
                        >
                            {t('table.config.view.card', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            $isActive={display === ListDisplayType.POSTER}
                            value={ListDisplayType.POSTER}
                            onClick={handleSetViewType}
                        >
                            {t('table.config.view.poster', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            $isActive={display === ListDisplayType.TABLE}
                            value={ListDisplayType.TABLE}
                            onClick={handleSetViewType}
                        >
                            {t('table.config.view.table', { postProcess: 'sentenceCase' })}
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
                            {t('table.config.general.size', { postProcess: 'sentenceCase' })}
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
                                    {t('table.config.general.gap', {
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
                        <DropdownMenu.Label>
                            {t('table.config.general.tableColumns', {
                                postProcess: 'sentenceCase',
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
                                    data={SONG_TABLE_COLUMNS}
                                    defaultValue={table?.columns.map((column) => column.column)}
                                    width={300}
                                    onChange={handleTableColumns}
                                />
                                <Group position="apart">
                                    <Text>
                                        {t('table.config.general.autoFitColumns', {
                                            postProcess: 'sentenceCase',
                                        })}
                                    </Text>
                                    <Switch
                                        defaultChecked={table.autoFit}
                                        onChange={handleAutoFitColumns}
                                    />
                                </Group>
                            </Stack>
                        </DropdownMenu.Item>
                    </DropdownMenu.Dropdown>
                </DropdownMenu>
            </Group>
        </Flex>
    );
};
