import { ColDef, RowDoubleClickedEvent } from '@ag-grid-community/core';
import type { AgGridReact as AgGridReactType } from '@ag-grid-community/react/lib/agGridReact';
import { Box, Group } from '@mantine/core';
import { closeAllModals, openModal } from '@mantine/modals';
import { useQueryClient } from '@tanstack/react-query';
import { MutableRefObject, useMemo, useRef } from 'react';
import { RiMoreFill } from 'react-icons/ri';
import { generatePath, useNavigate, useParams } from 'react-router';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';
import {
  LibraryItem,
  QueueSong,
  SortOrder,
  UserListQuery,
  UserListSort,
} from '/@/renderer/api/types';
import { Button, ConfirmModal, DropdownMenu, MotionGroup, toast } from '/@/renderer/components';
import {
  getColumnDefs,
  useFixedTableHeader,
  VirtualTable,
} from '/@/renderer/components/virtual-table';
import { useHandleTableContextMenu } from '/@/renderer/features/context-menu';
import {
  PLAYLIST_SONG_CONTEXT_MENU_ITEMS,
  SMART_PLAYLIST_SONG_CONTEXT_MENU_ITEMS,
} from '/@/renderer/features/context-menu/context-menu-items';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { UpdatePlaylistForm } from '/@/renderer/features/playlists/components/update-playlist-form';
import { useDeletePlaylist } from '/@/renderer/features/playlists/mutations/delete-playlist-mutation';
import { usePlaylistDetail } from '/@/renderer/features/playlists/queries/playlist-detail-query';
import { usePlaylistSongListInfinite } from '/@/renderer/features/playlists/queries/playlist-song-list-query';
import { PlayButton, PLAY_TYPES } from '/@/renderer/features/shared';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer, useSongListStore } from '/@/renderer/store';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { Play } from '/@/renderer/types';

const ContentContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 1rem 2rem 5rem;
  overflow: hidden;

  .ag-theme-alpine-dark {
    --ag-header-background-color: rgba(0, 0, 0, 0%) !important;
  }

  .ag-header {
    margin-bottom: 0.5rem;
  }
`;

interface PlaylistDetailContentProps {
  tableRef: MutableRefObject<AgGridReactType | null>;
}

export const PlaylistDetailContent = ({ tableRef }: PlaylistDetailContentProps) => {
  const navigate = useNavigate();
  const { playlistId } = useParams() as { playlistId: string };
  const page = useSongListStore();
  const handlePlayQueueAdd = usePlayQueueAdd();
  const server = useCurrentServer();
  const detailQuery = usePlaylistDetail({ query: { id: playlistId }, serverId: server?.id });
  const playButtonBehavior = usePlayButtonBehavior();
  const queryClient = useQueryClient();

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
      getColumnDefs(page.table.columns).filter((c) => c.colId !== 'album' && c.colId !== 'artist'),
    [page.table.columns],
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

  const { intersectRef, tableContainerRef } = useFixedTableHeader();

  const deletePlaylistMutation = useDeletePlaylist({});

  const handleDeletePlaylist = () => {
    deletePlaylistMutation.mutate(
      { query: { id: playlistId }, serverId: server?.id },
      {
        onError: (err) => {
          toast.error({
            message: err.message,
            title: 'Error deleting playlist',
          });
        },
        onSuccess: () => {
          toast.success({
            message: `Playlist has been deleted`,
          });
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
      title: 'Delete playlist',
    });
  };

  const handlePlay = (playType?: Play) => {
    handlePlayQueueAdd?.({
      byItemType: {
        id: [playlistId],
        type: LibraryItem.PLAYLIST,
      },
      play: playType || playButtonBehavior,
    });
  };

  const openUpdatePlaylistModal = async () => {
    const query: UserListQuery = {
      sortBy: UserListSort.NAME,
      sortOrder: SortOrder.ASC,
      startIndex: 0,
    };

    if (!server) return;

    const users = await queryClient.fetchQuery({
      queryFn: ({ signal }) =>
        api.controller.getUserList({ apiClientProps: { server, signal }, query }),
      queryKey: queryKeys.users.list(server?.id || '', query),
    });

    openModal({
      children: (
        <UpdatePlaylistForm
          body={{
            _custom: {
              navidrome: {
                owner: detailQuery?.data?.owner || undefined,
                ownerId: detailQuery?.data?.ownerId || undefined,
                public: detailQuery?.data?.public || false,
                rules: detailQuery?.data?.rules || undefined,
                sync: detailQuery?.data?.sync || undefined,
              },
            },
            comment: detailQuery?.data?.description || undefined,
            genres: detailQuery?.data?.genres,
            name: detailQuery?.data?.name,
          }}
          query={{ id: playlistId }}
          users={users?.items}
          onCancel={closeAllModals}
        />
      ),
      title: 'Edit playlist',
    });
  };

  const handleRowDoubleClick = (e: RowDoubleClickedEvent<QueueSong>) => {
    if (!e.data) return;
    handlePlayQueueAdd?.({
      byData: [e.data],
      play: playButtonBehavior,
    });
  };

  const loadMoreRef = useRef<HTMLButtonElement | null>(null);

  return (
    <ContentContainer>
      <Group
        ref={intersectRef}
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
              {PLAY_TYPES.filter((type) => type.play !== playButtonBehavior).map((type) => (
                <DropdownMenu.Item
                  key={`playtype-${type.play}`}
                  onClick={() => handlePlay(type.play)}
                >
                  {type.label}
                </DropdownMenu.Item>
              ))}
              <DropdownMenu.Divider />
              <DropdownMenu.Item onClick={openUpdatePlaylistModal}>Edit playlist</DropdownMenu.Item>
              <DropdownMenu.Item onClick={openDeletePlaylist}>Delete playlist</DropdownMenu.Item>
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
      <Box ref={tableContainerRef}>
        <VirtualTable
          ref={tableRef}
          autoFitColumns
          autoHeight
          deselectOnClickOutside
          suppressCellFocus
          suppressHorizontalScroll
          suppressLoadingOverlay
          suppressRowDrag
          columnDefs={columnDefs}
          getRowId={(data) => {
            // It's possible that there are duplicate song ids in a playlist
            return `${data.data.id}-${data.data.pageIndex}`;
          }}
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
