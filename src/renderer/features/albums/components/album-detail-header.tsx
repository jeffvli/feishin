import { Group, Stack } from '@mantine/core';
import { forwardRef, Fragment, Ref } from 'react';
import { generatePath, useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { LibraryItem, ServerType } from '/@/renderer/api/types';
import { Button, Rating, Text } from '/@/renderer/components';
import { useAlbumDetail } from '/@/renderer/features/albums/queries/album-detail-query';
import { LibraryHeader, useSetRating } from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { formatDurationString } from '/@/renderer/utils';

interface AlbumDetailHeaderProps {
  background: string;
}

export const AlbumDetailHeader = forwardRef(
  ({ background }: AlbumDetailHeaderProps, ref: Ref<HTMLDivElement>) => {
    const { albumId } = useParams() as { albumId: string };
    const server = useCurrentServer();
    const detailQuery = useAlbumDetail({ query: { id: albumId }, serverId: server?.id });
    const cq = useContainerQuery();

    const metadataItems = [
      {
        id: 'releaseYear',
        secondary: false,
        value: detailQuery?.data?.releaseYear,
      },
      {
        id: 'songCount',
        secondary: false,
        value: `${detailQuery?.data?.songCount} songs`,
      },
      {
        id: 'duration',
        secondary: true,
        value: detailQuery?.data?.duration && formatDurationString(detailQuery.data.duration),
      },
    ];

    const updateRatingMutation = useSetRating({});

    const handleUpdateRating = (rating: number) => {
      if (!detailQuery?.data) return;

      updateRatingMutation.mutate({
        query: {
          item: [detailQuery.data],
          rating,
        },
        serverId: detailQuery.data.serverId,
      });
    };

    const handleClearRating = () => {
      if (!detailQuery?.data || !detailQuery?.data.userRating) return;

      updateRatingMutation.mutate({
        query: {
          item: [detailQuery.data],
          rating: 0,
        },
        serverId: detailQuery.data.serverId,
      });
    };

    const showRating = detailQuery?.data?.serverType === ServerType.NAVIDROME;

    return (
      <Stack ref={cq.ref}>
        <LibraryHeader
          ref={ref}
          background={background}
          imageUrl={detailQuery?.data?.imageUrl}
          item={{ route: AppRoute.LIBRARY_ALBUMS, type: LibraryItem.ALBUM }}
          title={detailQuery?.data?.name || ''}
        >
          <Stack spacing="sm">
            <Group spacing="sm">
              {metadataItems.map((item, index) => (
                <Fragment key={`item-${item.id}-${index}`}>
                  {index > 0 && <Text $noSelect>•</Text>}
                  <Text $secondary={item.secondary}>{item.value}</Text>
                </Fragment>
              ))}
              {showRating && (
                <>
                  <Text $noSelect>•</Text>
                  <Rating
                    readOnly={detailQuery?.isFetching || updateRatingMutation.isLoading}
                    value={detailQuery?.data?.userRating || 0}
                    onChange={handleUpdateRating}
                    onClick={handleClearRating}
                  />
                </>
              )}
            </Group>
            <Group
              spacing="sm"
              sx={{
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
                display: '-webkit-box',
                overflow: 'hidden',
              }}
            >
              {detailQuery?.data?.albumArtists.map((artist) => (
                <Button
                  key={`artist-${artist.id}`}
                  component={Link}
                  size="sm"
                  to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                    albumArtistId: artist.id,
                  })}
                  variant="outline"
                >
                  {artist.name}
                </Button>
              ))}
            </Group>
          </Stack>
        </LibraryHeader>
      </Stack>
    );
  },
);
