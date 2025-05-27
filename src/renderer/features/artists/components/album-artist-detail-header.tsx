import { forwardRef, Fragment, Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import { useAlbumArtistDetail } from '/@/renderer/features/artists/queries/album-artist-detail-query';
import { LibraryHeader, useSetRating } from '/@/renderer/features/shared';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { formatDurationString } from '/@/renderer/utils';
import { Group } from '/@/shared/components/group/group';
import { Rating } from '/@/shared/components/rating/rating';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem, ServerType } from '/@/shared/types/domain-types';

interface AlbumArtistDetailHeaderProps {
    background?: string;
    loading: boolean;
}

export const AlbumArtistDetailHeader = forwardRef(
    ({ background, loading }: AlbumArtistDetailHeaderProps, ref: Ref<HTMLDivElement>) => {
        const { albumArtistId, artistId } = useParams() as {
            albumArtistId?: string;
            artistId?: string;
        };
        const routeId = (artistId || albumArtistId) as string;
        const server = useCurrentServer();
        const { t } = useTranslation();
        const detailQuery = useAlbumArtistDetail({
            query: { id: routeId },
            serverId: server?.id,
        });

        const albumCount = detailQuery?.data?.albumCount;
        const songCount = detailQuery?.data?.songCount;
        const duration = detailQuery?.data?.duration;
        const durationEnabled = duration !== null && duration !== undefined;

        const metadataItems = [
            {
                enabled: albumCount !== null && albumCount !== undefined,
                id: 'albumCount',
                secondary: false,
                value: t('entity.albumWithCount', { count: albumCount || 0 }),
            },
            {
                enabled: songCount !== null && songCount !== undefined,
                id: 'songCount',
                secondary: false,
                value: t('entity.trackWithCount', { count: songCount || 0 }),
            },
            {
                enabled: durationEnabled,
                id: 'duration',
                secondary: true,
                value: durationEnabled && formatDurationString(duration),
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
                serverId: detailQuery?.data.serverId,
            });
        };

        const showRating = detailQuery?.data?.serverType === ServerType.NAVIDROME;

        return (
            <LibraryHeader
                background={background}
                imageUrl={detailQuery?.data?.imageUrl}
                item={{ route: AppRoute.LIBRARY_ALBUM_ARTISTS, type: LibraryItem.ALBUM_ARTIST }}
                loading={loading}
                ref={ref}
                title={detailQuery?.data?.name || ''}
            >
                <Stack>
                    <Group>
                        {metadataItems
                            .filter((i) => i.enabled)
                            .map((item, index) => (
                                <Fragment key={`item-${item.id}-${index}`}>
                                    {index > 0 && <Text isNoSelect>•</Text>}
                                    <Text isMuted={item.secondary}>{item.value}</Text>
                                </Fragment>
                            ))}
                        {showRating && (
                            <>
                                <Text isNoSelect>•</Text>
                                <Rating
                                    onChange={handleUpdateRating}
                                    readOnly={
                                        detailQuery?.isFetching || updateRatingMutation.isLoading
                                    }
                                    value={detailQuery?.data?.userRating || 0}
                                />
                            </>
                        )}
                    </Group>
                </Stack>
            </LibraryHeader>
        );
    },
);
