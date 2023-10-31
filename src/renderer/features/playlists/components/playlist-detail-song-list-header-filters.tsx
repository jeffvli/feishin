import { useCallback, ChangeEvent, MutableRefObject, MouseEvent } from 'react';
import { IDatasource } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Divider, Flex, Group, Stack } from '@mantine/core';
import { closeAllModals, openModal } from '@mantine/modals';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
    RiMoreFill,
    RiSettings3Fill,
    RiPlayFill,
    RiAddCircleFill,
    RiAddBoxFill,
    RiEditFill,
    RiDeleteBinFill,
    RiRefreshLine,
} from 'react-icons/ri';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { LibraryItem, PlaylistSongListQuery, SongListSort, SortOrder } from '/@/renderer/api/types';
import {
    DropdownMenu,
    Button,
    Slider,
    MultiSelect,
    Switch,
    Text,
    ConfirmModal,
    toast,
} from '/@/renderer/components';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { useContainerQuery } from '/@/renderer/hooks';
import {
    useCurrentServer,
    SongListFilter,
    usePlaylistDetailStore,
    useSetPlaylistDetailFilters,
    useSetPlaylistDetailTable,
    useSetPlaylistStore,
    useSetPlaylistTablePagination,
} from '/@/renderer/store';
import { ListDisplayType, ServerType, Play, TableColumn } from '/@/renderer/types';
import { usePlaylistDetail } from '/@/renderer/features/playlists/queries/playlist-detail-query';
import { useParams, useNavigate } from 'react-router';
import { SONG_TABLE_COLUMNS } from '/@/renderer/components/virtual-table';
import { openUpdatePlaylistModal } from '/@/renderer/features/playlists/components/update-playlist-form';
import { useDeletePlaylist } from '/@/renderer/features/playlists/mutations/delete-playlist-mutation';
import { AppRoute } from '/@/renderer/router/routes';
import { OrderToggleButton } from '/@/renderer/features/shared';

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
        { defaultOrder: SortOrder.ASC, name: 'Id', value: SongListSort.ID },
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

