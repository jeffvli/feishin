import { Group, Stack } from '@mantine/core';
import { RiMoreFill } from 'react-icons/ri';
import { generatePath, useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { DropdownMenu, Button } from '/@/renderer/components';
import { usePlayQueueAdd } from '/@/renderer/features/player';
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

export const PlaylistDetailHeader = ({
  background,
  imageUrl,
  imagePlaceholderUrl,
}: PlaylistDetailHeaderProps) => {
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

  return (
    <Stack>
      <LibraryHeader
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
              <DropdownMenu.Item disabled>Edit playlist</DropdownMenu.Item>
            </DropdownMenu.Dropdown>
          </DropdownMenu>
        </Group>
      </Group>
    </Stack>
  );
};
