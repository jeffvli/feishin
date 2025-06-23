import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';

import { IDatasource } from '@ag-grid-community/core';
import { closeAllModals, openModal } from '@mantine/modals';
import { useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { MouseEvent, MutableRefObject, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';

import i18n from '/@/i18n/i18n';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import { SONG_TABLE_COLUMNS } from '/@/renderer/components/virtual-table';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { openUpdatePlaylistModal } from '/@/renderer/features/playlists/components/update-playlist-form';
import { useDeletePlaylist } from '/@/renderer/features/playlists/mutations/delete-playlist-mutation';
import { usePlaylistDetail } from '/@/renderer/features/playlists/queries/playlist-detail-query';
import { OrderToggleButton } from '/@/renderer/features/shared';
import { ListConfigMenu } from '/@/renderer/features/shared/components/list-config-menu';
import { MoreButton } from '/@/renderer/features/shared/components/more-button';
import { useContainerQuery } from '/@/renderer/hooks';
import { AppRoute } from '/@/renderer/router/routes';
import {
    PersistedTableColumn,
    SongListFilter,
    useCurrentServer,
    usePlaylistDetailStore,
    useSetPlaylistDetailFilters,
    useSetPlaylistDetailTable,
    useSetPlaylistStore,
    useSetPlaylistTablePagination,
} from '/@/renderer/store';
import { Button } from '/@/shared/components/button/button';
import { Divider } from '/@/shared/components/divider/divider';
import { DropdownMenu } from '/@/shared/components/dropdown-menu/dropdown-menu';
import { Flex } from '/@/shared/components/flex/flex';
import { Group } from '/@/shared/components/group/group';
import { Icon } from '/@/shared/components/icon/icon';
import { ConfirmModal } from '/@/shared/components/modal/modal';
import { Text } from '/@/shared/components/text/text';
import { toast } from '/@/shared/components/toast/toast';
import {
    LibraryItem,
    PlaylistSongListQuery,
    ServerType,
    SongListSort,
    SortOrder,
} from '/@/shared/types/domain-types';
import { ListDisplayType, Play } from '/@/shared/types/types';

const FILTERS = {
    jellyfin: [
        {
            defaultOrder: SortOrder.ASC,
            name: i18n.t('filter.id', { postProcess: 'titleCase' }),
            value: SongListSort.ID,
        },
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
            name: i18n.t('filter.id', { postProcess: 'titleCase' }),
            value: SongListSort.ID,
        },
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
            name: i18n.t('filter.playCount', { postProcess: 'titleCase' }),
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
            name: i18n.t('filter.id', { postProcess: 'titleCase' }),
            value: SongListSort.ID,
        },
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

interface PlaylistDetailSongListHeaderFiltersProps {
    handleToggleShowQueryBuilder: () => void;
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const PlaylistDetailSongListHeaderFilters = ({
    handleToggleShowQueryBuilder,
    tableRef,
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

    const debouncedHandleItemSize = debounce(handleItemSize, 20);

    const handleFilterChange = useCallback(
        async (filters: SongListFilter) => {
            if (server?.type !== ServerType.SUBSONIC) {
                const dataSource: IDatasource = {
                    getRows: async (params) => {
                        const limit = params.endRow - params.startRow;
                        const startIndex = params.startRow;

                        const queryKey = queryKeys.playlists.songList(
                            server?.id || '',
                            playlistId,
                            {
                                id: playlistId,
                                limit,
                                startIndex,
                                ...filters,
                            },
                        );

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

                        params.successCallback(
                            songsRes?.items || [],
                            songsRes?.totalRecordCount || 0,
                        );
                    },
                    rowCount: undefined,
                };
                tableRef.current?.api.setDatasource(dataSource);
                tableRef.current?.api.purgeInfiniteCache();
                tableRef.current?.api.ensureIndexVisible(0, 'top');
            } else {
                tableRef.current?.api.redrawRows();
                tableRef.current?.api.ensureIndexVisible(0, 'top');
            }

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
        (displayType: ListDisplayType) => {
            setPage({ detail: { ...page, display: displayType } });
        },
        [page, setPage],
    );

    const handleTableColumns = (values: string[]) => {
        const existingColumns = page.table.columns;

        if (values.length === 0) {
            return setTable({
                columns: [],
            });
        }

        // If adding a column
        if (values.length > existingColumns.length) {
            const newColumn = {
                column: values[values.length - 1],
                width: 100,
            } as PersistedTableColumn;

            setTable({ columns: [...existingColumns, newColumn] });
        } else {
            // If removing a column
            const removed = existingColumns.filter((column) => !values.includes(column.column));
            const newColumns = existingColumns.filter((column) => !removed.includes(column));

            setTable({ columns: newColumns });
        }

        return tableRef.current?.api.sizeColumnsToFit();
    };

    const handleAutoFitColumns = (autoFitColumns: boolean) => {
        setTable({ autoFit: autoFitColumns });

        if (autoFitColumns) {
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
                gap="sm"
                ref={cq.ref}
                w="100%"
            >
                <DropdownMenu position="bottom-start">
                    <DropdownMenu.Target>
                        <Button
                            tooltip={{
                                label: t('page.playlist.reorder', { postProcess: 'sentenceCase' }),
                            }}
                            variant="subtle"
                        >
                            {sortByLabel}
                        </Button>
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        {FILTERS[server?.type as keyof typeof FILTERS].map((filter) => (
                            <DropdownMenu.Item
                                isSelected={filter.value === filters.sortBy}
                                key={`filter-${filter.name}`}
                                onClick={handleSetSortBy}
                                value={filter.value}
                            >
                                {filter.name}
                            </DropdownMenu.Item>
                        ))}
                    </DropdownMenu.Dropdown>
                </DropdownMenu>

                <Divider orientation="vertical" />
                <OrderToggleButton
                    onToggle={handleToggleSortOrder}
                    sortOrder={filters.sortOrder || SortOrder.ASC}
                />
                <DropdownMenu position="bottom-start">
                    <DropdownMenu.Target>
                        <MoreButton />
                    </DropdownMenu.Target>
                    <DropdownMenu.Dropdown>
                        <DropdownMenu.Item
                            leftSection={<Icon icon="mediaPlay" />}
                            onClick={() => handlePlay(Play.NOW)}
                        >
                            {t('player.play', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            leftSection={<Icon icon="mediaPlayLast" />}
                            onClick={() => handlePlay(Play.LAST)}
                        >
                            {t('player.addLast', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Item
                            leftSection={<Icon icon="mediaPlayNext" />}
                            onClick={() => handlePlay(Play.NEXT)}
                        >
                            {t('player.addNext', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Divider />
                        <DropdownMenu.Item
                            leftSection={<Icon icon="edit" />}
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
                            leftSection={<Icon icon="delete" />}
                            onClick={openDeletePlaylistModal}
                        >
                            {t('action.deletePlaylist', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Item>
                        <DropdownMenu.Divider />
                        <DropdownMenu.Item
                            leftSection={<Icon icon="refresh" />}
                            onClick={handleRefresh}
                        >
                            {t('action.refresh', { postProcess: 'sentenceCase' })}
                        </DropdownMenu.Item>
                        {server?.type === ServerType.NAVIDROME && !isSmartPlaylist && (
                            <>
                                <DropdownMenu.Divider />
                                <DropdownMenu.Item
                                    isDanger
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
                <ListConfigMenu
                    autoFitColumns={page.table.autoFit}
                    disabledViewTypes={[ListDisplayType.GRID, ListDisplayType.LIST]}
                    displayType={page.display}
                    itemSize={page.table.rowHeight}
                    onChangeAutoFitColumns={handleAutoFitColumns}
                    onChangeDisplayType={handleSetViewType}
                    onChangeItemSize={debouncedHandleItemSize}
                    onChangeTableColumns={handleTableColumns}
                    tableColumns={page.table.columns.map((column) => column.column)}
                    tableColumnsData={SONG_TABLE_COLUMNS}
                />
            </Group>
        </Flex>
    );
};
