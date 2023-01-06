import { forwardRef, Fragment, Ref } from 'react';
import { Group, Stack } from '@mantine/core';
import { closeAllModals, openModal } from '@mantine/modals';
import { useQueryClient } from '@tanstack/react-query';
import { RiMoreFill } from 'react-icons/ri';
import { generatePath, useNavigate, useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { DropdownMenu, Button, ConfirmModal, toast, Text } from '/@/renderer/components';
import { usePlayQueueAdd } from '/@/renderer/features/player';
import { UpdatePlaylistForm } from './update-playlist-form';
import { useDeletePlaylist } from '/@/renderer/features/playlists/mutations/delete-playlist-mutation';
import { usePlaylistDetail } from '/@/renderer/features/playlists/queries/playlist-detail-query';
import { LibraryHeader, PlayButton, PLAY_TYPES } from '/@/renderer/features/shared';
import { AppRoute } from '/@/renderer/router/routes';
import { usePlayButtonBehavior } from '/@/renderer/store/settings.store';
import { Play } from '/@/renderer/types';
import { formatDurationString } from '/@/renderer/utils';
import { UserListSort, SortOrder, UserListQuery, LibraryItem } from '/@/renderer/api/types';
import { useCurrentServer } from '/@/renderer/store';
import { api } from '/@/renderer/api';
import { queryKeys } from '/@/renderer/api/query-keys';

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
    const queryClient = useQueryClient();
    const { playlistId } = useParams() as { playlistId: string };
    const detailQuery = usePlaylistDetail({ id: playlistId });
    const handlePlayQueueAdd = usePlayQueueAdd();
    const playButtonBehavior = usePlayButtonBehavior();
    const server = useCurrentServer();

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

      const users = await queryClient.fetchQuery({
        queryFn: ({ signal }) => api.controller.getUserList({ query, server, signal }),
        queryKey: queryKeys.users.list(server?.id || '', query),
      });

      const normalizedUsers = api.normalize.userList(users, server);

      openModal({
        children: (
          <UpdatePlaylistForm
            body={{
              comment: detailQuery?.data?.description || undefined,
              genres: detailQuery?.data?.genres,
              name: detailQuery?.data?.name,
              ndParams: {
                owner: detailQuery?.data?.owner || undefined,
                ownerId: detailQuery?.data?.ownerId || undefined,
                public: detailQuery?.data?.public || false,
                rules: detailQuery?.data?.rules || undefined,
                sync: detailQuery?.data?.sync || undefined,
              },
            }}
            query={{ id: playlistId }}
            users={normalizedUsers.items}
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

    const metadataItems = [
      {
        id: 'songCount',
        secondary: false,
        value: `${detailQuery?.data?.songCount || 0} songs`,
      },
      {
        id: 'duration',
        secondary: true,
        value: detailQuery?.data?.duration && formatDurationString(detailQuery.data.duration),
      },
    ];

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
          <Stack mt="1rem">
            <Group>
              {metadataItems.map((item, index) => (
                <Fragment key={`item-${item.id}-${index}`}>
                  {index > 0 && <Text $noSelect>•</Text>}
                  <Text $secondary={item.secondary}>{item.value}</Text>
                </Fragment>
              ))}
            </Group>
            <Text lineClamp={3}>{detailQuery?.data?.description}</Text>
          </Stack>
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

            <Button
              compact
              component={Link}
              to={generatePath(AppRoute.PLAYLISTS_DETAIL_SONGS, { playlistId })}
              variant="subtle"
            >
              View full playlist
            </Button>
          </Group>
        </Group>
      </Stack>
    );
  },
);
