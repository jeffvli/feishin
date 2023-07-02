import { useCallback, useMemo, ChangeEvent, MutableRefObject, MouseEvent } from 'react';
import { IDatasource } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Flex, Group, Stack } from '@mantine/core';
import { openModal } from '@mantine/modals';
import {
    RiSortAsc,
    RiSortDesc,
    RiFolder2Line,
    RiMoreFill,
    RiSettings3Fill,
    RiPlayFill,
    RiAddBoxFill,
    RiAddCircleFill,
    RiRefreshLine,
    RiFilterFill,
} from 'react-icons/ri';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { LibraryItem, SongListQuery, SongListSort, SortOrder } from '/@/renderer/api/types';
import { DropdownMenu, Button, Slider, MultiSelect, Switch, Text } from '/@/renderer/components';
import { useMusicFolders } from '/@/renderer/features/shared';
import { JellyfinSongFilters } from '/@/renderer/features/songs/components/jellyfin-song-filters';
import { NavidromeSongFilters } from '/@/renderer/features/songs/components/navidrome-song-filters';
import { useContainerQuery } from '/@/renderer/hooks';
import { queryClient } from '/@/renderer/lib/react-query';
import {
    SongListFilter,
    useCurrentServer,
    useListStoreActions,
    useSongListFilter,
    useSongListStore,
} from '/@/renderer/store';
import { ListDisplayType, ServerType, Play, TableColumn } from '/@/renderer/types';
import { useSongListContext } from '/@/renderer/features/songs/context/song-list-context';
import { SONG_TABLE_COLUMNS } from '/@/renderer/components/virtual-table';

const FILTERS = {
    jellyfin: [
        { defaultOrder: SortOrder.ASC, name: 'Album', value: SongListSort.ALBUM },
        { defaultOrder: SortOrder.ASC, name: 'Album Artist', value: SongListSort.ALBUM_ARTIST },
        { defaultOrder: SortOrder.ASC, name: 'Artist', value: SongListSort.ARTIST },
        { defaultOrder: SortOrder.ASC, name: 'Duration', value: SongListSort.DURATION },
        { defaultOrder: SortOrder.ASC, name: 'Most Played', value: SongListSort.PLAY_COUNT },
        { defaultOrder: SortOrder.ASC, name: 'Name', value: SongListSort.NAME },
        { defaultOrder: SortOrder.ASC, name: 'Random', value: SongListSort.RANDOM },
        { defaultOrder: SortOrder.ASC, name: 'Recently Added', value: SongListSort.RECENTLY_ADDED },
        {
            defaultOrder: SortOrder.ASC,
            name: 'Recently Played',
            value: SongListSort.RECENTLY_PLAYED,
        },
        { defaultOrder: SortOrder.ASC, name: 'Release Date', value: SongListSort.RELEASE_DATE },
    ],
    navidrome: [
        { defaultOrder: SortOrder.ASC, name: 'Album', value: SongListSort.ALBUM },
        { defaultOrder: SortOrder.ASC, name: 'Album Artist', value: SongListSort.ALBUM_ARTIST },
        { defaultOrder: SortOrder.ASC, name: 'Artist', value: SongListSort.ARTIST },
        { defaultOrder: SortOrder.DESC, name: 'BPM', value: SongListSort.BPM },
        { defaultOrder: SortOrder.ASC, name: 'Channels', value: SongListSort.CHANNELS },
        { defaultOrder: SortOrder.ASC, name: 'Comment', value: SongListSort.COMMENT },
        { defaultOrder: SortOrder.DESC, name: 'Duration', value: SongListSort.DURATION },
        { defaultOrder: SortOrder.DESC, name: 'Favorited', value: SongListSort.FAVORITED },
        { defaultOrder: SortOrder.ASC, name: 'Genre', value: SongListSort.GENRE },
        { defaultOrder: SortOrder.ASC, name: 'Name', value: SongListSort.NAME },
        { defaultOrder: SortOrder.DESC, name: 'Play Count', value: SongListSort.PLAY_COUNT },
        { defaultOrder: SortOrder.DESC, name: 'Rating', value: SongListSort.RATING },
        {
            defaultOrder: SortOrder.DESC,
            name: 'Recently Added',
            value: SongListSort.RECENTLY_ADDED,
        },
        {
            defaultOrder: SortOrder.DESC,
            name: 'Recently Played',
            value: SongListSort.RECENTLY_PLAYED,
        },
        { defaultOrder: SortOrder.DESC, name: 'Year', value: SongListSort.YEAR },
    ],
};

const ORDER = [
    { name: 'Ascending', value: SortOrder.ASC },
    { name: 'Descending', value: SortOrder.DESC },
];

