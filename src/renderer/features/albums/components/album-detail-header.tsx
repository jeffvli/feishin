import { Group, Stack } from '@mantine/core';
import { forwardRef, Fragment, Ref } from 'react';
import { generatePath, useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { LibraryItem } from '/@/renderer/api/types';
import { Text } from '/@/renderer/components';
import { useAlbumDetail } from '/@/renderer/features/albums/queries/album-detail-query';
import { LibraryHeader } from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';
import { AppRoute } from '/@/renderer/router/routes';
import { formatDurationString } from '/@/renderer/utils';

interface AlbumDetailHeaderProps {
  background: string;
}

export const AlbumDetailHeader = forwardRef(
  ({ background }: AlbumDetailHeaderProps, ref: Ref<HTMLDivElement>) => {
    const { albumId } = useParams() as { albumId: string };
    const detailQuery = useAlbumDetail({ id: albumId });
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
            <Group>
              {metadataItems.map((item, index) => (
                <Fragment key={`item-${item.id}-${index}`}>
                  {index > 0 && <Text $noSelect>•</Text>}
                  <Text $secondary={item.secondary}>{item.value}</Text>
                </Fragment>
              ))}
            </Group>
            <Group
              sx={{
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
                display: '-webkit-box',
                overflow: 'hidden',
              }}
            >
              {detailQuery?.data?.albumArtists.map((artist, index) => (
                <Fragment key={`artist-${artist.id}`}>
                  {index > 0 && (
                    <Text
                      sx={{
                        display: 'inline-block',
                        padding: '0 0.5rem',
                      }}
                    >
                      •
                    </Text>
                  )}
                  <Text
                    $link
                    component={Link}
                    to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                      albumArtistId: artist.id,
                    })}
                    weight={600}
                  >
                    {artist.name}
                  </Text>
                </Fragment>
              ))}
            </Group>
          </Stack>
        </LibraryHeader>
      </Stack>
    );
  },
);
