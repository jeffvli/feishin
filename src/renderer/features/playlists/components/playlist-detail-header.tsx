import { Group, Stack } from '@mantine/core';
import { closeAllModals, openModal } from '@mantine/modals';
import { forwardRef, Ref } from 'react';
import { RiMoreFill } from 'react-icons/ri';
import { generatePath, useNavigate, useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { DropdownMenu, Button, ConfirmModal, toast } from '/@/renderer/components';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { UpdatePlaylistForm } from './update-playlist-form';
import { useDeletePlaylist } from '/@/renderer/features/playlists/mutations/delete-playlist-mutation';
import { usePlaylistDetail } from '/@/renderer/features/playlists/queries/playlist-detail-query';
import { LibraryHeader, PlayButton, PLAY_TYPES } from '/@/renderer/features/shared';
import { AppRoute } from '/@/renderer/router/routes';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { LibraryItem, Play } from '/@/renderer/types';

interface PlaylistDetailHeaderProps {
  background: string;
  imagePlaceholderUrl?: string | null;
  imageUrl?: string | null;
}

export const PlaylistDetailHeader = forwardRef(
  (
    { background, imageUrl, imagePlaceholderUrl }: PlaylistDetailHeaderProps,
    ref: Ref<HTMLDivElement>,
  ) => {
    const navigate = useNavigate();
    const { playlistId } = useParams() as { playlistId: string };
    const detailQuery = usePlaylistDetail({ id: playlistId });
    const handlePlayQueueAdd = usePlayQueueAdd();
    const playButtonBehavior = usePlayButtonBehavior();

    const handlePlay = (playType?: Play) => {
      handlePlayQueueAdd?.({
        byItemType: {
          id: [playlistId],
          type: LibraryItem.PLAYLIST,
        },
        play: playType || playButtonBehavior,
      });
    };

    const openUpdatePlaylistModal = () => {
      openModal({
        children: (
          <UpdatePlaylistForm
            body={{
              comment: detailQuery?.data?.description || undefined,
              name: detailQuery?.data?.name,
              public: detailQuery?.data?.public || false,
              rules: detailQuery?.data?.rules || undefined,
            }}
            query={{ id: playlistId }}
            onCancel={closeAllModals}
          />
        ),
        title: 'Edit playlist',
      });
    };

    const deletePlaylistMutation = useDeletePlaylist();

    const handleDeletePlaylist = () => {
      deletePlaylistMutation.mutate(
        { query: { id: playlistId } },
        {
          onError: (err) => {
            toast.error({
              message: err.message,
              title: 'Error deleting playlist',
            });
          },
          onSuccess: () => {
            toast.success({
              message: `${detailQuery?.data?.name} was successfully deleted`,
              title: 'Playlist deleted',
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

    return (
      <Stack>
        <LibraryHeader
          ref={ref}
          background={background}
          imagePlaceholderUrl={imagePlaceholderUrl}
          imageUrl={imageUrl}
          item={{ route: AppRoute.PLAYLISTS, type: LibraryItem.PLAYLIST }}
          title={detailQuery?.data?.name || ''}
        >
          <Group>
            <Button
              compact
              component={Link}
              to={generatePath(AppRoute.PLAYLISTS_DETAIL_SONGS, { playlistId })}
              variant="subtle"
            >
              View full playlist
            </Button>
          </Group>
        </LibraryHeader>
        <Group
          maw="1920px"
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
                <DropdownMenu.Item onClick={openUpdatePlaylistModal}>
                  Edit playlist
                </DropdownMenu.Item>
                <DropdownMenu.Item onClick={openDeletePlaylist}>Delete playlist</DropdownMenu.Item>
              </DropdownMenu.Dropdown>
            </DropdownMenu>
          </Group>
        </Group>
      </Stack>
    );
  },
);
