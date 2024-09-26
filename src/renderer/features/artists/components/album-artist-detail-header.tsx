import { forwardRef, Fragment, Ref } from 'react';
import { Group, Rating, Stack } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { LibraryItem, ServerType } from '/@/renderer/api/types';
import { Text } from '/@/renderer/components';
import { useAlbumArtistDetail } from '/@/renderer/features/artists/queries/album-artist-detail-query';
import { LibraryHeader, useSetRating } from '/@/renderer/features/shared';
import { AppRoute } from '/@/renderer/router/routes';
import { formatDurationString } from '/@/renderer/utils';
import { useCurrentServer } from '../../../store/auth.store';

interface AlbumArtistDetailHeaderProps {
    background: string;
}

export const AlbumArtistDetailHeader = forwardRef(
    ({ background }: AlbumArtistDetailHeaderProps, ref: Ref<HTMLDivElement>) => {
        const { albumArtistId } = useParams() as { albumArtistId: string };
        const server = useCurrentServer();
        const { t } = useTranslation();
        const detailQuery = useAlbumArtistDetail({
            query: { id: albumArtistId },
            serverId: server?.id,
        });

        const metadataItems = [
            {
                enabled: detailQuery?.data?.albumCount,
                id: 'albumCount',
                secondary: false,
                value: t('entity.albumWithCount', { count: detailQuery?.data?.albumCount || 0 }),
            },
            {
                enabled: detailQuery?.data?.songCount,
                id: 'songCount',
                secondary: false,
                value: t('entity.trackWithCount', { count: detailQuery?.data?.songCount || 0 }),
            },
            {
                enabled: detailQuery.data?.duration,
                id: 'duration',
                secondary: true,
                value:
                    detailQuery?.data?.duration && formatDurationString(detailQuery.data.duration),
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
                ref={ref}
                background={background}
                imageUrl={detailQuery?.data?.imageUrl}
                item={{ route: AppRoute.LIBRARY_ALBUM_ARTISTS, type: LibraryItem.ALBUM_ARTIST }}
                title={detailQuery?.data?.name || ''}
            >
                <Stack>
                    <Group>
                        {metadataItems
                            .filter((i) => i.enabled)
                            .map((item, index) => (
                                <Fragment key={`item-${item.id}-${index}`}>
                                    {index > 0 && <Text $noSelect>•</Text>}
                                    <Text $secondary={item.secondary}>{item.value}</Text>
                                </Fragment>
                            ))}
                        {showRating && (
                            <>
                                <Text $noSelect>•</Text>
                                <Rating
                                    readOnly={
                                        detailQuery?.isFetching || updateRatingMutation.isLoading
                                    }
                                    value={detailQuery?.data?.userRating || 0}
                                    onChange={handleUpdateRating}
                                />
                            </>
                        )}
                    </Group>
                </Stack>
            </LibraryHeader>
        );
    },
);
