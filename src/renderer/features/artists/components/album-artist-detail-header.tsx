import { useQuery } from '@tanstack/react-query';
import { forwardRef, Fragment, Ref } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import { artistsQueries } from '/@/renderer/features/artists/api/artists-api';
import { usePlayer } from '/@/renderer/features/player/context/player-context';
import { LibraryHeader } from '/@/renderer/features/shared/components/library-header';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { formatDurationString } from '/@/renderer/utils';
import { Group } from '/@/shared/components/group/group';
import { Rating } from '/@/shared/components/rating/rating';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { LibraryItem, ServerType } from '/@/shared/types/domain-types';

export const AlbumArtistDetailHeader = forwardRef(
    (_props, ref: Ref<HTMLDivElement>) => {
        const { albumArtistId, artistId } = useParams() as {
            albumArtistId?: string;
            artistId?: string;
        };
        const routeId = (artistId || albumArtistId) as string;
        const server = useCurrentServer();
        const { t } = useTranslation();
        const detailQuery = useQuery(
            artistsQueries.albumArtistDetail({
                query: { id: routeId },
                serverId: server?.id,
            }),
        );

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

        const { setRating } = usePlayer();

        const handleUpdateRating = (rating: number) => {
            if (!detailQuery?.data) return;

            if (detailQuery.data.userRating === rating) {
                return setRating(
                    detailQuery.data._serverId,
                    [detailQuery.data.id],
                    LibraryItem.ALBUM_ARTIST,
                    0,
                );
            }

            return setRating(
                detailQuery.data._serverId,
                [detailQuery.data.id],
                LibraryItem.ALBUM_ARTIST,
                rating,
            );
        };

        const showRating = detailQuery?.data?._serverType === ServerType.NAVIDROME;

        return (
            <LibraryHeader
                imageUrl={detailQuery?.data?.imageUrl}
                item={{ route: AppRoute.LIBRARY_ALBUM_ARTISTS, type: LibraryItem.ALBUM_ARTIST }}
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
                                    readOnly={detailQuery?.isFetching}
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
