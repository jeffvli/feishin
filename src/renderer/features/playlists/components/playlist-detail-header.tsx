import { forwardRef, Fragment, Ref } from 'react';
import { Group, Stack } from '@mantine/core';
import { useParams } from 'react-router';
import { Badge, Text } from '/@/renderer/components';
import { usePlaylistDetail } from '/@/renderer/features/playlists/queries/playlist-detail-query';
import { LibraryHeader } from '/@/renderer/features/shared';
import { AppRoute } from '/@/renderer/router/routes';
import { formatDurationString } from '/@/renderer/utils';
import { LibraryItem } from '/@/renderer/api/types';
import { useCurrentServer } from '../../../store/auth.store';

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
    const { playlistId } = useParams() as { playlistId: string };
    const server = useCurrentServer();
    const detailQuery = usePlaylistDetail({ query: { id: playlistId }, serverId: server?.id });

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

    const isSmartPlaylist = detailQuery?.data?.rules;

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
          <Stack>
            <Group spacing="sm">
              {metadataItems.map((item, index) => (
                <Fragment key={`item-${item.id}-${index}`}>
                  {index > 0 && <Text $noSelect>•</Text>}
                  <Text $secondary={item.secondary}>{item.value}</Text>
                </Fragment>
              ))}
              {isSmartPlaylist && (
                <>
                  <Text $noSelect>•</Text>
                  <Badge
                    radius="sm"
                    size="md"
                  >
                    Smart Playlist
                  </Badge>
                </>
              )}
            </Group>
            <Text lineClamp={3}>{detailQuery?.data?.description}</Text>
          </Stack>
        </LibraryHeader>
      </Stack>
    );
  },
);