interface PlaylistDetailSongListHeaderFiltersProps {
    handleToggleShowQueryBuilder: () => void;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const PlaylistDetailSongListHeaderFilters = ({
    tableRef,
    handleToggleShowQueryBuilder,
}: PlaylistDetailSongListHeaderFiltersProps) => {
    const { t } = useTranslation();
    const { playlistId } = useParams() as { playlistId: string };
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const server = useCurrentServer();
    const setPage = useSetPlaylistStore();
    const setFilter = useSetPlaylistDetailFilters();
    const page = usePlaylistDetailStore();
    const filters: Partial<PlaylistSongListQuery> = {
        sortBy: page?.table.id[playlistId]?.filter?.sortBy || SongListSort.ID,
        sortOrder: page?.table.id[playlistId]?.filter?.sortOrder || SortOrder.ASC,
    };

    const detailQuery = usePlaylistDetail({ query: { id: playlistId }, serverId: server?.id });
    const isSmartPlaylist = detailQuery.data?.rules;

    const handlePlayQueueAdd = usePlayQueueAdd();

    const cq = useContainerQuery();

    const setPagination = useSetPlaylistTablePagination();
    const setTable = useSetPlaylistDetailTable();

    const sortByLabel =
        (server?.type &&
            FILTERS[server.type as keyof typeof FILTERS].find((f) => f.value === filters.sortBy)
                ?.name) ||
        'Unknown';

    const handleItemSize = (e: number) => {
        setTable({ rowHeight: e });
    };

    const handleFilterChange = useCallback(
        async (filters: SongListFilter) => {
            const dataSource: IDatasource = {
                getRows: async (params) => {
                    const limit = params.endRow - params.startRow;
                    const startIndex = params.startRow;

                    const queryKey = queryKeys.playlists.songList(server?.id || '', playlistId, {
                        id: playlistId,
                        limit,
                        startIndex,
                        ...filters,
                    });

                    const songsRes = await queryClient.fetchQuery(
                        queryKey,
                        async ({ signal }) =>
                            api.controller.getPlaylistSongList({
                                apiClientProps: {
                                    server,
                                    signal,
                                },
                                query: {
                                    id: playlistId,
                                    limit,
                                    startIndex,
                                    ...filters,
                                },
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

            if (page.display === ListDisplayType.TABLE_PAGINATED) {
                setPagination({ data: { currentPage: 0 } });
            }
        },
        [tableRef, page.display, server, playlistId, queryClient, setPagination],
    );

    const handleRefresh = () => {
        queryClient.invalidateQueries(queryKeys.albums.list(server?.id || ''));
        handleFilterChange({ ...page?.table.id[playlistId].filter, ...filters });
    };

    const handleSetSortBy = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            if (!e.currentTarget?.value || !server?.type) return;

            const sortOrder = FILTERS[server.type as keyof typeof FILTERS].find(
                (f) => f.value === e.currentTarget.value,
            )?.defaultOrder;

            const updatedFilters = setFilter(playlistId, {
                sortBy: e.currentTarget.value as SongListSort,
                sortOrder: sortOrder || SortOrder.ASC,
            });

            handleFilterChange(updatedFilters);
        },
        [handleFilterChange, playlistId, server?.type, setFilter],
    );

    const handleToggleSortOrder = useCallback(() => {
        const newSortOrder = filters.sortOrder === SortOrder.ASC ? SortOrder.DESC : SortOrder.ASC;
        const updatedFilters = setFilter(playlistId, { sortOrder: newSortOrder });
        handleFilterChange(updatedFilters);
    }, [filters.sortOrder, handleFilterChange, playlistId, setFilter]);

    const handleSetViewType = useCallback(
        (e: MouseEvent<HTMLButtonElement>) => {
            if (!e.currentTarget?.value) return;
            setPage({ detail: { ...page, display: e.currentTarget.value as ListDisplayType } });
        },
        [page, setPage],
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

            setTable({ columns: [...existingColumns, newColumn] });
        } else {
            // If removing a column
            const removed = existingColumns.filter((column) => !values.includes(column.column));
            const newColumns = existingColumns.filter((column) => !removed.includes(column));

            setTable({ columns: newColumns });
        }

        return tableRef.current?.api.sizeColumnsToFit();
    };

    const handleAutoFitColumns = (e: ChangeEvent<HTMLInputElement>) => {
        setTable({ autoFit: e.currentTarget.checked });

        if (e.currentTarget.checked) {
            tableRef.current?.api.sizeColumnsToFit();
        }
    };

    const handlePlay = async (playType: Play) => {
        handlePlayQueueAdd?.({
            byItemType: { id: [playlistId], type: LibraryItem.PLAYLIST },
            playType,
        });
    };

    const deletePlaylistMutation = useDeletePlaylist({});

    const handleDeletePlaylist = useCallback(() => {
        if (!detailQuery.data) return;
        deletePlaylistMutation?.mutate(
            { query: { id: detailQuery.data.id }, serverId: detailQuery.data.serverId },
            {
                onError: (err) => {
                    toast.error({
                        message: err.message,
                        title: t('error.genericError', { postProcess: 'sentenceCase' }),
                    });
                },
                onSuccess: () => {
                    navigate(AppRoute.PLAYLISTS, { replace: true });
                },
            },
        );
        closeAllModals();
    }, [deletePlaylistMutation, detailQuery.data, navigate, t]);

    const openDeletePlaylistModal = () => {
        openModal({
            children: (
                <ConfirmModal onConfirm={handleDeletePlaylist}>
                    <Text>Are you sure you want to delete this playlist?</Text>
                </ConfirmModal>
            ),
            title: t('form.deletePlaylist.title', { postProcess: 'sentenceCase' }),
        });
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
                                $isActive={filter.value === filters.sortBy}
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
                    sortOrder={filters.sortOrder || SortOrder.ASC}
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
                            icon={<RiPlayFill />}
                            onClick={() => handlePlay(Play.NOW)}
                        >
                            {t('player.play', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            icon={<RiAddBoxFill />}
                            onClick={() => handlePlay(Play.LAST)}
                        >
                            {t('player.addLast', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            icon={<RiAddCircleFill />}
                            onClick={() => handlePlay(Play.NEXT)}
                        >
                            {t('player.addNext', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Divider />
                        <DropdownMenu.Item
                            icon={<RiEditFill />}
                            onClick={() =>
                                openUpdatePlaylistModal({
                                    playlist: detailQuery.data!,
                                    server: server!,
                                })
                            }
                        >
                            {t('action.editPlaylist', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            icon={<RiDeleteBinFill />}
                            onClick={openDeletePlaylistModal}
                        >
                            {t('action.deletePlaylist', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Divider />
                        <DropdownMenu.Item
                            icon={<RiRefreshLine />}
                            onClick={handleRefresh}
                        >
                            {t('action.refresh', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Item>
                        {server?.type === ServerType.NAVIDROME && !isSmartPlaylist && (
                            <>
                                <DropdownMenu.Divider />
                                <DropdownMenu.Item
                                    $danger
                                    onClick={handleToggleShowQueryBuilder}
                                >
                                    {t('action.toggleSmartPlaylistEditor', {
                                        postProcess: 'sentenceCase',
                                    })}
                                </DropdownMenu.Item>
                            </>
                        )}
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
                            $isActive={page.display === ListDisplayType.TABLE}
                            value={ListDisplayType.TABLE}
                            onClick={handleSetViewType}
                        >
                            Table
                        </DropdownMenu.Item>
                        {/* <DropdownMenu.Item
                            $isActive={page.display === ListDisplayType.TABLE_PAGINATED}
                            value={ListDisplayType.TABLE_PAGINATED}
                            onClick={handleSetViewType}
                        >
                            Table (paginated)
                        </DropdownMenu.Item> */}
                        <DropdownMenu.Divider />
                        <DropdownMenu.Label>Item size</DropdownMenu.Label>
                        <DropdownMenu.Item closeMenuOnClick={false}>
                            <Slider
                                defaultValue={page.table.rowHeight}
                                label={null}
                                max={100}
                                min={25}
                                onChangeEnd={handleItemSize}
                            />
                        </DropdownMenu.Item>
                        {(page.display === ListDisplayType.TABLE ||
                            page.display === ListDisplayType.TABLE_PAGINATED) && (
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
                                            data={SONG_TABLE_COLUMNS}
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
