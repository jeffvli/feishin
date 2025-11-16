import { useQuery } from '@tanstack/react-query';
import { forwardRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, Link, useParams } from 'react-router';

import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { LibraryHeader } from '/@/renderer/features/shared/components/library-header';
import { useSetRating } from '/@/renderer/features/shared/mutations/set-rating-mutation';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { formatDateAbsoluteUTC, formatDurationString, titleCase } from '/@/renderer/utils';
import { normalizeReleaseTypes } from '/@/renderer/utils/normalize-release-types';
import { Group } from '/@/shared/components/group/group';
import { Pill } from '/@/shared/components/pill/pill';
import { Rating } from '/@/shared/components/rating/rating';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem, ServerType } from '/@/shared/types/domain-types';

interface AlbumDetailHeaderProps {
    background: {
        background?: string;
        blur: number;
        loading: boolean;
    };
}

export const AlbumDetailHeader = forwardRef<HTMLDivElement, AlbumDetailHeaderProps>(
    ({ background }, ref) => {
        const { albumId } = useParams() as { albumId: string };
        const server = useCurrentServer();
        const detailQuery = useQuery(
            albumQueries.detail({ query: { id: albumId }, serverId: server?.id }),
        );
        const { t } = useTranslation();

        const showRating =
            detailQuery?.data?._serverType === ServerType.NAVIDROME ||
            detailQuery?.data?._serverType === ServerType.SUBSONIC;

        const originalDifferentFromRelease =
            detailQuery.data?.originalDate &&
            detailQuery.data.originalDate !== detailQuery.data.releaseDate;

        const releasePrefix = originalDifferentFromRelease
            ? t('page.albumDetail.released', { postProcess: 'sentenceCase' })
            : '♫';

        const releaseTypes = useMemo(
            () =>
                normalizeReleaseTypes(detailQuery.data?.releaseTypes ?? [], t).map((type) => ({
                    id: type,
                    value: titleCase(type),
                })) || [],
            [detailQuery.data?.releaseTypes, t],
        );

        const metadataItems = releaseTypes.concat([
            {
                id: 'releaseDate',
                value:
                    detailQuery?.data?.releaseDate &&
                    `${releasePrefix} ${formatDateAbsoluteUTC(detailQuery?.data?.releaseDate)}`,
            },
            {
                id: 'songCount',
                value: t('entity.trackWithCount', {
                    count: detailQuery?.data?.songCount as number,
                }),
            },
            {
                id: 'duration',
                value:
                    detailQuery?.data?.duration && formatDurationString(detailQuery.data.duration),
            },
            {
                id: 'playCount',
                value:
                    typeof detailQuery?.data?.playCount === 'number' &&
                    t('entity.play', {
                        count: detailQuery?.data?.playCount,
                    }),
            },
            {
                id: 'version',
                value: detailQuery.data?.version,
            },
        ]);

        if (originalDifferentFromRelease) {
            const formatted = `♫ ${formatDateAbsoluteUTC(detailQuery!.data!.originalDate)}`;
            metadataItems.splice(0, 0, {
                id: 'originalDate',
                value: formatted,
            });
        }

        const updateRatingMutation = useSetRating({});

        const handleUpdateRating = (rating: number) => {
            if (!detailQuery?.data) return;

            updateRatingMutation.mutate({
                apiClientProps: { serverId: detailQuery.data._serverId },
                query: {
                    id: [detailQuery.data.id],
                    rating,
                    type: LibraryItem.ALBUM,
                },
            });
        };

        return (
            <Stack ref={ref}>
                <LibraryHeader
                    imageUrl={detailQuery?.data?.imageUrl}
                    item={{ route: AppRoute.LIBRARY_ALBUMS, type: LibraryItem.ALBUM }}
                    title={detailQuery?.data?.name || ''}
                    {...background}
                >
                    <Stack gap="lg">
                        <Pill.Group>
                            {metadataItems.map(
                                (item, index) =>
                                    item.value && (
                                        <Pill key={`item-${item.id}-${index}`}>{item.value}</Pill>
                                    ),
                            )}
                        </Pill.Group>
                        {showRating && (
                            <Rating
                                onChange={handleUpdateRating}
                                readOnly={detailQuery?.isFetching || updateRatingMutation.isPending}
                                value={detailQuery?.data?.userRating || 0}
                            />
                        )}
                        <Group
                            gap="md"
                            mah="4rem"
                            style={{
                                overflow: 'hidden',
                                WebkitBoxOrient: 'vertical',
                                WebkitLineClamp: 2,
                            }}
                        >
                            {detailQuery?.data?.albumArtists.map((artist) => (
                                <Text
                                    component={Link}
                                    fw={600}
                                    isLink
                                    key={`artist-${artist.id}`}
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
