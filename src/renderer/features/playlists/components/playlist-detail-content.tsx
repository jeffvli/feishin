import { MutableRefObject, useMemo, useRef } from 'react';
import { ColDef, RowDoubleClickedEvent } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Box, Group } from '@mantine/core';
import { closeAllModals, openModal } from '@mantine/modals';
import { useTranslation } from 'react-i18next';
import { RiMoreFill } from 'react-icons/ri';
import { generatePath, useNavigate, useParams } from 'react-router';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useListStoreByKey } from '../../../store/list.store';
import { LibraryItem, QueueSong } from '/@/renderer/api/types';
import { Button, ConfirmModal, DropdownMenu, MotionGroup, toast } from '/@/renderer/components';
import { getColumnDefs, VirtualTable } from '/@/renderer/components/virtual-table';
import { useCurrentSongRowStyles } from '/@/renderer/components/virtual-table/hooks/use-current-song-row-styles';
import { useHandleTableContextMenu } from '/@/renderer/features/context-menu';
import {
    PLAYLIST_SONG_CONTEXT_MENU_ITEMS,
    SMART_PLAYLIST_SONG_CONTEXT_MENU_ITEMS,
} from '/@/renderer/features/context-menu/context-menu-items';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { openUpdatePlaylistModal } from '/@/renderer/features/playlists/components/update-playlist-form';
import { useDeletePlaylist } from '/@/renderer/features/playlists/mutations/delete-playlist-mutation';
import { usePlaylistDetail } from '/@/renderer/features/playlists/queries/playlist-detail-query';
import { usePlaylistSongListInfinite } from '/@/renderer/features/playlists/queries/playlist-song-list-query';
import { PlayButton, PLAY_TYPES } from '/@/renderer/features/shared';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { Play } from '/@/renderer/types';

const ContentContainer = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 1rem 2rem 5rem;
    overflow: hidden;

    .ag-theme-alpine-dark {
        --ag-header-background-color: rgb(0 0 0 / 0%) !important;
    }
