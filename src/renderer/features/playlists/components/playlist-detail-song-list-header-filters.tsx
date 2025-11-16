import { closeAllModals, openModal } from '@mantine/modals';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import debounce from 'lodash/debounce';
import { ChangeEvent, MouseEvent, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';

import i18n from '/@/i18n/i18n';
import { queryKeys } from '/@/renderer/api/query-keys';
import { playlistsQueries } from '/@/renderer/features/playlists/api/playlists-api';
import { openUpdatePlaylistModal } from '/@/renderer/features/playlists/components/update-playlist-form';
import { useDeletePlaylist } from '/@/renderer/features/playlists/mutations/delete-playlist-mutation';
import { MoreButton } from '/@/renderer/features/shared/components/more-button';
import { OrderToggleButton } from '/@/renderer/features/shared/components/order-toggle-button';
import { SearchInput } from '/@/renderer/features/shared/components/search-input';
import { useContainerQuery } from '/@/renderer/hooks';
import { AppRoute } from '/@/renderer/router/routes';
import {
    useCurrentServer,
    usePlaylistDetailStore,
    useSetPlaylistDetailFilters,
    useSetPlaylistStore,
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
import { ServerType, SongListSort, SortOrder } from '/@/shared/types/domain-types';
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
            name: i18n.t('filter.releaseYear', { postProcess: 'titleCase' }),
            value: SongListSort.YEAR,
        },
    ],
};

interface PlaylistDetailSongListHeaderFiltersProps {
    handlePlay: (playType: Play) => void;
    handleToggleShowQueryBuilder: () => void;
    tableRef: any;
}

export const PlaylistDetailSongListHeaderFilters = ({
    handlePlay,
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
    const searchTerm = page?.table.id[playlistId]?.filter?.searchTerm;
    const sortBy = page?.table.id[playlistId]?.filter?.sortBy || SongListSort.ID;
    const sortOrder = page?.table.id[playlistId]?.filter?.sortOrder || SortOrder.ASC;

    const detailQuery = useQuery(
        playlistsQueries.detail({ query: { id: playlistId }, serverId: server?.id }),
    );
    const isSmartPlaylist = detailQuery.data?.rules;

    const cq = useContainerQuery();

    const sortByLabel =
        (server?.type &&
            FILTERS[server.type as keyof typeof FILTERS].find((f) => f.value === sortBy)?.name) ||
        'Unknown';

    const handleFilterChange = useCallback(async () => {
        // tableRef.current?.api.redrawRows();
        // tableRef.current?.api.ensureIndexVisible(0, 'top');
        // if (page.display === ListDisplayType.TABLE) {
        //     setPagination({ data: { currentPage: 0 } });
        // }
    }, []);

    const handleRefresh = () => {
        queryClient.invalidateQueries({
            queryKey: queryKeys.playlists.songList(server?.id || '', playlistId),
        });
    };

    const handleSetSortBy = useCallback((e: MouseEvent<HTMLButtonElement>) => {}, []);

    const handleToggleSortOrder = useCallback(() => {}, [
        sortOrder,
        handleFilterChange,
        playlistId,
        setFilter,
    ]);

    const handleSearch = debounce((e: ChangeEvent<HTMLInputElement>) => {}, 500);

    const handleSetViewType = useCallback((displayType: ListDisplayType) => {}, [page, setPage]);

    const deletePlaylistMutation = useDeletePlaylist({});

    const handleDeletePlaylist = useCallback(() => {
        if (!detailQuery.data) return;
        deletePlaylistMutation?.mutate(
            {
                apiClientProps: { serverId: detailQuery.data._serverId },
                query: { id: detailQuery.data.id },
            },
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
            <Group gap="sm" ref={cq.ref} w="100%">
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
                                isSelected={filter.value === sortBy}
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
                    sortOrder={sortOrder || SortOrder.ASC}
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
                                <DropdownMenu.Item isDanger onClick={handleToggleShowQueryBuilder}>
                                    {t('action.toggleSmartPlaylistEditor', {
                                        postProcess: 'sentenceCase',
                                    })}
                                </DropdownMenu.Item>
                            </>
                        )}
                    </DropdownMenu.Dropdown>
                </DropdownMenu>
                <SearchInput defaultValue={searchTerm} onChange={handleSearch} />
            </Group>
            <Group></Group>
        </Flex>
    );
};
