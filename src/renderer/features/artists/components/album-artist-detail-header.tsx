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
                id: 'albumCount',
                secondary: false,
                value: `${detailQuery?.data?.albumCount} ${t('entity.album', {
                    count: detailQuery?.data?.albumCount as number,
                })}`,
            },
            {
                id: 'songCount',
                secondary: false,
                value: `${detailQuery?.data?.songCount} ${t('entity.track', {
                    count: detailQuery?.data?.songCount as number,
                })}`,
            },
            {
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
                            .filter((i) => i.value)
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