`;

interface PlaylistDetailContentProps {
    tableRef: MutableRefObject<AgGridReactType | null>;
}

export const PlaylistDetailContent = ({ tableRef }: PlaylistDetailContentProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { playlistId } = useParams() as { playlistId: string };
    const { table } = useListStoreByKey({ key: LibraryItem.SONG });
    const handlePlayQueueAdd = usePlayQueueAdd();
    const server = useCurrentServer();
    const detailQuery = usePlaylistDetail({ query: { id: playlistId }, serverId: server?.id });
    const playButtonBehavior = usePlayButtonBehavior();

    const playlistSongsQueryInfinite = usePlaylistSongListInfinite({
        options: {
            cacheTime: 0,
            keepPreviousData: false,
        },
        query: {
            id: playlistId,
            limit: 50,
            startIndex: 0,
        },
        serverId: server?.id,
    });

    const handleLoadMore = () => {
        playlistSongsQueryInfinite.fetchNextPage();
    };

    const columnDefs: ColDef[] = useMemo(
        () =>
            getColumnDefs(table.columns).filter((c) => c.colId !== 'album' && c.colId !== 'artist'),
        [table.columns],
    );

    const contextMenuItems = useMemo(() => {
        if (detailQuery?.data?.rules) {
            return SMART_PLAYLIST_SONG_CONTEXT_MENU_ITEMS;
        }

        return PLAYLIST_SONG_CONTEXT_MENU_ITEMS;
    }, [detailQuery?.data?.rules]);

    const handleContextMenu = useHandleTableContextMenu(LibraryItem.SONG, contextMenuItems, {
        playlistId,
    });

    const playlistSongData = useMemo(
        () => playlistSongsQueryInfinite.data?.pages.flatMap((p) => p?.items),
        [playlistSongsQueryInfinite.data?.pages],
    );

    const deletePlaylistMutation = useDeletePlaylist({});

    const handleDeletePlaylist = () => {
        deletePlaylistMutation.mutate(
            { query: { id: playlistId }, serverId: server?.id },
            {
                onError: (err) => {
                    toast.error({
                        message: err.message,
                        title: t('error.genericError', { postProcess: 'sentenceCase' }),
                    });
                },
                onSuccess: () => {
                    closeAllModals();
                    navigate(AppRoute.PLAYLISTS);
                },
            },
        );
    };

    const openDeletePlaylist = () => {
        openModal({
            children: (
                <ConfirmModal
                    loading={deletePlaylistMutation.isLoading}
                    onConfirm={handleDeletePlaylist}
                >
                    Are you sure you want to delete this playlist?
                </ConfirmModal>
            ),
            title: t('form.deletePlaylist.title', { postProcess: 'sentenceCase' }),
        });
    };

    const handlePlay = (playType?: Play) => {
        handlePlayQueueAdd?.({
            byItemType: {
                id: [playlistId],
                type: LibraryItem.PLAYLIST,
            },
            playType: playType || playButtonBehavior,
        });
    };

    const handleRowDoubleClick = (e: RowDoubleClickedEvent<QueueSong>) => {
        if (!e.data) return;

        handlePlayQueueAdd?.({
            byItemType: {
                id: [playlistId],
                type: LibraryItem.PLAYLIST,
            },
            initialSongId: e.data.id,
            playType: playButtonBehavior,
        });
    };

    const { rowClassRules } = useCurrentSongRowStyles({ tableRef });

    const loadMoreRef = useRef<HTMLButtonElement | null>(null);

    return (
        <ContentContainer>
            <Group
                p="1rem"
                position="apart"
            >
                <Group>
                    <PlayButton onClick={() => handlePlay()} />
                    <DropdownMenu position="bottom-start">
                        <DropdownMenu.Target>
                            <Button
                                compact
                                variant="subtle"
                            >
                                <RiMoreFill size={20} />
                            </Button>
                        </DropdownMenu.Target>
                        <DropdownMenu.Dropdown>
                            {PLAY_TYPES.filter((type) => type.play !== playButtonBehavior).map(
                                (type) => (
                                    <DropdownMenu.Item
                                        key={`playtype-${type.play}`}
                                        onClick={() => handlePlay(type.play)}
                                    >
                                        {type.label}
                                    </DropdownMenu.Item>
                                ),
                            )}
                            <DropdownMenu.Divider />
                            <DropdownMenu.Item
                                onClick={() => {
                                    if (!detailQuery.data || !server) return;
                                    openUpdatePlaylistModal({ playlist: detailQuery.data, server });
                                }}
                            >
                                Edit playlist
                            </DropdownMenu.Item>
                            <DropdownMenu.Item onClick={openDeletePlaylist}>
                                Delete playlist
                            </DropdownMenu.Item>
                        </DropdownMenu.Dropdown>
                    </DropdownMenu>
                    <Button
                        compact
                        uppercase
                        component={Link}
                        to={generatePath(AppRoute.PLAYLISTS_DETAIL_SONGS, { playlistId })}
                        variant="subtle"
                    >
                        View full playlist
                    </Button>
                </Group>
            </Group>
            <Box>
                <VirtualTable
                    ref={tableRef}
                    autoFitColumns
                    autoHeight
                    deselectOnClickOutside
                    shouldUpdateSong
                    stickyHeader
                    suppressCellFocus
                    suppressHorizontalScroll
                    suppressLoadingOverlay
                    suppressRowDrag
                    columnDefs={columnDefs}
                    getRowId={(data) => `${data.data.id}-${data.data.pageIndex}`}
                    rowClassRules={rowClassRules}
                    rowData={playlistSongData}
                    rowHeight={60}
                    rowSelection="multiple"
                    onCellContextMenu={handleContextMenu}
                    onRowDoubleClicked={handleRowDoubleClick}
                />
            </Box>
            <MotionGroup
                p="2rem"
                position="center"
                onViewportEnter={handleLoadMore}
            >
                <Button
                    ref={loadMoreRef}
                    compact
                    disabled={!playlistSongsQueryInfinite.hasNextPage}
                    loading={playlistSongsQueryInfinite.isFetchingNextPage}
                    variant="subtle"
                    onClick={handleLoadMore}
                >
                    {playlistSongsQueryInfinite.hasNextPage ? 'Load more' : 'End of playlist'}
                </Button>
            </MotionGroup>
        </ContentContainer>
    );
};