interface SongListHeaderFiltersProps {
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const SongListHeaderFilters = ({ tableRef }: SongListHeaderFiltersProps) => {
    const server = useCurrentServer();
    const { id, pageKey, handlePlay } = useSongListContext();
    const { display, table } = useSongListStore({ id, key: pageKey });
    const { setFilter, setTable, setTablePagination, setDisplayType } = useListStoreActions();
    const filter = useSongListFilter({ id, key: pageKey });

    const cq = useContainerQuery();

    const musicFoldersQuery = useMusicFolders({ query: null, serverId: server?.id });

    const sortByLabel =
        (server?.type &&
            (
                FILTERS[server.type as keyof typeof FILTERS] as { name: string; value: string }[]
            ).find((f) => f.value === filter.sortBy)?.name) ||
        'Unknown';

    const sortOrderLabel = ORDER.find((s) => s.value === filter.sortOrder)?.name;

    const handleFilterChange = useCallback(
        async (filters?: SongListFilter) => {
            const dataSource: IDatasource = {
                getRows: async (params) => {
                    const limit = params.endRow - params.startRow;
                    const startIndex = params.startRow;

                    const pageFilters = filters || filter;

                    const query: SongListQuery = {
                        limit,
                        startIndex,
                        ...pageFilters,
                    };

                    const queryKey = queryKeys.songs.list(server?.id || '', query);

                    const songsRes = await queryClient.fetchQuery(
                        queryKey,
                        async ({ signal }) =>
                            api.controller.getSongList({
                                apiClientProps: {
                                    server,
                                    signal,
                                },
                                query,
                            }),
                        { cacheTime: 1000 * 60 * 1 },
                    );

                    params.successCallback(songsRes?.items || [], songsRes?.totalRecordCount || 0);
                },
                rowCount: undefined,
            };
            tableRef.current?.api.setDatasource(dataSource);
            tableRef.current?.api.purgeInfiniteCache();
            tableRef.current?.api.ensureIndexVisible(0, 'top');
            setTablePagination({ data: { currentPage: 0 }, key: pageKey });
        },
        [filter, pageKey, server, setTablePagination, tableRef],
    );

    const handleSetSortBy = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            if (!e.currentTarget?.value || !server?.type) return;

            const sortOrder = FILTERS[server.type as keyof typeof FILTERS].find(
                (f) => f.value === e.currentTarget.value,
            )?.defaultOrder;

            const updatedFilters = setFilter({
                data: {
                    sortBy: e.currentTarget.value as SongListSort,
                    sortOrder: sortOrder || SortOrder.ASC,
                },
                itemType: LibraryItem.SONG,
                key: pageKey,
            }) as SongListFilter;

            handleFilterChange(updatedFilters);
        },
        [handleFilterChange, pageKey, server?.type, setFilter],
    );

    const handleSetMusicFolder = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            if (!e.currentTarget?.value) return;

            let updatedFilters = null;
            if (e.currentTarget.value === String(filter.musicFolderId)) {
                updatedFilters = setFilter({
                    data: { musicFolderId: undefined },
                    itemType: LibraryItem.SONG,
                    key: pageKey,
                }) as SongListFilter;
            } else {
                updatedFilters = setFilter({
                    data: { musicFolderId: e.currentTarget.value },
                    itemType: LibraryItem.SONG,
                    key: pageKey,
                }) as SongListFilter;
            }

            handleFilterChange(updatedFilters);
        },
        [filter.musicFolderId, handleFilterChange, setFilter, pageKey],
    );

    const handleToggleSortOrder = useCallback(() => {
        const newSortOrder = filter.sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;
        const updatedFilters = setFilter({
            data: { sortOrder: newSortOrder },
            itemType: LibraryItem.SONG,
            key: pageKey,
        }) as SongListFilter;
        handleFilterChange(updatedFilters);
    }, [filter.sortOrder, handleFilterChange, pageKey, setFilter]);

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

    const handleRowHeight = (e: number) => {
        setTable({ data: { rowHeight: e }, key: pageKey });
    };

    const handleRefresh = () => {
        queryClient.invalidateQueries(queryKeys.songs.list(server?.id || ''));
        handleFilterChange(filter);
    };

    const handleOpenFiltersModal = () => {
        openModal({
            children: (
                <>
                    {server?.type === ServerType.NAVIDROME ? (
                        <NavidromeSongFilters
                            handleFilterChange={handleFilterChange}
                            id={id}
                            pageKey={pageKey}
                        />
                    ) : (
                        <JellyfinSongFilters
                            handleFilterChange={handleFilterChange}
                            id={id}
                            pageKey={pageKey}
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
                <Button
                    compact
                    fw="600"
                    size="md"
                    variant="subtle"
                    onClick={handleToggleSortOrder}
                >
                    {cq.isSm ? (
                        sortOrderLabel
                    ) : (
                        <>
                            {filter.sortOrder === SortOrder.ASC ? (
                                <RiSortAsc size="1.3rem" />
                            ) : (
                                <RiSortDesc size="1.3rem" />
                            )}
                        </>
                    )}
                </Button>
                {server?.type === ServerType.JELLYFIN && (
                    <DropdownMenu position="bottom-start">
                        <DropdownMenu.Target>
                            <Button
                                compact
                                fw="600"
                                size="md"
                                variant="subtle"
                            >
                                {cq.isSm ? 'Folder' : <RiFolder2Line size="1.3rem" />}
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
                )}
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
                            $isActive={display === ListDisplayType.TABLE}
                            value={ListDisplayType.TABLE}
                            onClick={handleSetViewType}
                        >
                            Table
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            $isActive={display === ListDisplayType.TABLE_PAGINATED}
                            value={ListDisplayType.TABLE_PAGINATED}
                            onClick={handleSetViewType}
                        >
                            Table (paginated)
                        </DropdownMenu.Item>
                        <DropdownMenu.Divider />
                        <DropdownMenu.Label>Item Size</DropdownMenu.Label>
                        <DropdownMenu.Item closeMenuOnClick={false}>
                            <Slider
                                defaultValue={table.rowHeight || 0}
                                label={null}
                                max={100}
                                min={25}
                                onChangeEnd={handleRowHeight}
                            />
                        </DropdownMenu.Item>
                        <DropdownMenu.Label>Table Columns</DropdownMenu.Label>
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
                                    <Text>Auto Fit Columns</Text>
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
