import { useQuery } from '@tanstack/react-query';
import { forwardRef, Ref, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, useParams } from 'react-router';
import { Link } from 'react-router-dom';

import { queryKeys } from '/@/renderer/api/query-keys';
import { albumQueries } from '/@/renderer/features/albums/api/album-api';
import { LibraryHeader } from '/@/renderer/features/shared/components/library-header';
import { useSetRating } from '/@/renderer/features/shared/mutations/set-rating-mutation';
import { useContainerQuery } from '/@/renderer/hooks';
import { useSongChange } from '/@/renderer/hooks/use-song-change';
import { queryClient } from '/@/renderer/lib/react-query';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { formatDateAbsoluteUTC, formatDurationString, titleCase } from '/@/renderer/utils';
import { normalizeReleaseTypes } from '/@/renderer/utils/normalize-release-types';
import { Group } from '/@/shared/components/group/group';
import { Pill } from '/@/shared/components/pill/pill';
import { Rating } from '/@/shared/components/rating/rating';
import { Stack } from '/@/shared/components/stack/stack';
import { Text } from '/@/shared/components/text/text';
import { AlbumDetailResponse, LibraryItem, ServerType } from '/@/shared/types/domain-types';

interface AlbumDetailHeaderProps {
    background: {
        background?: string;
        blur: number;
        loading: boolean;
    };
}

export const AlbumDetailHeader = forwardRef(
    ({ background }: AlbumDetailHeaderProps, ref: Ref<HTMLDivElement>) => {
        const { albumId } = useParams() as { albumId: string };
        const server = useCurrentServer();
        const detailQuery = useQuery(
            albumQueries.detail({ query: { id: albumId }, serverId: server?.id }),
        );
        const cq = useContainerQuery();
        const { t } = useTranslation();

        const showRating =
            detailQuery?.data?.serverType === ServerType.NAVIDROME ||
            detailQuery?.data?.serverType === ServerType.SUBSONIC;

        const originalDifferentFromRelease =
            detailQuery.data?.originalDate &&
            detailQuery.data.originalDate !== detailQuery.data.releaseDate;

        const releasePrefix = originalDifferentFromRelease
            ? t('page.albumDetail.released', { postProcess: 'sentenceCase' })
            : '♫';

        const songIds = useMemo(() => {
            return new Set(detailQuery.data?.songs?.map((song) => song.id));
        }, [detailQuery.data?.songs]);

        const handleSongChange = useCallback(
            (id: string) => {
                if (songIds.has(id)) {
                    const queryKey = queryKeys.albums.detail(server?.id, { id: albumId });
                    queryClient.setQueryData<AlbumDetailResponse | undefined>(
                        queryKey,
                        (previous) => {
                            if (!previous) return undefined;

                            return {
                                ...previous,
                                playCount: previous.playCount ? previous.playCount + 1 : 1,
                            };
                        },
                    );
                }
            },
            [albumId, server?.id, songIds],
        );

        useSongChange((ids, event) => {
            if (event.event === 'play') {
                handleSongChange(ids[0]);
            }
        }, detailQuery.data !== undefined);

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
            metadataItems.splice(releaseTypes.length, 0, {
                id: 'originalDate',
                value: formatted,
            });
        }

        const updateRatingMutation = useSetRating({});

        const handleUpdateRating = (rating: number) => {
            if (!detailQuery?.data) return;

            updateRatingMutation.mutate({
                apiClientProps: { serverId: detailQuery.data.serverId },
                query: {
                    item: [detailQuery.data],
                    rating,
                },
            });
        };

        return (
            <Stack ref={cq.ref}>
                <LibraryHeader
                    imageUrl={detailQuery?.data?.imageUrl}
                    item={{ route: AppRoute.LIBRARY_ALBUMS, type: LibraryItem.ALBUM }}
                    ref={ref}
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
