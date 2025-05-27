import { forwardRef, Fragment, Ref, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { generatePath, useParams } from 'react-router';
import { Link } from 'react-router-dom';

import { queryKeys } from '/@/renderer/api/query-keys';
import { useAlbumDetail } from '/@/renderer/features/albums/queries/album-detail-query';
import { LibraryHeader, useSetRating } from '/@/renderer/features/shared';
import { useContainerQuery } from '/@/renderer/hooks';
import { useSongChange } from '/@/renderer/hooks/use-song-change';
import { queryClient } from '/@/renderer/lib/react-query';
import { AppRoute } from '/@/renderer/router/routes';
import { useCurrentServer } from '/@/renderer/store';
import { formatDateAbsoluteUTC, formatDurationString } from '/@/renderer/utils';
import { Group } from '/@/shared/components/group/group';
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
        const detailQuery = useAlbumDetail({ query: { id: albumId }, serverId: server?.id });
        const cq = useContainerQuery();
        const { t } = useTranslation();

        const showRating = detailQuery?.data?.serverType === ServerType.NAVIDROME;

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

        const metadataItems = [
            {
                id: 'releaseDate',
                value:
                    detailQuery?.data?.releaseDate &&
                    `${releasePrefix} ${formatDateAbsoluteUTC(detailQuery?.data?.releaseDate)}`,
            },
            {
                id: 'songCount',
                value: `${detailQuery?.data?.songCount} ${t('entity.track_other', {
                    count: detailQuery?.data?.songCount as number,
                })}`,
            },
            {
                id: 'duration',
                value:
                    detailQuery?.data?.duration && formatDurationString(detailQuery.data.duration),
            },
            {
                id: 'playCount',
                value: t('entity.play', {
                    count: detailQuery?.data?.playCount as number,
                }),
            },
        ];

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
                query: {
                    item: [detailQuery.data],
                    rating,
                },
                serverId: detailQuery.data.serverId,
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
                    <Stack gap="sm">
                        <Group gap="sm">
                            {metadataItems.map((item, index) => (
                                <Fragment key={`item-${item.id}-${index}`}>
                                    {index > 0 && <Text isNoSelect>•</Text>}
                                    <Text>{item.value}</Text>
                                </Fragment>
                            ))}
                            {showRating && (
                                <>
                                    <Text isNoSelect>•</Text>
                                    <Rating
                                        onChange={handleUpdateRating}
                                        readOnly={
                                            detailQuery?.isFetching ||
                                            updateRatingMutation.isLoading
                                        }
                                        value={detailQuery?.data?.userRating || 0}
                                    />
                                </>
                            )}
                        </Group>
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
