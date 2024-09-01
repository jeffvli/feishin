import { forwardRef, Fragment, Ref } from 'react';
import { Group, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { generatePath, useParams } from 'react-router';
import { Link } from 'react-router-dom';
import { LibraryItem, ServerType } from '/@/renderer/api/types';
import { Rating, Text } from '/@/renderer/components';
import { useAlbumDetail } from '/@/renderer/features/albums/queries/album-detail-query';
import { LibraryHeader, useSetRating } from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { formatDateAbsolute, formatDurationString } from '/@/renderer/utils';

interface AlbumDetailHeaderProps {
    background: {
        background: string;
        blur: number;
    };
}

export const AlbumDetailHeader = forwardRef(
    ({ background }: AlbumDetailHeaderProps, ref: Ref<HTMLDivElement>) => {
        const { albumId } = useParams() as { albumId: string };
        const server = useCurrentServer();
        const detailQuery = useAlbumDetail({ query: { id: albumId }, serverId: server?.id });
        const cq = useContainerQuery();
        const { t } = useTranslation();

        const originalDifferentFromRelease =
            detailQuery.data?.originalDate &&
            detailQuery.data.originalDate !== detailQuery.data.releaseDate;

        const releasePrefix = originalDifferentFromRelease
            ? t('page.albumDetail.released', { postProcess: 'sentenceCase' })
            : '♫';

        const metadataItems = [
            {
                id: 'releaseDate',
                value:
                    detailQuery?.data?.releaseDate &&
                    `${releasePrefix} ${formatDateAbsolute(detailQuery?.data?.releaseDate)}`,
            },
            {
                id: 'songCount',
                value: `${detailQuery?.data?.songCount} songs`,
            },
            {
                id: 'duration',
                value:
                    detailQuery?.data?.duration && formatDurationString(detailQuery.data.duration),
            },
        ];

        if (originalDifferentFromRelease) {
            const formatted = `♫ ${formatDateAbsolute(detailQuery!.data!.originalDate)}`;
            metadataItems.splice(0, 0, {
                id: 'originalDate',
                value: formatted,
            });
        }

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

        const showRating = detailQuery?.data?.serverType === ServerType.NAVIDROME;

        return (
            <Stack ref={cq.ref}>
                <LibraryHeader
                    ref={ref}
                    imageUrl={detailQuery?.data?.imageUrl}
                    item={{ route: AppRoute.LIBRARY_ALBUMS, type: LibraryItem.ALBUM }}
                    title={detailQuery?.data?.name || ''}
                    {...background}
                >
                    <Stack spacing="sm">
                        <Group spacing="sm">
                            {metadataItems.map((item, index) => (
                                <Fragment key={`item-${item.id}-${index}`}>
                                    {index > 0 && <Text $noSelect>•</Text>}
                                    <Text>{item.value}</Text>
                                </Fragment>
                            ))}
                            {showRating && (
                                <>
                                    <Text $noSelect>•</Text>
                                    <Rating
                                        readOnly={
                                            detailQuery?.isFetching ||
                                            updateRatingMutation.isLoading
                                        }
                                        value={detailQuery?.data?.userRating || 0}
                                        onChange={handleUpdateRating}
                                    />
                                </>
                            )}
                        </Group>
                        <Group
                            mah="4rem"
                            spacing="md"
                            sx={{
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 2,
                                overflow: 'hidden',
                            }}
                        >
                            {detailQuery?.data?.albumArtists.map((artist) => (
                                <Text
                                    key={`artist-${artist.id}`}
                                    $link
                                    component={Link}
                                    fw={600}
                                    to={generatePath(AppRoute.LIBRARY_ALBUM_ARTISTS_DETAIL, {
                                        albumArtistId: artist.id,
                                    })}
                                    variant="subtle"
                                >
                                    {artist.name}
                                </Text>
                            ))}
                        </Group>
                    </Stack>
                </LibraryHeader>
            </Stack>
        );
    },
);
